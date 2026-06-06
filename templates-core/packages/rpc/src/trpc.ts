/**
 * tRPC core — initialisation + procedure builders
 *
 * Référence : architecture.md step 5 patterns (AppError → TRPCError mapping).
 *
 * Exports :
 * - `router`           — factory pour créer des sub-routers
 * - `publicProcedure`  — base, pas de middleware
 * - `protectedProcedure` — chaîne `requireAuth` (Story 3.1 câblera la vraie session)
 * - `orgProcedure`     — chaîne `requireAuth` + `requireOrg` (Story 3.6 câblera tenant)
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { isAppError } from '@__SCOPE__/types';
import type { RpcContext } from './context';
import { requireAuth } from './middleware/require-auth';
import { requireOrg } from './middleware/require-org';
import { requireEstablishment } from './middleware/require-establishment';
import { auditMiddleware } from './middleware/audit';
import { requireOnboardingCompleted } from './middleware/require-onboarding-completed';
import { requireStaffRole } from './middleware/require-staff-role';

const t = initTRPC.context<RpcContext>().create({
  errorFormatter: ({ shape, error }) => {
    // Mapper AppError métier → TRPCError pour les consumers (apps/suite)
    if (isAppError(error.cause)) {
      return {
        ...shape,
        data: {
          ...shape.data,
          budiCode: error.cause.code,
          budiDetails: error.cause.details ?? null,
        },
      };
    }
    return shape;
  },
});

export const router = t.router;
export const middleware = t.middleware;
/** Factory de caller serveur (Epic 25 — `/status.json` côté apps/api). */
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;

/**
 * Procedure protégée par auth. Story 1.12 → middleware stub (throws UNAUTHORIZED).
 * Story 3.1 (Better-Auth) câblera la vraie session.
 */
export const protectedProcedure = publicProcedure.use(requireAuth);

/**
 * Procedure scopée tenant (organization). Story 1.12 → middleware stub (throws FORBIDDEN).
 * Story 3.6 (multi-org switching) câblera ctx.org via cookie current_org_id.
 */
export const orgProcedure = protectedProcedure.use(requireOrg);

/**
 * Procedure scopée établissement (Story 3.19, ADR 0012) — `orgProcedure` +
 * `requireEstablishment`. Peuple `ctx.establishment` (établissement actif validé :
 * invariant `établissement ⊂ org`, owner/admin traverse, membre borné par
 * affectation). À utiliser par les modules establishment-scoped (stock Epic 19,
 * facturation Epic 8 pour l'attribution établissement…).
 */
export const establishmentProcedure = orgProcedure.use(requireEstablishment);

/**
 * Procedure applicative — chaîne `requireAuth` + `requireOrg` + `requireOnboardingCompleted`.
 *
 * À utiliser par les modules métier (Epic 8 Facturation, Epic 9 Encaissements,
 * Epic 6 Contacts/Catalogue, Epic 13 FNE…) dont les procédures ne doivent pas
 * être accessibles tant que l'onboarding obligatoire (Steps 1-6) n'est pas
 * terminé. Le middleware lève `PRECONDITION_FAILED` avec un `AppError`
 * `'ONBOARDING_REQUIRED'` portant `details.redirectTo` que le client lit pour
 * naviguer.
 *
 * Bypass automatique pour `onboarding.*` / `auth.*` / `billing.*` / `health.*`
 * (cf. [`require-onboarding-completed`](./middleware/require-onboarding-completed.ts)) —
 * pas besoin de les exclure manuellement, on peut donc utiliser `appProcedure`
 * pour absolument tous les routers métier.
 *
 * @example
 *   import { appProcedure, router } from '@__SCOPE__/rpc';
 *   export const invoicesRouter = router({
 *     create: appProcedure.input(InvoiceCreateSchema).mutation(...)
 *   });
 */
export const appProcedure = orgProcedure.use(requireOnboardingCompleted);

/**
 * Procedure applicative **scopée établissement** — `appProcedure` + `requireEstablishment`
 * (org + onboarding + `ctx.establishment` peuplé). À utiliser par les entités centrales
 * et modules dont l'affichage est filtré par l'établissement actif (Epic 6 Contacts/Catalogue
 * en lecture/écriture scopée ; la recherche transfrontalière reste sur `appProcedure`). Le
 * filtre de visibilité (`establishment_id IS NULL OR = ctx.establishment`, ADR 0013 §2) est
 * appliqué par le helper unique `services/visibility.ts` — jamais réécrit à la main.
 */
export const appEstablishmentProcedure = appProcedure.use(requireEstablishment);

/**
 * Procedure auditée. Story 1.15 — chaque mutation réussie est loggée dans
 * `audit_log` (action = procedure path, input redacté, ip, user-agent).
 *
 * Story 1.15 NE CÂBLE PAS automatiquement le middleware au stack par défaut :
 * chaque module métier (Epic 3+ identity, Epic 8 facturation, Epic 9 paiements,
 * Epic 13 FNE) activera ses procedures auditables explicitement via ce builder.
 *
 * @example
 *   import { auditedProtectedProcedure } from '@__SCOPE__/rpc';
 *   export const invoicesRouter = router({
 *     create: auditedProtectedProcedure
 *       .input(InvoiceCreateSchema)
 *       .mutation(({ input, ctx }) => ...)
 *   });
 */
export const auditedProtectedProcedure = protectedProcedure.use(auditMiddleware);

/**
 * Procedure staff cross-tenant (Epic 24 — back-office `apps/admin`).
 *
 * Chaîne `requireAuth` + `requireStaffRole` (`user.role === 'admin'`). À utiliser
 * pour TOUTES les procédures du routeur `admin` (lectures cross-tenant + actions
 * support). N'est PAS scopée à une organisation : pas de `requireOrg` — les
 * requêtes filtrent explicitement (aucune RLS Postgres).
 */
export const staffProcedure = protectedProcedure.use(requireStaffRole);

/**
 * Procedure staff auditée — `staffProcedure` + `auditMiddleware`. À utiliser
 * pour les mutations support (suspendre une org, changer un plan, rejouer un
 * webhook…) afin de tracer l'action dans `audit_log`.
 */
export const auditedStaffProcedure = staffProcedure.use(auditMiddleware);

/** Helper pour throw TRPCError de manière idiomatique */
export const trpcError = (code: TRPCError['code'], message: string, cause?: unknown): TRPCError =>
  new TRPCError({ code, message, cause });
