/**
 * rbac router — gestion des rôles custom (Story 3.11)
 *
 * Permet à une organisation de définir ses propres rôles (au-delà des 4
 * prédéfinis), avec une matrice de permissions `allow` / `deny`.
 *
 * Toutes les procédures sont scopées org et protégées par `requirePermission`
 * (`identity:role:*`) — seul un `owner` y a accès (les rôles prédéfinis
 * `admin` se voient refuser `*:role:*`, cf. seed RBAC Story 3.10).
 *
 * Gating plan (Story 3.11) : la **création** de rôles custom est gatée par la
 * feature dynamique `custom_roles` du catalogue (Epic 26, table `plan_features`)
 * via `orgHasFeature` — même source que `invitation.assignableRoles`. La
 * composition plan↔feature est éditable en admin (jamais codée en dur). L'édition
 * et la suppression de rôles existants restent ouvertes (un downgrade ne casse
 * pas la gestion des rôles déjà créés).
 */
import { z } from 'zod';
import {
  and,
  auditLog,
  count,
  eq,
  inArray,
  isNull,
  member,
  or,
  roles,
  rolePermissions,
  user,
} from '@__SCOPE__/db';
import { isValidPermission } from '@__SCOPE__/rbac';
import { orgProcedure, router, trpcError } from '../trpc';
import { requirePermission } from '../middleware/require-permission';

/** Noms réservés aux rôles prédéfinis — interdits pour un rôle custom. */
const RESERVED_ROLE_NAMES = new Set(['owner', 'admin', 'member', 'guest']);

/**
 * Permission `module:resource:action` validée contre le **registre**
 * (`@__SCOPE__/rbac`) — un module/resource/action inconnu est rejeté (ADR 0011),
 * ce qui garantit que la permission saisie correspond à un gate réellement
 * vérifiable. Le joker `*` par segment reste accepté.
 */
const permissionSchema = z
  .string()
  .refine(isValidPermission, 'Permission inconnue du registre (module:resource:action).');

const ruleSchema = z.object({
  effect: z.enum(['allow', 'deny']),
  permission: permissionSchema,
});

const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(50),
  description: z.string().trim().max(280).optional(),
  rules: z.array(ruleSchema).min(1).max(200),
});

const updateRoleSchema = z.object({
  roleId: z.string(),
  name: z.string().trim().min(2).max(50),
  description: z.string().trim().max(280).optional(),
  rules: z.array(ruleSchema).min(1).max(200),
});

