/**
 * Audit schema — table `audit_log`
 *
 * Référence : Story 1.15 (foundation). Story 14.x (rétention 10 ans OHADA,
 * redaction PII, export FEC, immuabilité runtime via trigger Postgres).
 *
 * Conventions :
 * - Naming snake_case (option Drizzle `casing: 'snake_case'`)
 * - IDs en `text` (nanoid 21 chars côté app)
 * - JSONB pour `details` (Postgres natif, requêtable)
 * - Index `(organization_id, created_at DESC)` pour requêtes type
 *   "derniers événements de l'org X" (UI audit log viewer Epic 14)
 *
 * Note Story 1.15 :
 * - Pas d'immuabilité runtime (pas de trigger BEFORE UPDATE/DELETE) — sera
 *   ajouté Story 14.x via raw SQL migration
 * - Pas de FK strict vers `organizations`/`users` : un audit log doit pouvoir
 *   subsister si l'org est supprimée (compliance OHADA). On garde des `text`
 *   simples
 */
import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey().notNull(),
    /** Organisation cible de l'action. '__system__' pour les actions hors-tenant (jobs cron, etc.) */
    organizationId: text('organization_id').notNull(),
    /** User à l'origine de l'action. NULL pour les actions système (cron, queue consumers). */
    userId: text('user_id'),
    /** Session associée à l'appel tRPC, pour traçabilité Better-Auth. */
    sessionId: text('session_id'),
    /** Chemin de la procedure tRPC (ex: 'invoices.create', 'organizations.update'). */
    action: text('action').notNull(),
    /** Type de ressource ciblée (ex: 'invoice', 'organization'). Optionnel. */
    resourceType: text('resource_type'),
    /** ID de la ressource ciblée. Optionnel. */
    resourceId: text('resource_id'),
    /** Détails JSONB : input redacté + output éventuel. Story 14.x ajoutera redaction PII. */
    details: jsonb('details'),
    /** IP cliente extraite du header `cf-connecting-ip`. */
    ipAddress: text('ip_address'),
    /** User-Agent header brut. */
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Requête principale : "derniers événements pour l'org X" — Epic 14 UI audit log viewer
    index('audit_log_org_created_at_idx').on(t.organizationId, t.createdAt.desc()),
  ],
);

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
