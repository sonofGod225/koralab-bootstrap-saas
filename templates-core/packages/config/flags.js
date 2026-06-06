/**
 * Feature flags MVP — source de vérité unique, partagée backend (auth, rpc) et
 * frontend (suite). Désactivations volontaires pour le lancement MVP ;
 * réactivation = repasser la valeur à `true` / élargir le tableau.
 *
 * Le code des fonctionnalités désactivées est CONSERVÉ (réversible) :
 *  - SMS / WhatsApp : canaux de notification + OTP d'auth par téléphone.
 *  - Méthodes de paiement non-Stripe : Paystack, Wave, Orange Money,
 *    Free Money, virement bancaire.
 *
 * @type {{ email: boolean, sms: boolean, whatsapp: boolean, push: boolean }}
 */
export const CHANNELS_ENABLED = {
  email: true,
  sms: false,
  whatsapp: false,
  push: false,
};

/**
 * Inscription / connexion par numéro de téléphone (OTP SMS, Story 3.3).
 * Dépend du canal SMS — désactivé au MVP. MVP = email + OAuth uniquement.
 *
 * @type {boolean}
 */
export const PHONE_AUTH_ENABLED = false;

/**
 * Méthodes de paiement proposées au client au MVP. Carte via Stripe uniquement.
 * Paystack / Wave / Orange Money (`om`) / Free Money (`fm`) / virement
 * bancaire (`virement`) sont câblés mais hors-MVP.
 *
 * @type {readonly string[]}
 */
export const BILLING_METHODS_ENABLED = ['stripe'];