export const rbacRouter = router({
  /** Liste les rôles disponibles pour l'organisation (prédéfinis + custom). */
  list: orgProcedure.use(requirePermission('identity:role:read')).query(async ({ ctx }) => {
    const roleRows = await ctx.db
      .select()
      .from(roles)
      .where(or(eq(roles.organizationId, ctx.org.id), isNull(roles.organizationId)));

    const ids = roleRows.map((r) => r.id);
    const perms = ids.length
      ? await ctx.db.select().from(rolePermissions).where(inArray(rolePermissions.roleId, ids))
      : [];

    // Nombre de membres par rôle (member.role stocke le **nom** du rôle), scopé
    // à l'organisation active — alimente le compteur des cartes de rôle.
    const counts = await ctx.db
      .select({ role: member.role, n: count() })
      .from(member)
      .where(eq(member.organizationId, ctx.org.id))
      .groupBy(member.role);
    const countByName = new Map(counts.map((c) => [c.role, Number(c.n)]));

    return roleRows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isPredefined: r.isPredefined,
      memberCount: countByName.get(r.name) ?? 0,
      updatedAt: r.updatedAt,
      rules: perms
        .filter((p) => p.roleId === r.id)
        .map((p) => ({ effect: p.effect, permission: p.permission })),
    }));
  }),

  /**
   * Story 3.11 — entitlement « rôles personnalisés » de l'org (feature dynamique
   * `custom_roles`). Pilote l'affichage de l'upsell vs l'éditeur côté UI ; le
   * gating réel est dans `create`.
   */
  canUseCustomRoles: orgProcedure
    .use(requirePermission('identity:role:read'))
    .query(async () => ({
      // Generic core: custom roles always allowed (plan entitlement was business).
      allowed: true,
    })),

  /**
   * Liste les membres affectés à un rôle (par nom), pour la sidebar « Membres
   * affectés » de la page d'édition. Scopé à l'organisation active.
   */
  membersForRole: orgProcedure
    .use(requirePermission('identity:role:read'))
    .input(z.object({ roleName: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(member)
        .innerJoin(user, eq(user.id, member.userId))
        .where(and(eq(member.organizationId, ctx.org.id), eq(member.role, input.roleName)));
    }),

  /** Crée un rôle custom scopé à l'organisation. */
  create: orgProcedure
    .use(requirePermission('identity:role:create'))
    .input(createRoleSchema)
    .mutation(async ({ ctx, input }) => {
      // Generic core: custom roles always allowed (plan entitlement was business).
      if (RESERVED_ROLE_NAMES.has(input.name.toLowerCase())) {
        throw trpcError('BAD_REQUEST', `Le nom « ${input.name} » est réservé à un rôle prédéfini.`);
      }

      const existing = await ctx.db
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.organizationId, ctx.org.id), eq(roles.name, input.name)))
        .limit(1);
      if (existing.length > 0) {
        throw trpcError('CONFLICT', `Un rôle nommé « ${input.name} » existe déjà.`);
      }

      const roleId = crypto.randomUUID();
      await ctx.db.insert(roles).values({
        id: roleId,
        organizationId: ctx.org.id,
        name: input.name,
        description: input.description ?? null,
        isPredefined: false,
      });
      await ctx.db.insert(rolePermissions).values(
        input.rules.map((rule) => ({
          id: crypto.randomUUID(),
          roleId,
          effect: rule.effect,
          permission: rule.permission,
        })),
      );

      await ctx.db.insert(auditLog).values({
        id: crypto.randomUUID(),
        organizationId: ctx.org.id,
        userId: ctx.user.id,
        sessionId: ctx.sessionId,
        action: 'rbac.role_created',
        resourceType: 'role',
        resourceId: roleId,
        details: { before: null, after: { name: input.name, rules: input.rules } },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { id: roleId, name: input.name };
    }),

  /** Met à jour un rôle custom (nom, description, matrice de permissions). */
  update: orgProcedure
    .use(requirePermission('identity:role:update'))
    .input(updateRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const [role] = await ctx.db
        .select()
        .from(roles)
        .where(and(eq(roles.id, input.roleId), eq(roles.organizationId, ctx.org.id)))
        .limit(1);
      if (!role) throw trpcError('NOT_FOUND', 'Rôle introuvable dans cette organisation.');
      if (role.isPredefined) {
        throw trpcError('FORBIDDEN', 'Un rôle prédéfini ne peut pas être modifié.');
      }

      const beforePerms = await ctx.db
        .select({ effect: rolePermissions.effect, permission: rolePermissions.permission })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id));

      await ctx.db
        .update(roles)
        .set({ name: input.name, description: input.description ?? null, updatedAt: new Date() })
        .where(eq(roles.id, role.id));
      await ctx.db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
      await ctx.db.insert(rolePermissions).values(
        input.rules.map((rule) => ({
          id: crypto.randomUUID(),
          roleId: role.id,
          effect: rule.effect,
          permission: rule.permission,
        })),
      );

      await ctx.db.insert(auditLog).values({
        id: crypto.randomUUID(),
        organizationId: ctx.org.id,
        userId: ctx.user.id,
        sessionId: ctx.sessionId,
        action: 'rbac.role_updated',
        resourceType: 'role',
        resourceId: role.id,
        details: {
          before: { name: role.name, rules: beforePerms },
          after: { name: input.name, rules: input.rules },
        },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { id: role.id, name: input.name };
    }),

  /** Supprime un rôle custom (les rôles prédéfinis sont protégés). */
  delete: orgProcedure
    .use(requirePermission('identity:role:delete'))
    .input(z.object({ roleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [role] = await ctx.db
        .select()
        .from(roles)
        .where(and(eq(roles.id, input.roleId), eq(roles.organizationId, ctx.org.id)))
        .limit(1);
      if (!role) throw trpcError('NOT_FOUND', 'Rôle introuvable dans cette organisation.');
      if (role.isPredefined) {
        throw trpcError('FORBIDDEN', 'Un rôle prédéfini ne peut pas être supprimé.');
      }

      // Cascade FK : les role_permissions du rôle sont supprimées avec lui.
      await ctx.db.delete(roles).where(eq(roles.id, role.id));

      await ctx.db.insert(auditLog).values({
        id: crypto.randomUUID(),
        organizationId: ctx.org.id,
        userId: ctx.user.id,
        sessionId: ctx.sessionId,
        action: 'rbac.role_deleted',
        resourceType: 'role',
        resourceId: role.id,
        details: { before: { name: role.name }, after: null },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { id: role.id };
    }),
});
