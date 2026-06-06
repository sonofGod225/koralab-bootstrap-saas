/**
 * Canal SMS — provider Twilio (Story 5.4, câblage anticipé pour l'Epic 3).
 *
 * Remplace `SmsStub` pour le template `auth.phoneOtp` (code OTP de
 * l'inscription/connexion par téléphone). Tolérant à la config : si les
 * identifiants Twilio sont absents, l'envoi est un no-op tracé — le corps du
 * SMS (donc le code OTP) est loggé pour le dev local.
 *
 * Le coût de chaque SMS est journalisé via le `Logger` fourni (AC Story 3.3).
 */
import type { Logger } from '@__SCOPE__/types';
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationRecipient,
  NotificationResult,
  NotificationTemplate,
} from '../types';

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01/Accounts';
/** Coût estimé d'un SMS vers l'Afrique de l'Ouest (FCFA) — cf. AC Story 3.3. */
const ESTIMATED_SMS_COST_XOF = 30;

export interface SmsTwilioConfig {
  accountSid?: string;
  authToken?: string;
  /** Sender ID alphanumérique enregistré chez Twilio — défaut "__PROJECT_NAME__". */
  senderId?: string;
  log?: Logger;
}

/** Corps du SMS pour un template donné, ou `null` si le template n'est pas câblé. */
function smsBody(template: NotificationTemplate, payload: NotificationPayload): string | null {
  if (template === 'auth.phoneOtp') {
    return `__PROJECT_NAME__ : votre code de vérification est ${String(
      payload.code ?? '',
    )}. Il expire dans 5 minutes. Ne le partagez avec personne.`;
  }
  return null;
}

export class SmsTwilio implements NotificationChannel {
  readonly name = 'sms' as const;
  readonly #accountSid?: string;
  readonly #authToken?: string;
  readonly #senderId: string;
  readonly #log?: Logger;

  constructor(config: SmsTwilioConfig = {}) {
    this.#accountSid = config.accountSid;
    this.#authToken = config.authToken;
    this.#senderId = config.senderId ?? '__PROJECT_NAME__';
    this.#log = config.log;
  }

  async send(
    template: NotificationTemplate,
    payload: NotificationPayload,
    recipient: NotificationRecipient,
  ): Promise<NotificationResult> {
    if (!recipient.phone) {
      return { delivered: false, channel: 'sms', error: 'Destinataire sans numéro de téléphone.' };
    }

    const body = smsBody(template, payload);
    if (!body) {
      return { delivered: false, channel: 'sms', error: `Template SMS '${template}' non câblé.` };
    }

    if (!this.#accountSid || !this.#authToken) {
      console.warn(
        `[SmsTwilio] identifiants Twilio absents — SMS '${template}' non envoyé à ${recipient.phone}. Corps : ${body}`,
      );
      return { delivered: false, channel: 'sms', stubbed: true };
    }

    try {
      const res = await fetch(`${TWILIO_API_BASE}/${this.#accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${this.#accountSid}:${this.#authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: recipient.phone, From: this.#senderId, Body: body }),
      });

      if (!res.ok) {
        const detail = await res.text();
        this.#log?.error('sms.failed', { to: recipient.phone, status: res.status, detail });
        return { delivered: false, channel: 'sms', error: `Twilio a répondu ${res.status}` };
      }

      const result = (await res.json()) as { sid?: string; status?: string };
      // Coût SMS journalisé (AC 3.3) — Twilio ne renvoie le prix réel qu'après
      // livraison, on logge donc une estimation Afrique de l'Ouest.
      this.#log?.info('sms.sent', {
        to: recipient.phone,
        provider: 'twilio',
        messageSid: result.sid,
        status: result.status,
        estimatedCostXof: ESTIMATED_SMS_COST_XOF,
      });
      return { delivered: true, channel: 'sms', providerId: result.sid };
    } catch (err) {
      this.#log?.error('sms.error', {
        to: recipient.phone,
        message: err instanceof Error ? err.message : 'unknown',
      });
      return {
        delivered: false,
        channel: 'sms',
        error: err instanceof Error ? err.message : 'erreur réseau Twilio',
      };
    }
  }
}
