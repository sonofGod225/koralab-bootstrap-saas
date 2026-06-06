/**
 * NotificationService — façade unifiée pour envoyer une notification multi-canal.
 *
 * Story 1.14 — dispatch selon les prefs user (premier canal préféré
 * disponible). Fallback : email. Story 5.5 enrichira avec opt-outs, fenêtres
 * horaires, multi-canal simultané (notifs critiques).
 */
import type {
  ChannelName,
  NotificationChannel,
  NotificationPayload,
  NotificationPreferences,
  NotificationRecipient,
  NotificationResult,
  NotificationTemplate,
} from './types';

export interface NotificationService {
  /**
   * Envoie une notification via le canal le plus pertinent pour le recipient
   * et ses prefs.
   */
  send(
    template: NotificationTemplate,
    payload: NotificationPayload,
    recipient: NotificationRecipient,
    preferences?: NotificationPreferences,
  ): Promise<NotificationResult>;

  /**
   * Envoi forcé sur un canal donné (utile pour notifs critiques type signup
   * confirm email obligatoire).
   */
  sendVia(
    channel: ChannelName,
    template: NotificationTemplate,
    payload: NotificationPayload,
    recipient: NotificationRecipient,
  ): Promise<NotificationResult>;
}

/**
 * Détermine si un canal est utilisable pour un recipient donné en fonction
 * des champs fournis (email/phone/userId).
 */
const isChannelEligible = (channel: ChannelName, recipient: NotificationRecipient): boolean => {
  switch (channel) {
    case 'email':
      return Boolean(recipient.email);
    case 'whatsapp':
    case 'sms':
      return Boolean(recipient.phone);
    case 'push':
      return Boolean(recipient.userId);
  }
};

/**
 * Factory pour instancier le service avec un set de canaux. Chaque canal doit
 * implémenter `NotificationChannel`. Le service indexe par `channel.name`.
 *
 * @example
 *   const service = createNotificationService([
 *     new EmailStub(),
 *     new WhatsAppStub(),
 *     new SmsStub(),
 *     new PushStub(),
 *   ]);
 */
export const createNotificationService = (
  channels: ReadonlyArray<NotificationChannel>,
): NotificationService => {
  const byName = new Map<ChannelName, NotificationChannel>();
  for (const channel of channels) {
    byName.set(channel.name, channel);
  }

  const sendVia: NotificationService['sendVia'] = async (
    channelName,
    template,
    payload,
    recipient,
  ) => {
    const channel = byName.get(channelName);
    if (!channel) {
      return {
        delivered: false,
        channel: channelName,
        error: `Channel '${channelName}' non enregistré dans le service.`,
      };
    }
    return channel.send(template, payload, recipient);
  };

  const send: NotificationService['send'] = async (template, payload, recipient, preferences) => {
    // Canaux candidats : préférences user en tête, puis fallback `email`
    const preferred = preferences?.preferredChannels ?? [];
    const fallback: ReadonlyArray<ChannelName> = ['email'];
    const ordered: ReadonlyArray<ChannelName> = [...preferred, ...fallback];

    for (const channelName of ordered) {
      if (!byName.has(channelName)) {
        continue;
      }
      if (!isChannelEligible(channelName, recipient)) {
        continue;
      }
      return sendVia(channelName, template, payload, recipient);
    }

    return {
      delivered: false,
      channel: 'email',
      error: 'Aucun canal éligible pour ce destinataire (email/phone/userId tous absents).',
    };
  };

  return { send, sendVia };
};
