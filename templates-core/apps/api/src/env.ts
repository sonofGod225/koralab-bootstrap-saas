/**
 * Bindings TypeScript pour Cloudflare Workers
 *
 * À compléter au fil des stories (DB, KV, R2, Queues, secrets PSP/IA).
 */

export type Bindings = {
  ENVIRONMENT: 'development' | 'staging' | 'production';

  // === Story 0.2 : Drizzle + Neon ===
  DATABASE_URL: string;

  // === Story 1.16 : Upstash Ratelimit (optionnels — middleware no-op en dev) ===
  // À set en staging/production via :
  //   wrangler secret put UPSTASH_REDIS_REST_URL --env staging|production
  //   wrangler secret put UPSTASH_REDIS_REST_TOKEN --env staging|production
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;

  // === Story 1.6 : Sentry (monitoring erreurs) ===
  // DSN public Sentry — non secret par nature mais passé via binding Worker
  // (convention __PROJECT_NAME__). Optionnel : si absent, Sentry est no-op.
  // À set en staging/production via :
  //   wrangler secret put SENTRY_DSN --env staging|production
  // En dev local : apps/api/.dev.vars
  SENTRY_DSN?: string;

  // === Story 1.6 : Axiom (logs structurés requêtables APL) ===
  // AXIOM_TOKEN : secret (API token Axiom) — set via :
  //   wrangler secret put AXIOM_TOKEN --env staging|production
  // AXIOM_DATASET : nom du dataset, non secret — déclaré dans [vars] wrangler.toml.
  // Si l'un des deux est absent, le logger reste fonctionnel mais n'envoie rien.
  AXIOM_TOKEN?: string;
  AXIOM_DATASET?: string;

  // === Epic 25 : Observabilité in-app (status router) ===
  // Token API Sentry (lecture des issues) + slugs org/projet. Optionnels :
  // absents → le panneau Observabilité dégrade gracieusement.
  //   wrangler secret put SENTRY_AUTH_TOKEN --env staging|production
  SENTRY_AUTH_TOKEN?: string;
  SENTRY_ORG_SLUG?: string;
  SENTRY_PROJECT_SLUG?: string;
  // Destinataire des alertes ops (Story 25.16). Absent → alerte = Sentry + log.
  ALERTS_EMAIL?: string;

  // === Story 1.17 : Versioning automatique ===
  // Version produit (vX.Y.Z) injectée au deploy via `--var APP_VERSION:…`.
  // Production : tag release. Staging : git describe (vX.Y.Z-N-gSHA).
  // Absente en dev local → le code dégrade en "dev".
  APP_VERSION?: string;

  // === Story 3.1 : Better-Auth ===
  // BETTER_AUTH_SECRET : secret (clé de signature sessions/cookies) — set via :
  //   wrangler secret put BETTER_AUTH_SECRET --env staging|production
  // En dev local : apps/api/.dev.vars
  BETTER_AUTH_SECRET: string;
  // URL publique de l'API (base des routes /api/auth/*) — [vars] wrangler.toml.
  BETTER_AUTH_URL: string;
  // URL publique de l'app suite — base des liens d'invitation d'équipe
  // (Story 3.9). Déclarée dans [vars] wrangler.toml.
  APP_URL: string;

  // === Epic 24 : Back-office admin (apps/admin) ===
  // URL publique du back-office interne — base utilisée pour reconnaître les
  // requêtes d'origine admin (Origin header) afin d'appliquer l'IP whitelist.
  // Déclarée dans [vars] wrangler.toml (ex: https://admin.__PROJECT_SLUG__.com).
  ADMIN_APP_URL?: string;
  // Liste blanche d'IP (CSV) autorisées à atteindre le back-office en
  // staging/production. Vide/absente → pas d'enforcement (dev + bootstrap).
  // Set via : wrangler secret put ADMIN_IP_WHITELIST --env staging|production
  ADMIN_IP_WHITELIST?: string;
  // Namespace KV — cache des sessions (secondary storage Better-Auth).
  // Binding [[kv_namespaces]] dans wrangler.toml ; id créé via :
  //   wrangler kv namespace create SESSIONS_KV
  SESSIONS_KV: KVNamespace;

  // === Story 3.2 : Resend (emails transactionnels) ===
  // RESEND_API_KEY : secret (clé API Resend) — set via :
  //   wrangler secret put RESEND_API_KEY --env staging|production
  // En dev local : apps/api/.dev.vars. Si absent, l'envoi est no-op + loggé.
  RESEND_API_KEY?: string;
  // Expéditeur Resend — défaut `__PROJECT_NAME__ <noreply@__PROJECT_SLUG__.com>`. Tant que
  // `__PROJECT_SLUG__.com` n'est pas vérifié dans Resend (SPF/DKIM), mettre
  // `RESEND_FROM_EMAIL=onboarding@resend.dev` dans `.dev.vars` (sender
  // bac-à-sable Resend, accepté pour tout compte sans vérification DNS).
  RESEND_FROM_EMAIL?: string;

  // === Story 3.3 : Twilio (SMS OTP inscription/connexion par téléphone) ===
  // MVP : INUTILISÉS — le canal SMS et l'auth téléphone sont désactivés
  // (`CHANNELS_ENABLED.sms` / `PHONE_AUTH_ENABLED` dans `@__SCOPE__/config`).
  // Bindings conservés pour réactivation post-MVP (pas de secret à retirer).
  // Secrets — set via `wrangler secret put TWILIO_* --env staging|production`.
  // En dev local : apps/api/.dev.vars. Si absents, l'envoi SMS est no-op et le
  // code OTP est loggé en console (récupérable via `wrangler dev`).
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  // Sender ID alphanumérique enregistré chez Twilio — défaut "__PROJECT_NAME__".
  TWILIO_SENDER_ID?: string;

  // === Story 3.4 : OAuth social (Google + Microsoft) ===
  // Secrets — set via `wrangler secret put <NOM> --env staging|production`.
  // En dev local : apps/api/.dev.vars. Un provider n'est activé que si son
  // couple client_id + client_secret est présent (sinon ignoré silencieusement).
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;

  // === Epic 5 : Files (R2) ===
  // Bucket R2 pour les fichiers (logos d'organisation, pièces jointes…).
  // Binding [[r2_buckets]] dans wrangler.toml. En dev local, miniflare simule
  // le bucket automatiquement (pas besoin de le créer).
  R2: R2Bucket;

  // === Story Epic 5 : Queues (à venir) ===
  // QUEUE_FNE: Queue;
  // QUEUE_NOTIFICATIONS: Queue;
  // QUEUE_OCR: Queue;

  // === Queues (generic core ships none — add producers/consumers per vertical) ===

  // === Epic 4 (Story 4.3-4.4) : Stripe billing — abonnements __PROJECT_NAME__ ===
  // Secrets — set via `wrangler secret put STRIPE_* --env staging|production`.
  // En dev local : apps/api/.dev.vars (cf. .dev.vars.example).
  // Les 3 vars sont requis dès qu'on active le router billing (Story 4.3).
  // STRIPE_PRICE_IDS_JSON : JSON `{ "starter": { "monthly": "price_…", … }, … }`
  // — Free n'a pas de Price (bootstrap interne). Validation au boot via
  // `assertPriceIdsComplete()` de @__SCOPE__/payments/billing.
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_IDS_JSON?: string;
  /**
   * Task #12 — Paystack billing (cycles `quarterly` | `biannual` | `annual` ;
   * `monthly` reste Stripe-only). Tous optionnels : si absents, le router
   * billing refuse les checkouts `method='paystack'` mais Stripe continue
   * de fonctionner. Secrets — set via :
   *   wrangler secret put PAYSTACK_SECRET_KEY      --env staging|production
   *   wrangler secret put PAYSTACK_WEBHOOK_SECRET  --env staging|production  # facultatif (sinon réutilise SECRET_KEY)
   *   wrangler secret put PAYSTACK_PLAN_CODES_JSON --env staging|production
   * `PAYSTACK_PLAN_CODES_JSON` : JSON mappant (planCode × cycle) → `PLN_…`,
   * seedé via le Paystack Dashboard. Cycle `monthly` exclu.
   */
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_WEBHOOK_SECRET?: string;
  PAYSTACK_PLAN_CODES_JSON?: string;
  /**
   * Mode strict du middleware `requireActiveSubscription` (Story 4.2).
   * `'true'` → bloque les procédures applicatives si pas d'abonnement actif.
   * Défaut (toute autre valeur ou absent) → log uniquement, n'interrompt pas.
   * À activer post-Epic 4 stable + revisit onboarding stubs (task #13).
   */
  STRICT_SUBSCRIPTION_GATE?: string;

  // === Story Epic 9 : PSP secrets (encaissements clients PME — pas Stripe billing) ===
  // WAVE_API_KEY: string;
  // WAVE_WEBHOOK_SECRET: string;
  // FLUTTERWAVE_SECRET_KEY: string;
  // (PAYSTACK_* est déjà déclaré au-dessus pour le billing — réutilisé Epic 9.)

  // === Story Epic 11 : IA providers ===
  // ANTHROPIC_API_KEY: string;
  // OPENAI_API_KEY: string;

  // === Story Epic 5 : Notifications ===
  // RESEND_API_KEY: string;
  // TWILIO_ACCOUNT_SID: string;
  // TWILIO_AUTH_TOKEN: string;
  // TWILIO_SENDER_ID: string;
  // META_WHATSAPP_BUSINESS_PHONE_ID: string;
  // META_WHATSAPP_TOKEN: string;
};
