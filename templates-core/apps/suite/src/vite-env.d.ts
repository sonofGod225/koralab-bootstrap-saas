/// <reference types="vite/client" />

/**
 * Typage des variables d'environnement Vite exposées au client (Story 1.6).
 *
 * Les vars `VITE_*` sont inlinées dans le bundle au build. Toutes optionnelles :
 * absentes → le code dépendant doit dégrader proprement (no-op).
 */
interface ImportMetaEnv {
  /** URL de l'API Hono (apps/api). */
  readonly VITE_API_URL?: string;
  /** DSN public Sentry — monitoring erreurs côté client. */
  readonly VITE_SENTRY_DSN?: string;
  /** Project API Key publique PostHog (Story 1.6). */
  readonly VITE_PUBLIC_POSTHOG_KEY?: string;
  /** Host d'ingestion PostHog (Story 1.6). */
  readonly VITE_PUBLIC_POSTHOG_HOST?: string;
  /** Version produit, inlinée au build (Story 1.17). Absente → "dev". */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
