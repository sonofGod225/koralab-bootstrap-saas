/**
 * RBAC schema — rôles et permissions (Story 3.10).
 *
 * Modèle :
 * - `roles` : les 4 rôles prédéfinis __PROJECT_NAME__ (`organization_id` NULL, globaux)
 *   + les rôles custom scopés à une organisation (Story 3.11).
 * - `role_permissions` : règles `allow` / `deny` portant sur des permissions
 *   `module:resource:action`. Le segment `*` est un joker ; une règle `deny`
 *   l'emporte sur une règle `allow` (permet d'exprimer « tout sauf billing »).
 *
 * Le rôle d'un utilisateur dans une organisation est porté par `member.role`
 * (plugin `organization`) — résolu vers un `roles.name` par `require-permission`.
 */
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './identity';

export const roles = pgTable(
  'roles',
  {
    id: text('id').primaryKey().notNull(),
    /** NULL = rôle prédéfini global ; sinon rôle custom scopé à une organisation. */
    organizationId: text('organization_id').references(() => organizations.id, {
      onDelete: 'cascade',
    }),
    /** Nom technique — correspond à `member.role` (owner/admin/member/guest ou custom). */
    name: text('name').notNull(),
    description: text('description'),
    /** true = un des 4 rôles prédéfinis __PROJECT_NAME__ (non supprimable, non éditable). */
    isPredefined: boolean('is_predefined').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('roles_org_name_idx').on(t.organizationId, t.name)],
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: text('id').primaryKey().notNull(),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    /** Effet de la règle : `allow` (octroi) ou `deny` (refus prioritaire). */
    effect: text('effect').notNull().default('allow'),
    /** Permission `module:resource:action` ; `*` accepté comme joker de segment. */
    permission: text('permission').notNull(),
  },
  (t) => [index('role_permissions_role_idx').on(t.roleId)],
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
