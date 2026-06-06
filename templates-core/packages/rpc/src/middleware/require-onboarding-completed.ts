/**
 * require-onboarding-completed middleware (Story 7.2, Epic 7)
 *
 * Bloque l'accès aux procédures applicatives tant que l'onboarding obligatoire
 * (Steps 1-3 du wizard entreprise : company → user → consent) n'est pas terminé
 * pour l'organisation active. Le statut est lu depuis
 * [`onboarding_progress.completed_obligatory_at`](../../../db/src/schemas/onboarding.ts).
 *
 * Comportement :
 * - Bypass automatique pour `onboarding.*`, `auth.*`, `billing.*` et `health.*`
 *   (l'utilisateur doit pouvoir compléter son wizard et accéder à la
 *   facturation de plan même si l'onboarding est incomplet).
 * - Si l'onboarding obligatoire n'est pas terminé → redirige vers `/onboarding`
 *   (la route index résout l'étape courante via `stage` et rouvre le bon écran).
 * - Sinon `next()`.
 *
 * Format de l'erreur : `TRPCError({ code: 'PRECONDITION_FAILED' })` avec une
 * `cause: AppError('ONBOARDING_REQUIRED', ..., { redirectTo, currentStage })`.
 * L'`errorFormatter` ([`trpc.ts`](../trpc.ts)) expose `budiCode` et
 * `budiDetails.redirectTo` au client — le global error boundary `apps/suite`
 * lit ces champs pour naviguer vers la bonne étape.
 *
 * Câblage : ce middleware n'est PAS chaîné par défaut. Un futur `appProcedure`
 * (`orgProcedure.use(requireOnboardingCompleted)`) sera créé quand le router
 * `onboarding` arrivera (Stories 7.3+). Les modules métier (facturation,
 * encaissements, crm) utiliseront `appProcedure` pour leurs procédures.
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { eq, onboardingProgress } from '@__SCOPE__/db';
import { AppError } from '@__SCOPE__/types';
import type { RpcContext } from '../context';

const t = initTRPC.context<RpcContext>().create();

/**
 * Préfixes de procédures qui doivent rester accessibles même quand
 * l'onboarding obligatoire n'est pas terminé.
 *
 * - `onboarding.*` : par définition, pour avancer dans le wizard.
 * - `auth.*` : pour signOut, refresh session, etc.
 * - `billing.*` : pour gérer le plan depuis les paramètres même si l'onboarding
 *   est incomplet (le plan est désormais post-onboarding).
 * - `health.*` : sondes opérationnelles.
 */
const BYPASS_PREFIXES = ['onboarding.', 'auth.', 'billing.', 'health.'] as const;

/**
 * Route de bounce-back vers le wizard. La route index `/onboarding` lit
 * `stage`/`completedObligatoryAt` et rouvre l'écran courant (company → user →
 * consent), donc une cible unique suffit — pas de mapping par étape.
 */
const ONBOARDING_ENTRY_ROUTE = '/onboarding';

export const requireOnboardingCompleted = t.middleware(async ({ ctx, next, path }) => {
  // 1) Bypass des chemins qui doivent rester accessibles.
  if (BYPASS_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return next();
  }

  // 2) Sans organisation active, on laisse `requireOrg` (chaîné en amont par
  //    `orgProcedure`) gérer l'erreur — ce middleware n'a rien à valider.
  if (!ctx.org) {
    return next();
  }

  // 3) Lookup de l'état d'onboarding de l'organisation active.
  const [row] = await ctx.db
    .select({
      completedObligatoryAt: onboardingProgress.completedObligatoryAt,
      currentStep: onboardingProgress.currentStep,
    })
    .from(onboardingProgress)
    .where(eq(onboardingProgress.organizationId, ctx.org.id))
    .limit(1);

  // 4) Si l'onboarding obligatoire (consent) est validé, pas de blocage.
  if (row?.completedObligatoryAt) {
    return next();
  }

  // 5) Sinon, on lève PRECONDITION_FAILED avec la route de bounce-back vers le
  //    wizard (l'index résout l'étape courante).
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: 'Onboarding obligatoire non terminé. Complétez les Steps 1 à 3.',
    cause: new AppError(
      'ONBOARDING_REQUIRED',
      "L'onboarding obligatoire (company, profil, consentement) doit être terminé pour accéder à l'application.",
      { redirectTo: ONBOARDING_ENTRY_ROUTE, currentStep: row?.currentStep ?? 1 },
    ),
  });
});
