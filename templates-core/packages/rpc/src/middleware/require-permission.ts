/**
 * require-permission middleware (Story 3.10 — RBAC)
 *
 * Factory : `requirePermission('invoicing:invoice:delete')` retourne un
 * middleware tRPC qui n'autorise l'appel que si le rôle de l'utilisateur dans
 * l'organisation active accorde la permission demandée.
 *
 * Résolution : `member.role` → `roles` (rôle prédéfini global ou custom scopé
 * à l'organisation) → `role_permissions`. Une règle `deny` l'emporte sur une
 * règle `allow`. Le segment `*` est un joker (`*`, `billing:*`, `*:*:read`…).
 *
 * Le matching (`matchesPermission`) provient de `@__SCOPE__/rbac` — source de
 * vérité unique partagée avec la matrice UI et le seed (ADR 0011).
 *
 * À appliquer après `orgProcedure` (auth + org requis). Toute tentative
 * refusée émet un événement d'audit `rbac.permission_check_failed`.
 *
 * @example
 *   export const invoicesRouter = router({
 *     delete: orgProcedure
 *       .use(requirePermission('invoicing:invoice:delete'))
 *       .mutation(...),
 *   });
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { and, auditLog, eq, isNull, member, or, roles, rolePermissions } from '@__SCOPE__/db';
import { can } from '@__SCOPE__/rbac';
import type { RpcContext } from '../context';

const t = initTRPC.context<RpcContext>().create();

export function requirePermission(permission: string) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentification requise.' });
    }
    if (!ctx.org) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Aucune organisation active.' });
    }

    // Règles allow/deny du rôle de l'utilisateur dans l'organisation active.
    const rules = await ctx.db
      .select({ effect: rolePermissions.effect, permission: rolePermissions.permission })
      .from(member)
      .innerJoin(
        roles,
        and(
          eq(roles.name, member.role),
          or(eq(roles.organizationId, ctx.org.id), isNull(roles.organizationId)),
        ),
      )
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .where(and(eq(member.userId, ctx.user.id), eq(member.organizationId, ctx.org.id)));

    // RBAC pur (deny-wins) factorisé dans `@__SCOPE__/rbac` — source unique.
    if (!can(rules, permission)) {
      // Audit de la tentative refusée (Sentry alerte si > 100/h/org — config ops).
      await ctx.db.insert(auditLog).values({
        id: crypto.randomUUID(),
        organizationId: ctx.org.id,
        userId: ctx.user.id,
        sessionId: ctx.sessionId,
        action: 'rbac.permission_check_failed',
        resourceType: 'permission',
        resourceId: permission,
        details: { permission },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Permission requise : ${permission}.`,
      });
    }

    return next();
  });
}
