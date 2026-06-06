/**
 * AppError — erreurs métier typées
 *
 * Pattern : tous les codes d'erreur sont des string literals discriminés (`code`).
 * Permet l'exhaustiveness check dans les switch côté handlers tRPC + i18n côté UI.
 *
 * Référence : architecture.md step 5 patterns "AppError + ResultPattern".
 */

export type ErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  /**
   * Story 7.2 — l'onboarding obligatoire (Steps 1-6) n'est pas terminé.
   * `details.redirectTo` porte la route où renvoyer l'utilisateur.
   */
  | 'ONBOARDING_REQUIRED'
  /**
   * Story 4.2 — pas de subscription active (`active` ou `trialing`) sur
   * l'organisation. Levée uniquement en mode strict
   * (`STRICT_SUBSCRIPTION_GATE='true'`). `details.redirectTo` pointe vers
   * `/settings/billing/plans` pour que le client navigue.
   */
  | 'SUBSCRIPTION_REQUIRED'
  /**
   * Story 3.22 (ADR 0011) — une procédure protégée par `requireModuleActive`
   * cible un module absent de `subscription.modules_enabled`. `details.module`
   * porte le code module, `details.redirectTo = '/settings/modules'` pour
   * permettre à l'UI un upsell plutôt qu'un 403 opaque.
   */
  | 'MODULE_INACTIVE';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export const isAppError = (err: unknown): err is AppError =>
  err instanceof AppError || (err instanceof Error && err.name === 'AppError');
