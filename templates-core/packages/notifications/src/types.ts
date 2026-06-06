/**
 * Types fondamentaux du service de notifications __PROJECT_NAME__.
 *
 * Story 1.14 — shell + stubs. Le wiring production (Resend, Meta WhatsApp,
 * Twilio Africa, Web Push) est câblé Stories 5.2-5.4 où on dispose des
 * credentials externes et de la vérification Meta (7-14 jours).
 *
 * Référence : architecture.md step 5 + PRD section "Notifications opt-out".
 */

/**
 * Templates de notification disponibles MVP. Chaque template est une union
 * stricte ; les modules métier (facturation, encaissements, etc.) en ajoutent
 * via declaration merging si besoin.
 */
export type NotificationTemplate =
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'onboarding.welcome'
  | 'onboarding.dayMinus7'
  | 'payment.confirmed'
  | 'auth.signup.confirm'
  | 'auth.emailOtp'
  | 'auth.passwordReset'
  | 'auth.passwordChanged'
  | 'auth.phoneOtp'
  | 'auth.teamInvitation'
  | 'contacts.import.summary'
  | 'catalogue.import.summary'
  | 'billing.trialEnding'
  | 'billing.paymentFailed';

/**
 * Identifiants des 4 canaux supportés MVP.
 */
export type ChannelName = 'email' | 'whatsapp' | 'sms' | 'push';

/**
 * Destinataire d'une notification. Au moins un des trois champs doit être
 * fourni — le service choisira le canal en fonction des prefs user (Story 5.5)
 * et des champs disponibles.
 */
export interface NotificationRecipient {
  readonly email?: string;
  readonly phone?: string;
  /** Utilisateur cible (pour Web Push tokens + prefs canal lookup). */
  readonly userId?: string;
}

/**
 * Préférences user — utilisé par le service pour choisir le canal.
 * Story 1.14 : structure minimale ; Story 5.5 enrichira (opt-out, plages
 * horaires, langue).
 */
export interface NotificationPreferences {
  /** Liste ordonnée des canaux préférés. Premier disponible = utilisé. */
  readonly preferredChannels?: ReadonlyArray<ChannelName>;
}

/**
 * Résultat d'un envoi via un canal donné.
 */
export interface NotificationResult {
  readonly delivered: boolean;
  readonly channel: ChannelName;
  /** ID retourné par le provider (Resend message-id, Meta WAMID, etc.). */
  readonly providerId?: string;
  /** True si le canal est un stub (Story 1.14) — utile pour les tests. */
  readonly stubbed?: boolean;
  /** Erreur éventuelle, format string ; details structurés en Story 5.x. */
  readonly error?: string;
}

/**
 * Payload d'une notification, opaque côté service (chaque template définit
 * sa forme côté templates registry — Story 5.5+).
 */
export type NotificationPayload = Record<string, unknown>;

/**
 * Contract d'un canal de notification (email/whatsapp/sms/push).
 * Story 1.14 : 4 stubs. Stories 5.2-5.4 : impls réelles.
 */
export interface NotificationChannel {
  readonly name: ChannelName;
  send(
    template: NotificationTemplate,
    payload: NotificationPayload,
    recipient: NotificationRecipient,
  ): Promise<NotificationResult>;
}
