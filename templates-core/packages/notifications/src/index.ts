/**
 * @__SCOPE__/notifications — Service de notifications multi-canal
 *
 * Foundation Story 1.14. Providers réels :
 * - Story 5.2 : EmailResend (Resend API) — câblé en avance pour l'Epic 3
 *   (templates `auth.*` ; les templates métier suivront).
 * - Story 5.3 : WhatsAppMeta (Meta WhatsApp Business) — encore stub.
 * - Story 5.4 : SmsTwilio (Twilio Africa) — câblé en avance pour l'Epic 3
 *   (template `auth.phoneOtp`). WebPush encore stub.
 * - Story 5.5 : préférences user + opt-out.
 */
export type {
  ChannelName,
  NotificationChannel,
  NotificationPayload,
  NotificationPreferences,
  NotificationRecipient,
  NotificationResult,
  NotificationTemplate,
} from './types';

// Canaux réels (providers câblés).
export { EmailResend, type EmailResendConfig } from './channels/email-resend';
export { SmsTwilio, type SmsTwilioConfig } from './channels/sms-twilio';

// Canaux encore en stub (Story 1.14) — providers câblés Stories 5.3+.
export { EmailStub } from './channels/email-stub';
export { WhatsAppStub } from './channels/whatsapp-stub';
export { SmsStub } from './channels/sms-stub';
export { PushStub } from './channels/push-stub';

export type { NotificationService } from './service';
export { createNotificationService } from './service';
