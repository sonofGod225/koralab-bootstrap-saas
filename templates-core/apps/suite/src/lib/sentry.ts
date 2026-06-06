/**
 * Sentry — monitoring erreurs côté client (Story 1.6)
 *
 * apps/suite tourne en SSR (TanStack Start + Cloudflare Workers). Cette
 * instrumentation cible le runtime navigateur uniquement : `@sentry/react`
 * n'est pas conçu pour le runtime Worker (l'instrumentation server-side du
 * Worker SSR sera traitée ultérieurement, cf. dette Story 1.6).
 *
 * Le DSN est inliné au build par Vite via `VITE_SENTRY_DSN` (DSN public,
 * non secret). Si la var est absente, `initSentry()` est un no-op : aucun
 * échec de build ni d'exécution.
 */
import * as Sentry from '@sentry/react';

/**
 * Initialise Sentry côté navigateur. À appeler une seule fois au bootstrap
 * client. No-op si exécuté côté serveur ou si `VITE_SENTRY_DSN` est absent.
 */
export function initSentry(): void {
  // Garde SSR : `@sentry/react` ne doit s'initialiser que dans le navigateur.
  if (import.meta.env.SSR) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // MVP : échantillonnage complet des traces. À réduire (0.1–0.2) une fois
    // le volume de trafic significatif.
    tracesSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration()],
    // Pas de PII par défaut (RGPD / données clients sensibles __PROJECT_NAME__).
    sendDefaultPii: false,
  });
}
