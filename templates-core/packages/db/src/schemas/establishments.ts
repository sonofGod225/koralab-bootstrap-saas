/**
 * Multi-établissement schema — establishments + user_establishment_assignments
 * (Story 3.18, ADR 0012).
 *
 * Fondation universelle `org → établissement` : l'établissement est la frontière
 * d'isolation (le « mur »). Il porte le stock (Epic 19), les affectations
 * d'utilisateurs et le pays/conformité. Le **POS est hors fondation** (différé —
 * cf. docs/adrs/0012-deferred-mandates.md) : pas de table `points_of_sale` ici.
 *
 * Isolation tenant : **applicative** (comme tout le repo — pas de RLS Postgres).
 * Chaque requête filtre `organization_id` ; `organization_id` est dénormalisé sur
 * les 2 tables pour permettre ce scope direct sans jointure (y compris sur les
 * affectations).
 *
 * Suppression : **soft delete** (`deleted_at`) sur `establishments`. Les
 * affectations sont supprimées en dur.
 *
 * Contraintes (index uniques partiels — pattern `subscriptions_org_active_idx`
 * de `billing.ts`) :
 * - au plus 1 `establishment.is_primary = true` par organisation (non supprimé) ;
 * - au plus 1 affectation par couple (user, établissement).
 *
 * `country` (ISO 3166-1 alpha-2) = routeur de conformité : les modules de
 * conformité (FNE Epic 13) s'activent par établissement selon le pays.
 */
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { invitation, organizations, user } from './identity';

export const establishments = pgTable(
  'establishments',
  {
    id: text('id').primaryKey().notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    address: text('address'),
    city: text('city'),
    /** ISO 3166-1 alpha-2 ; par défaut le pays de l'organisation (résolu au router). */
    country: text('country'),
    /** Établissement principal (« siège ») — au plus un par org (index unique partiel). */
    isPrimary: boolean('is_primary').notNull().default(false),
    /** Soft delete — NULL = actif. */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('establishments_org_idx').on(t.organizationId),
    /** Au plus 1 établissement principal par org (hors supprimés). */
    uniqueIndex('establishments_one_primary_idx')
      .on(t.organizationId)
      .where(sql`is_primary = true AND deleted_at IS NULL`),
  ],
);

export const userEstablishmentAssignments = pgTable(
  'user_establishment_assignments',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    establishmentId: text('establishment_id')
      .notNull()
      .references(() => establishments.id, { onDelete: 'cascade' }),
    /** Dénormalisé pour le scope org direct des affectations. */
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Une seule affectation par couple (utilisateur, établissement). */
    uniqueIndex('user_establishment_assignments_unique_idx').on(t.userId, t.establishmentId),
    index('user_establishment_assignments_user_idx').on(t.userId),
    index('user_establishment_assignments_org_idx').on(t.organizationId),
  ],
);

/**
 * Établissements cibles d'une invitation (Story 3.25) — l'inviteur choisit le
 * périmètre d'appartenance ; à l'acceptation, le nouveau membre est auto-affecté
 * à ces établissements (sinon siège par défaut). Purgé à l'annulation/expiration
 * de l'invitation (FK `onDelete: cascade`).
 */
export const invitationEstablishments = pgTable(
  'invitation_establishments',
  {
    invitationId: text('invitation_id')
      .notNull()
      .references(() => invitation.id, { onDelete: 'cascade' }),
    establishmentId: text('establishment_id')
      .notNull()
      .references(() => establishments.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.invitationId, t.establishmentId] }),
    index('invitation_establishments_invitation_idx').on(t.invitationId),
    index('invitation_establishments_org_idx').on(t.organizationId),
  ],
);

export type Establishment = typeof establishments.$inferSelect;
export type NewEstablishment = typeof establishments.$inferInsert;
export type UserEstablishmentAssignment = typeof userEstablishmentAssignments.$inferSelect;
export type NewUserEstablishmentAssignment = typeof userEstablishmentAssignments.$inferInsert;
export type InvitationEstablishment = typeof invitationEstablishments.$inferSelect;
export type NewInvitationEstablishment = typeof invitationEstablishments.$inferInsert;
