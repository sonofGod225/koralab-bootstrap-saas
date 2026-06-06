/**
 * PostHog — analytics produit + feature flags côté client (Story 1.6)
 *
 * apps/suite tourne en SSR (TanStack Start + Cloudflare Workers). PostHog
 * ne s'initialise que dans le navigateur (garde `import.meta.env.SSR`).
 *
 * La Project API Key est PUBLIQUE (inlinée au build via `VITE_PUBLIC_POSTHOG_KEY`,
 * comme le DSN Sentry). Si elle est absente, `initPostHog()` est un no-op.
 *
 * Région : PostHog Cloud EU — résidence des données (RGPD, cohérent avec la
 * DB Neon EU Frankfurt). Projet PostHog unique `__PROJECT_SLUG__` partagé entre
 * `apps/suite` et `apps/admin` ; la property `app` distingue les deux surfaces.
 */
import posthog from 'posthog-js';

const DEFAULT_API_HOST = 'https://eu.i.posthog.com';

/**
 * Initialise PostHog côté navigateur. À appeler une seule fois au bootstrap
 * client. No-op côté serveur ou si `VITE_PUBLIC_POSTHOG_KEY` est absente.
 */
export function initPostHog(): void {
  // Garde SSR : posthog-js ne doit s'initialiser que dans le navigateur.
  if (import.meta.env.SSR) return;

  const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST ?? DEFAULT_API_HOST,
    // Défauts modernes : capture des pageviews sur navigation SPA (TanStack
    // Router), autocapture, web vitals.
    defaults: '2025-05-24',
    // RGPD : aucun profil personne pour les visiteurs anonymes — un profil
    // n'est créé qu'après `posthog.identify()` (post-login, Epic 3).
    person_profiles: 'identified_only',
    // App financière (données clients sensibles) : enregistrement de session
    // désactivé pour le MVP. À réactiver délibérément avec masquage strict.
    disable_session_recording: true,
  });

  // Properties globales : `app` distingue l'app cliente du backoffice,
  // `environment` sépare staging de production (projet PostHog unique
  // partagé, sans séparation d'environnement native — cf. Story 1.6).
  posthog.register({ app: 'suite', environment: import.meta.env.MODE });
}

export { posthog };
