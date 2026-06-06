/**
 * Canal email — provider Resend (Story 5.2, câblage anticipé pour l'Epic 3).
 *
 * Remplace `EmailStub` pour les templates `auth.*`. Le HTML est produit par
 * les composants react-email (`../email/render`). Tolérant à la config : si
 * `apiKey` est absent, l'envoi est un no-op tracé (dev local sans clé Resend).
 *
 * NB : l'expéditeur `noreply@__PROJECT_SLUG__.com` exige que le domaine soit vérifié
 * dans Resend (SPF/DKIM) avant tout envoi vers des destinataires tiers.
 */
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationRecipient,
  NotificationResult,
  NotificationTemplate,
} from '../types';
import { renderEmailTemplate } from '../email/render';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = '__PROJECT_NAME__ <noreply@__PROJECT_SLUG__.com>';

export interface EmailResendConfig {
  apiKey?: string;
  from?: string;
}

export class EmailResend implements NotificationChannel {
  readonly name = 'email' as const;
  readonly #apiKey?: string;
  readonly #from: string;

  constructor(config: EmailResendConfig = {}) {
    this.#apiKey = config.apiKey;
    this.#from = config.from ?? DEFAULT_FROM;
  }

  async send(
    template: NotificationTemplate,
    payload: NotificationPayload,
    recipient: NotificationRecipient,
  ): Promise<NotificationResult> {
    if (!recipient.email) {
      return { delivered: false, channel: 'email', error: 'Destinataire sans adresse email.' };
    }

    const rendered = await renderEmailTemplate(template, payload);
    if (!rendered) {
      return {
        delivered: false,
        channel: 'email',
        error: `Template email '${template}' non câblé.`,
      };
    }

    if (!this.#apiKey) {
      console.warn(
        `[EmailResend] RESEND_API_KEY absent — email '${template}' non envoyé à ${recipient.email}`,
      );
      return { delivered: false, channel: 'email', stubbed: true };
    }

    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.#apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.#from,
          to: recipient.email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        }),
      });

      if (!res.ok) {
        return {
          delivered: false,
          channel: 'email',
          error: `Resend a répondu ${res.status} : ${await res.text()}`,
        };
      }

      const body = (await res.json()) as { id?: string };
      return { delivered: true, channel: 'email', providerId: body.id };
    } catch (err) {
      return {
        delivered: false,
        channel: 'email',
        error: err instanceof Error ? err.message : 'erreur réseau Resend',
      };
    }
  }
}
