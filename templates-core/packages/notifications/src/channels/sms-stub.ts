/**
 * SMS stub — Story 1.14. Provider réel (Twilio Africa) câblé Story 5.4.
 */
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationRecipient,
  NotificationResult,
  NotificationTemplate,
} from '../types';

export class SmsStub implements NotificationChannel {
  readonly name = 'sms' as const;

  async send(
    template: NotificationTemplate,
    _payload: NotificationPayload,
    recipient: NotificationRecipient,
  ): Promise<NotificationResult> {
    const target = recipient.phone ?? '<no-phone>';
    console.warn(`[NotificationStub] sms/${template} → ${target}`);
    return Promise.resolve({
      delivered: false,
      channel: 'sms',
      stubbed: true,
    });
  }
}
