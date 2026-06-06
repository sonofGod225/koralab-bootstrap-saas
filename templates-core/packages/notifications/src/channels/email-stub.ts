/**
 * Email stub — Story 1.14. Provider réel (Resend) câblé Story 5.2.
 */
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationRecipient,
  NotificationResult,
  NotificationTemplate,
} from '../types';

export class EmailStub implements NotificationChannel {
  readonly name = 'email' as const;

  async send(
    template: NotificationTemplate,
    _payload: NotificationPayload,
    recipient: NotificationRecipient,
  ): Promise<NotificationResult> {
    const target = recipient.email ?? '<no-email>';
    console.warn(`[NotificationStub] email/${template} → ${target}`);
    return Promise.resolve({
      delivered: false,
      channel: 'email',
      stubbed: true,
    });
  }
}
