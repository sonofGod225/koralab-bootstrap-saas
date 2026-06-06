/**
 * require-staff-role middleware (Epic 24 — Platform Admin).
 *
 * Garde les procédures cross-tenant du back-office (`apps/admin`). Le rôle
 * staff est porté par `user.role === 'admin'` (plugin `admin` de Better-Auth),
 * totalement distinct du RBAC organisationnel (`member.role`).
 *
 * À chaîner après `requireAuth` : `staffProcedure = protectedProcedure.use(requireStaffRole)`.
 *
 * Sur refus, un événement d'audit `staff.authorization_failed` est émis
 * (best-effort, `organization_id = '__system__'` car action hors tenant).
 *
 * ⚠️ Cross-tenant : il n'y a pas de RLS Postgres. Les procédures staff lisent
 * plusieurs organisations — elles DOIVENT rester en lecture explicite et ne
 * jamais exposer de secret. Les mutations passent par `auditedStaffProcedure`.
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { auditLog } from '@__SCOPE__/db';
import type { RpcContext } from '../context';

const t = initTRPC.context<RpcContext>().create();

export const requireStaffRole = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentification requise.' });
  }

  const isStaff = ctx.user.role === 'admin' && ctx.user.banned !== true;
  if (!isStaff) {
    // Audit best-effort du refus (ne casse pas le rejet si l'insert échoue).
    try {
      await ctx.db.insert(auditLog).values({
        id: crypto.randomUUID(),
        organizationId: '__system__',
        userId: ctx.user.id,
        sessionId: ctx.sessionId ?? null,
        action: 'staff.authorization_failed',
        resourceType: 'platform_staff',
        resourceId: ctx.user.id,
        details: { role: ctx.user.role ?? null, banned: ctx.user.banned ?? null },
        ipAddress: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      });
    } catch (err) {
      console.error('[require-staff-role] audit insert failed', err);
    }
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé à l’équipe __PROJECT_NAME__ (rôle staff requis).',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Propage le narrowing non-undefined aux procédures `staffProcedure`.
      user: ctx.user,
    },
  });
});
