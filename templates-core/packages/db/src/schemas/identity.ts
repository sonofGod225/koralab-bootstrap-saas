/**
 * Identity schema — Better-Auth core (Story 3.1) + organisations (Story 3.2).
 *
 * Référence : architecture.md step 5 + ADR 0003 (Better-Auth embedded).
 *
 * Conventions :
 * - Naming snake_case en base, `casing: 'snake_case'` côté client Drizzle.
 * - IDs en `text` (générés par Better-Auth).
 * - Timestamps en `timestamptz`.
 *
 * Tables `user` / `session` / `account` / `verification` : **shapes imposées
 * par l'adapter Drizzle de Better-Auth v1.6** — ne pas renommer les colonnes.
 *
 * Story 3.2 — le plugin `organization` de Better-Auth est activé : son modèle
 * `organization` est mappé sur la table tenant __PROJECT_NAME__ `organizations`
 * (`schema.organization.modelName`), et `country`/`currency` sont déclarés en
 * `additionalFields`. Les tables `member` / `invitation` du plugin lient les
 * utilisateurs aux organisations (rôles owner/admin/member).
 */
import { boolean, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Organisation tenant __PROJECT_NAME__ — modèle `organization` du plugin Better-Auth
 * (mappé via `schema.organization.modelName: 'organizations'`).
 *
 * `id` / `name` / `slug` / `logo` / `metadata` / `createdAt` sont les colonnes
 * attendues par le plugin ; `country` / `currency` sont des `additionalFields`
 * __PROJECT_NAME__ (scope multi-tenant — cf. middleware `require-org`).
 */
export const organizations = pgTable(
  'organizations',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    /** URL-safe slug unique, ex: 'acme-sn-dakar' */
    slug: text('slug').notNull(),
    /** Logo de l'organisation (URL R2) — colonne attendue par le plugin. */
    logo: text('logo'),
    /** Métadonnées libres JSON sérialisé — colonne attendue par le plugin. */
    metadata: text('metadata'),
    /** ISO 3166-1 alpha-2 : 'SN' (Sénégal), 'CI' (Côte d'Ivoire), etc. */
    country: text('country').notNull(),
    /** Devise principale OHADA : 'XOF' (UEMOA), 'XAF' (CEMAC), 'EUR', 'USD' */
    currency: text('currency').notNull().default('XOF'),
    /** Statut fiscal (Story 8.2) : informel / micro (CGU-SN, RME-CI) / réel. Pilote
     * les documents émissibles, la TVA et la clearance (× country_tax_profiles). */
    taxStatus: text('tax_status').$type<'informal' | 'micro' | 'reel'>().notNull().default('reel'),
    /**
     * Profil entreprise étendu — collecté au Step 1 onboarding (`company`) puis
     * éditable via `/settings/organization`. Colonnes nullables : les orgs créées
     * avant cette migration ou n'ayant pas complété l'onboarding peuvent ne pas
     * les avoir. L'enforcement « required » vit côté Zod (router organization).
     */
    legalName: text('legal_name'),
    tradeName: text('trade_name'),
    legalId: text('legal_id'),
    sector: text('sector'),
    size: text('size'),
    address: text('address'),
    city: text('city'),
    taxId: text('tax_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('organizations_slug_unique').on(t.slug)],
);

/** Compte utilisateur — table `user` de Better-Auth. */
export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    /**
     * Pays de l'utilisateur (ISO 3166-1 alpha-2) — `additionalField` Better-Auth
     * collecté au signup (Story 3.2), réutilisé comme défaut pays de l'org.
     */
    country: text('country'),
    /**
     * Langue préférée de l'interface/emails — `additionalField` Better-Auth
     * (Story 3.24, FR12). Valeurs : `fr` / `fr-af` / `en` / `wo`. NULL = défaut FR.
     */
    language: text('language'),
    /**
     * Numéro de téléphone E.164 (`+221…` / `+225…`) — plugin `phoneNumber`
     * de Better-Auth (Story 3.3). Chiffré at-rest par Neon (AES-256 storage).
     */
    phoneNumber: text('phone_number'),
    phoneNumberVerified: boolean('phone_number_verified').notNull().default(false),
    /** 2FA TOTP active sur le compte — plugin `twoFactor` (Story 3.5). */
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    /**
     * Rôle plateforme — plugin `admin` de Better-Auth (Epic 24). `'user'` par
     * défaut ; `'admin'` = staff __PROJECT_NAME__ habilité au back-office cross-tenant
     * (`admin.__PROJECT_SLUG__.com`). Distinct du rôle organisationnel `member.role`.
     */
    role: text('role').default('user'),
    /** Compte banni — plugin `admin` (gel d'accès, Epic 24). */
    banned: boolean('banned').default(false),
    /** Motif du ban — plugin `admin`. */
    banReason: text('ban_reason'),
    /** Expiration du ban (NULL = permanent) — plugin `admin`. */
    banExpires: timestamp('ban_expires', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_email_unique').on(t.email),
    uniqueIndex('user_phone_number_unique').on(t.phoneNumber),
  ],
);

/** Session — table `session` de Better-Auth (persistée en DB + cachée en KV). */
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /**
     * Organisation active de la session — colonne ajoutée par le plugin
     * `organization` (Story 3.2). Peuplée par `databaseHooks.session.create`,
     * basculée par `<OrgSwitcher />` (Story 3.6).
     */
    activeOrganizationId: text('active_organization_id'),
    /**
     * Établissement actif de la session (Story 3.19, ADR 0012). **Géré hors
     * Better-Auth** : posé/lu via Drizzle par `require-establishment` /
     * `establishments.setActive`. Better-Auth ignore cette colonne (adapter en
     * UPDATE ciblé → préservée). NULL = défaut dérivé à la 1ʳᵉ requête.
     */
    activeEstablishmentId: text('active_establishment_id'),
    /**
     * Si la session est une impersonation staff (plugin `admin`, Epic 24),
     * porte l'id du staff qui impersonne. NULL pour une session normale.
     */
    impersonatedBy: text('impersonated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('session_token_unique').on(t.token)],
);

/** Méthode d'authentification (mot de passe, OAuth…) — table `account` de Better-Auth. */
export const account = pgTable('account', {
  id: text('id').primaryKey().notNull(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  /** Hash Argon2id du mot de passe (provider 'credential'). */
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Jeton de vérification (email, reset password…) — table `verification` de Better-Auth. */
export const verification = pgTable('verification', {
  id: text('id').primaryKey().notNull(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Appartenance utilisateur ↔ organisation — table `member` du plugin
 * `organization` de Better-Auth (Story 3.2). Le rôle est l'autorité RBAC
 * de base (owner/admin/member) ; les permissions granulaires arrivent en
 * Story 3.10.
 */
export const member = pgTable('member', {
  id: text('id').primaryKey().notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  /** Rôle dans l'organisation : 'owner' | 'admin' | 'member'. */
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Invitation à rejoindre une organisation — table `invitation` du plugin
 * `organization` de Better-Auth. Le flux d'invitation complet est livré en
 * Story 3.9 ; la table est créée ici car le plugin l'exige.
 */
export const invitation = pgTable('invitation', {
  id: text('id').primaryKey().notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  /** Rôle pré-attribué à l'invité (nullable jusqu'à acceptation). */
  role: text('role'),
  /** Statut : 'pending' | 'accepted' | 'rejected' | 'canceled'. */
  status: text('status').notNull().default('pending'),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Secret TOTP + codes de récupération — table `twoFactor` du plugin
 * `twoFactor` de Better-Auth (Story 3.5). Une ligne par utilisateur ayant
 * initié l'enrôlement 2FA.
 */
export const twoFactor = pgTable('two_factor', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  /** Secret servant à générer/vérifier les codes TOTP. */
  secret: text('secret').notNull(),
  /** Codes de récupération (sérialisés) — usage unique chacun. */
  backupCodes: text('backup_codes').notNull(),
  /** Le secret a-t-il été vérifié pendant l'enrôlement. */
  verified: boolean('verified').notNull().default(false),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;
export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;
export type TwoFactor = typeof twoFactor.$inferSelect;
export type NewTwoFactor = typeof twoFactor.$inferInsert;
