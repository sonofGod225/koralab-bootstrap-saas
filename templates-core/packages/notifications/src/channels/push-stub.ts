/**
 * Web Push stub — Story 1.14. Provider réel (Web Push standard) câblé Story 5.4.
 */
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationRecipient,
  NotificationResult,
  NotificationTemplate,
} from '../types';

export class PushStub implements NotificationChannel {
  readonly name = 'push' as const;

  async send(
    template: NotificationTemplate,
    _payload: NotificationPayload,
    recipient: NotificationRecipient,
  ): Promise<NotificationResult> {
    const target = recipient.userId ?? '<no-user>';
    console.warn(`[NotificationStub] push/${template} → ${target}`);
    return Promise.resolve({
      delivered: false,
      channel: 'push',
      stubbed: true,
    });
  }
}
