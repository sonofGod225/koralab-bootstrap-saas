/**
 * audit router — consultation du journal d'audit (Story 3.12 + 3.17).
 *
 * Procédure unique `list` paginée par offset (`page`/`pageSize` + `total`),
 * scopée à l'organisation active, protégée par `requirePermission('audit:log:read')`
 * (owner et admin par défaut, cf. seed RBAC).
 *
 * Filtres : plage de dates, type d'action (`procedure path` exact),
 * utilisateur (par id), et recherche full-text sur l'action. Tous optionnels.
 *
 * La table `audit_log` est append-only (trigger Postgres Story 3.12), et les
 * PII sensibles sont déjà redacted à l'insertion (helper `redact()` cf.
 * middleware `audit`). Cette procédure renvoie les rows tels quels.
 */
import { z } from 'zod';
import { and, auditLog, count, desc, eq, gte, ilike, lte } from '@__SCOPE__/db';
import { orgProcedure, router } from '../trpc';
import { requirePermission } from '../middleware/require-permission';

const listSchema = z.object({
  /** Filtre date début (ISO 8601). */
  from: z.string().datetime({ offset: true }).optional(),
  /** Filtre date fin (ISO 8601). */
  to: z.string().datetime({ offset: true }).optional(),
  /** Filtre par chemin d'action exact (ex: `invoices.create`). */
  action: z.string().trim().min(1).max(120).optional(),
  /** Filtre par id utilisateur (text). */
  userId: z.string().trim().min(1).max(80).optional(),
  /** Recherche partielle (ILIKE) sur le chemin d'action. */
  search: z.string().trim().min(1).max(120).optional(),
  /** Pagination offset (page 0-indexée). */
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50),
});
export type AuditListInput = z.infer<typeof listSchema>;

export const auditRouter = router({
  list: orgProcedure
    .use(requirePermission('audit:log:read'))
    .input(listSchema)
    .query(async ({ ctx, input }) => {
      const conds = [eq(auditLog.organizationId, ctx.org.id)];
      if (input.from) conds.push(gte(auditLog.createdAt, new Date(input.from)));
      if (input.to) conds.push(lte(auditLog.createdAt, new Date(input.to)));
      if (input.action) conds.push(eq(auditLog.action, input.action));
      if (input.userId) conds.push(eq(auditLog.userId, input.userId));
      if (input.search) conds.push(ilike(auditLog.action, `%${input.search}%`));

      const where = and(...conds);
      const [items, [totalRow]] = await Promise.all([
        ctx.db
          .select({
            id: auditLog.id,
            userId: auditLog.userId,
            sessionId: auditLog.sessionId,
            action: auditLog.action,
            resourceType: auditLog.resourceType,
            resourceId: auditLog.resourceId,
            details: auditLog.details,
            ipAddress: auditLog.ipAddress,
            userAgent: auditLog.userAgent,
            createdAt: auditLog.createdAt,
          })
          .from(auditLog)
          .where(where)
          .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
          .limit(input.pageSize)
          .offset(input.page * input.pageSize),
        ctx.db.select({ value: count() }).from(auditLog).where(where),
      ]);

      return { items, total: totalRow?.value ?? 0 };
    }),
});
