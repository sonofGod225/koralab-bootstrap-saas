/**
 * Status schema — observabilité opérationnelle (Epic 25).
 *
 * Tables :
 * - `service_components` (25.1) — registre canonique des composants surveillés.
 * - `health_check_runs` (25.2) — historique des sondes (uptime/latence, NFR47).
 * - `system_incidents` + `incident_updates` (25.3) — incidents + timeline.
 * - `maintenance_windows` (25.4) — fenêtres de maintenance planifiées (NFR48).
 * - `job_runs` (25.5) — historique des runs cron/queue.
 *
 * Conventions : snake_case en base, IDs `text` (nanoid/uuid app), enums en
 * colonnes `text` (pattern du codebase), unions TS exportées pour le typage.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/* ─── Enums ─────────────────────────────────────────────────────────────── */

export const COMPONENT_KINDS = ['internal', 'psp', 'external'] as const;
export type ComponentKind = (typeof COMPONENT_KINDS)[number];

export const COMPONENT_STATUSES = ['operational', 'degraded', 'down', 'maintenance'] as const;
export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];

export const HEALTH_STATUSES = ['up', 'degraded', 'down'] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export const INCIDENT_SEVERITIES = ['minor', 'major', 'critical'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_STATUSES = ['investigating', 'identified', 'monitoring', 'resolved'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const MAINTENANCE_STATUSES = ['scheduled', 'in_progress', 'completed', 'canceled'] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const JOB_KINDS = ['cron', 'queue'] as const;
export type JobKind = (typeof JOB_KINDS)[number];

export const JOB_RUN_STATUSES = ['running', 'success', 'failed', 'partial'] as const;
export type JobRunStatus = (typeof JOB_RUN_STATUSES)[number];

/* ─── Tables ────────────────────────────────────────────────────────────── */

/** Registre des composants surveillés (Story 25.1). */
export const serviceComponents = pgTable(
  'service_components',
  {
    id: text('id').primaryKey().notNull(),
    /** Clé stable : api | suite | admin | db | kv | queue_billing | stripe | paystack | wave | fne_dgi. */
    key: text('key').notNull(),
    label: text('label').notNull(),
    kind: text('kind').$type<ComponentKind>().notNull(),
    /** Exposé sur la status page publique. */
    isPublic: boolean('is_public').notNull().default(true),
    currentStatus: text('current_status').$type<ComponentStatus>().notNull().default('operational'),
    sortOrder: smallint('sort_order').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('service_components_key_unique').on(t.key)],
);

/** Historique des sondes santé (Story 25.2) — base de l'uptime (NFR47). */
export const healthCheckRuns = pgTable(
  'health_check_runs',
  {
    id: text('id').primaryKey().notNull(),
    componentKey: text('component_key').notNull(),
    status: text('status').$type<HealthStatus>().notNull(),
    latencyMs: integer('latency_ms'),
    detail: text('detail'),
    checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('health_check_runs_component_checked_idx').on(t.componentKey, t.checkedAt.desc())],
);

/** Incidents (Story 25.3). */
export const systemIncidents = pgTable(
  'system_incidents',
  {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    severity: text('severity').$type<IncidentSeverity>().notNull().default('minor'),
    status: text('status').$type<IncidentStatus>().notNull().default('investigating'),
    /** Clés des composants impactés (`service_components.key`). */
    componentKeys: jsonb('component_keys').$type<string[]>().notNull().default([]),
    isPublic: boolean('is_public').notNull().default(false),
    createdBy: text('created_by'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('system_incidents_status_started_idx').on(t.status, t.startedAt.desc())],
);

/** Timeline d'un incident — append-only (Story 25.3). */
export const incidentUpdates = pgTable(
  'incident_updates',
  {
    id: text('id').primaryKey().notNull(),
    incidentId: text('incident_id')
      .notNull()
      .references(() => systemIncidents.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    status: text('status').$type<IncidentStatus>().notNull(),
    authorUserId: text('author_user_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('incident_updates_incident_idx').on(t.incidentId, t.createdAt)],
);

/** Fenêtres de maintenance planifiées (Story 25.4, NFR48). */
export const maintenanceWindows = pgTable(
  'maintenance_windows',
  {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    body: text('body'),
    componentKeys: jsonb('component_keys').$type<string[]>().notNull().default([]),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: text('status').$type<MaintenanceStatus>().notNull().default('scheduled'),
    isPublic: boolean('is_public').notNull().default(true),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('maintenance_windows_starts_idx').on(t.startsAt)],
);

/** Historique des runs cron/queue (Story 25.5). */
export const jobRuns = pgTable(
  'job_runs',
  {
    id: text('id').primaryKey().notNull(),
    jobName: text('job_name').notNull(),
    kind: text('kind').$type<JobKind>().notNull(),
    status: text('status').$type<JobRunStatus>().notNull().default('running'),
    itemsProcessed: integer('items_processed').notNull().default(0),
    itemsFailed: integer('items_failed').notNull().default(0),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => [index('job_runs_name_started_idx').on(t.jobName, t.startedAt.desc())],
);

/* ─── Types inférés ─────────────────────────────────────────────────────── */

export type ServiceComponent = typeof serviceComponents.$inferSelect;
export type NewServiceComponent = typeof serviceComponents.$inferInsert;
export type HealthCheckRun = typeof healthCheckRuns.$inferSelect;
export type NewHealthCheckRun = typeof healthCheckRuns.$inferInsert;
export type SystemIncident = typeof systemIncidents.$inferSelect;
export type NewSystemIncident = typeof systemIncidents.$inferInsert;
export type IncidentUpdate = typeof incidentUpdates.$inferSelect;
export type NewIncidentUpdate = typeof incidentUpdates.$inferInsert;
export type MaintenanceWindow = typeof maintenanceWindows.$inferSelect;
export type NewMaintenanceWindow = typeof maintenanceWindows.$inferInsert;
export type JobRun = typeof jobRuns.$inferSelect;
export type NewJobRun = typeof jobRuns.$inferInsert;
