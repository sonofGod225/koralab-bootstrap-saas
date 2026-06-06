/**
 * WhatsApp stub — Story 1.14. Provider réel (Meta WhatsApp Business) câblé
 * Story 5.3 — PRÉREQUIS Story 0.3 vérification Meta 7-14 jours.
 */
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationRecipient,
  NotificationResult,
  NotificationTemplate,
} from '../types';

export class WhatsAppStub implements NotificationChannel {
  readonly name = 'whatsapp' as const;

  async send(
    template: NotificationTemplate,
    _payload: NotificationPayload,
    recipient: NotificationRecipient,
  ): Promise<NotificationResult> {
    const target = recipient.phone ?? '<no-phone>';
    console.warn(`[NotificationStub] whatsapp/${template} → ${target}`);
    return Promise.resolve({
      delivered: false,
      channel: 'whatsapp',
      stubbed: true,
    });
  }
}
