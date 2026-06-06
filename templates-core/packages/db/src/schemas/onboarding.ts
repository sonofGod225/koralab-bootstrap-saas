/**
 * Onboarding schema — flow entreprise (3 étapes obligatoires) + onboardings
 * modules + consent log (Story 7.1, Epic 7 ; flow simplifié).
 *
 * Trois tables :
 * - `onboarding_progress` (1 par organisation) : state machine resumable du
 *   wizard (`company` → `user_profile` → `consent`). `completed_obligatory_at`
 *   est marqué à la fin du Step 3 (consent) et débloque l'accès à l'app via
 *   `requireOnboardingCompleted` (Story 7.2). `data` (JSONB) accumule les
 *   inputs des steps successifs.
 * - `module_onboarding_progress` (1 par (org, module)) : onboardings courts
 *   par module métier (Facturation, Encaissements, CRM) lancés après le
 *   wizard principal.
 * - `consent_log` : trace immuable des consentements (CGU OHADA, KYC
 *   rétroactif, CDP/ARTCI, disclaimer IA). Pas de FK strict — un consent
 *   doit subsister si l'org est supprimée (compliance OHADA), même pattern
 *   que [`audit_log`](./audit.ts).
 *
 * Les colonnes enum sont déclarées en `text` (pattern du codebase, cf.
 * `member.role`). Les unions TS sont exportées pour le typage applicatif.
 */
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations, user } from './identity';

/* ─── Enums (string literal unions — colonnes `text` côté DB) ───────────── */

/**
 * Étape courante du wizard entreprise — sert au middleware pour calculer le `redirectTo`.
 *
 * **Flow simplifié** : le wizard obligatoire se réduit à 3 stops
 * (`company` → `user_profile` → `consent`), puis `completed`. Les anciennes
 * étapes `security` (2FA), `plan`, `modules`, `team_invitation`, `preferences`
 * et `welcome` sont sorties du chemin bloquant et déplacées en post-onboarding
 * (configurables dans `/settings/*`). Le consentement (jalon obligatoire) clôt
 * désormais l'onboarding et bootstrappe la souscription Free.
 *
 * NB : la colonne `stage` est `text` — les valeurs legacy persistées en base
 * sont réécrites vers `consent` par la migration de données `0016`.
 */
export const ONBOARDING_STAGES = ['company', 'user_profile', 'consent', 'completed'] as const;
export type OnboardingStage = (typeof ONBOARDING_STAGES)[number];

/** Modules métier qui ont leur propre onboarding court (Stories 7.11-7.13). */
export const ONBOARDABLE_MODULES = ['facturation', 'encaissements', 'crm'] as const;
export type OnboardableModule = (typeof ONBOARDABLE_MODULES)[number];

/** Statut d'un onboarding module. */
export const MODULE_ONBOARDING_STATUSES = ['not_started', 'in_progress', 'completed'] as const;
export type ModuleOnboardingStatus = (typeof MODULE_ONBOARDING_STATUSES)[number];

/**
 * Types de consentement obligatoires au Step 3 / consent (cf. AC 7.8). Versionnés —
 * si une CGU change, on insère une nouvelle ligne sans modifier les
 * précédentes (table append-only).
 */
export const CONSENT_TYPES = ['cgu_ohada', 'kyc_retroactif', 'cdp_artci', 'ia_disclaimer'] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

/* ─── Tables ────────────────────────────────────────────────────────────── */

/**
 * État du wizard d'onboarding entreprise (3 stops obligatoires). Exactement 1
 * ligne par organisation — créée à l'arrivée sur Step 1, finalisée au consent.
 */
export const onboardingProgress = pgTable(
  'onboarding_progress',
  {
    id: text('id').primaryKey().notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    /** Owner de l'org qui pilote le wizard — référence faible (utilisateur supprimable). */
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    /** Étape courante — cf. [[ONBOARDING_STAGES]]. */
    stage: text('stage').notNull().default('company'),
    /** Index numérique 1..3 — utilisé par l'UI Stepper et le redirect middleware. */
    currentStep: smallint('current_step').notNull().default(1),
    /** Accumulateur JSONB des inputs validés step par step. */
    data: jsonb('data').notNull().default({}),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    /**
     * Marqué à la fin du Step 3 (consent). Tant que NULL, l'app reste bloquée
     * par `requireOnboardingCompleted` ([`require-onboarding-completed.ts`](../../../rpc/src/middleware/require-onboarding-completed.ts)).
     */
    completedObligatoryAt: timestamp('completed_obligatory_at', { withTimezone: true }),
    /**
     * Marqué en même temps que `completed_obligatory_at` (le consent clôt
     * l'onboarding — il n'y a plus d'étape welcome/tour séparée).
     */
    completedAt: timestamp('completed_at', { withTimezone: true }),
    skippedTeamInvitation: boolean('skipped_team_invitation').notNull().default(false),
    skippedTour: boolean('skipped_tour').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('onboarding_progress_org_unique').on(t.organizationId)],
);

/**
 * État de l'onboarding d'un module spécifique (Facturation / Encaissements / CRM).
 * Une ligne par (organisation, module). Initialisée à `not_started` quand le
 * module est activé Step 4 du wizard entreprise.
 */
export const moduleOnboardingProgress = pgTable(
  'module_onboarding_progress',
  {
    id: text('id').primaryKey().notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    /** Module concerné — cf. [[ONBOARDABLE_MODULES]]. */
    module: text('module').notNull(),
    /** Statut — cf. [[MODULE_ONBOARDING_STATUSES]]. */
    status: text('status').notNull().default('not_started'),
    /** Numéros des sous-étapes validées (ex: [1, 2, 3] pour les 3 premières). */
    stepsCompleted: integer('steps_completed').array().notNull().default([]),
    /**
     * Première création d'objet réel dans le module (ex: 1ère facture pour
     * Facturation, 1er paiement test pour Encaissements). Sert au KPI activation.
     */
    firstObjectCreatedAt: timestamp('first_object_created_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('module_onboarding_org_module_unique').on(t.organizationId, t.module)],
);

/**
 * Journal des consentements donnés par l'utilisateur (Step 6 wizard + tout
 * consentement futur). **Append-only** — l'immuabilité runtime sera ajoutée
 * Story 14.x via trigger Postgres (même approche que `audit_log`).
 *
 * Pas de FK stricte vers `user` / `organizations` : un consent doit pouvoir
 * subsister si l'utilisateur ou l'org est supprimé·e (obligation OHADA).
 */
export const consentLog = pgTable('consent_log', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').notNull(),
  organizationId: text('organization_id').notNull(),
  /** Type de consentement — cf. [[CONSENT_TYPES]]. */
  consentType: text('consent_type').notNull(),
  /** Version du document accepté (ex: 'v1', 'v2', '2026-05-15'). */
  version: text('version').notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  /** IP cliente **hashée** (SHA-256) — anti-corrélation directe, on garde la preuve sans la PII brute. */
  ipAddressHash: text('ip_address_hash'),
  userAgent: text('user_agent'),
});

/* ─── Types inférés ─────────────────────────────────────────────────────── */

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type NewOnboardingProgress = typeof onboardingProgress.$inferInsert;
export type ModuleOnboardingProgress = typeof moduleOnboardingProgress.$inferSelect;
export type NewModuleOnboardingProgress = typeof moduleOnboardingProgress.$inferInsert;
export type ConsentLogEntry = typeof consentLog.$inferSelect;
export type NewConsentLogEntry = typeof consentLog.$inferInsert;
