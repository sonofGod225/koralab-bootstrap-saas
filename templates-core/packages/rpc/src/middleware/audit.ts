/**
 * Audit middleware — log automatique des mutations tRPC dans `audit_log`.
 *
 * Story 1.15 (foundation) ; Story 3.12 a câblé la redaction PII récursive
 * (`redact()` de `@__SCOPE__/db`) et l'immuabilité de la table (trigger
 * Postgres append-only).
 *
 * Comportement :
 * - Ne loggue QUE les mutations réussies (`type === 'mutation'`, pas d'erreur)
 * - Capture : action (procedure path), input redacté, ip, user-agent, user, session
 * - Pas de blocage en cas d'échec d'insertion (audit best-effort, ne doit pas
 *   casser la procedure métier)
 *
 * Câblage : Story 1.15 ne câble PAS automatiquement au stack. On expose un
 * builder `auditedProtectedProcedure = protectedProcedure.use(audit)` que
 * chaque module activera explicitement Story 3.x+.
 */
import { initTRPC } from '@trpc/server';
import { auditLog, redact } from '@__SCOPE__/db';
import type { NewAuditLogEntry } from '@__SCOPE__/db';
import type { RpcContext } from '../context';

const t = initTRPC.context<RpcContext>().create();

/**
 * Génère un ID d'audit log (UUID v4 via Web Crypto, dispo Workers + Node 20+).
 */
const generateAuditId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Tente d'extraire un `resource_id` du résultat d'une mutation. Patterns courants :
 * - mutation create → `{ id: '...' }` ou `{ <resource>Id: '...' }`
 * - mutation update → input.id ou result.id
 */
const extractResourceId = (input: unknown, result: unknown): string | null => {
  const inputId = (input as { id?: unknown })?.id;
  if (typeof inputId === 'string' && inputId.length > 0) {
    return inputId;
  }
  const resultId = (result as { id?: unknown })?.id;
  if (typeof resultId === 'string' && resultId.length > 0) {
    return resultId;
  }
  return null;
};

/**
 * Middleware d'audit. À chaîner via `protectedProcedure.use(auditMiddleware)`.
 *
 * @example
 *   import { auditedProtectedProcedure } from '@__SCOPE__/rpc';
 *   export const invoicesRouter = router({
 *     create: auditedProtectedProcedure.input(...).mutation(...)
 *   });
 */
export const auditMiddleware = t.middleware(async ({ ctx, next, path, type, getRawInput }) => {
  // Exécution de la procedure
  const result = await next();

  // On ne loggue que les mutations réussies. Les queries sont read-only ; les
  // failures peuvent leak du contexte sensible (Story 14.x ajoutera un log
  // dédié `audit_failure` séparé).
  if (type !== 'mutation' || !result.ok) {
    return result;
  }

  try {
    // `getRawInput()` retourne l'input brut avant parsing Zod. C'est ce qu'on
    // veut pour l'audit : le payload exact reçu, redacté.
    const rawInput = await getRawInput();

    const entry: NewAuditLogEntry = {
      id: generateAuditId(),
      organizationId: ctx.org?.id ?? '__system__',
      userId: ctx.user?.id ?? null,
      sessionId: ctx.sessionId ?? null,
      action: path,
      resourceType: null, // Chaque module métier surchargera Story 3.x+ via context.
      resourceId: extractResourceId(rawInput, result.data),
      details: { input: redact(rawInput) },
      ipAddress: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    };

    // Best-effort : on attend l'insertion pour les tests, mais on capture toute
    // erreur sans la propager (audit ne doit pas casser le métier).
    await ctx.db.insert(auditLog).values(entry);
  } catch (err) {
    console.error('[audit] insertion failed', { path, error: err });
  }

  return result;
});
