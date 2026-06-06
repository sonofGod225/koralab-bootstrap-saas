/**
 * onboarding router — wizard d'onboarding entreprise (Story 7.x ; flow simplifié).
 *
 * Le wizard obligatoire se réduit à **3 stops** : `company` → `user_profile`
 * → `consent`. Les anciennes étapes `security`/`plan`/`modules`/`team`/`prefs`
 * /`welcome` sont sorties du chemin bloquant et déplacées en post-onboarding
 * (configurables dans `/settings/*`).
 *
 * Procedures :
 *  - `get`                 — état courant pour l'organisation active (ou null).
 *  - `completeCompany`     — Step 1 (profil entreprise) → `user_profile`.
 *  - `completeUserProfile` — Step 2 (profil utilisateur) → `consent`.
 *  - `completeConsent`     — Step 3 (consentement, **jalon obligatoire final**) :
 *    trace les consentements, marque `completed_obligatory_at`/`completed_at`,
 *    bootstrappe la souscription Free, et clôt l'onboarding (`completed`).
 *
 * Les données validées sont stockées dans `onboarding_progress.data` (JSONB,
 * accumulator) — c'est le consent final qui « promeut » et marque le jalon.
 * Architecture choisie pour éviter les écritures partielles et permettre
 * l'annulation jusqu'à validation finale.
 *
 * Ce router est volontairement câblé en `orgProcedure` (et PAS `appProcedure`)
 * — il faut justement pouvoir compléter l'onboarding pour le terminer.
 */
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  consentLog,
  onboardingProgress,
  type ConsentType,
  type OnboardingProgress,
  type OnboardingStage,
} from '@__SCOPE__/db';
import type { Database } from '@__SCOPE__/db';
import { COUNTRIES, SECTORS, SIZES } from '../lib/enums';
import { orgProcedure, router } from '../trpc';

/** ID nanoid-style (chars URL-safe, 21 par défaut). Pas de dépendance externe. */
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `onb_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Helper d'upsert idempotent pour une step donnée. Si pas de ligne d'onboarding,
 * la crée ; sinon merge `data.<stepKey>` (override) et avance `stage`/`currentStep`
 * uniquement si l'utilisateur est encore en amont — pas de rétrogradation sur
 * modification rétroactive (ex: revenir éditer Step 1 depuis Step 4).
 */
async function upsertStep<TInput>(args: {
  db: Database;
  orgId: string;
  ownerUserId: string;
  stepKey: string;
  stepIndex: number;
  nextStage: OnboardingStage;
  input: TInput;
}): Promise<OnboardingProgress> {
  const { db, orgId, ownerUserId, stepKey, stepIndex, nextStage, input } = args;
  const now = new Date();
  const [existing] = await db
    .select()
    .from(onboardingProgress)
    .where(eq(onboardingProgress.organizationId, orgId))
    .limit(1);

  if (!existing) {
    const [created] = await db
      .insert(onboardingProgress)
      .values({
        id: generateId(),
        organizationId: orgId,
        ownerUserId,
        stage: nextStage,
        currentStep: stepIndex + 1,
        data: { [stepKey]: input },
        updatedAt: now,
      })
      .returning();
    if (!created) throw new Error('insert returned no row');
    return created;
  }

  const prevData = (existing.data ?? {}) as Record<string, unknown>;
  const mergedData = { ...prevData, [stepKey]: input };
  const shouldAdvance = existing.currentStep <= stepIndex;

  const [updated] = await db
    .update(onboardingProgress)
    .set({
      data: mergedData,
      ...(shouldAdvance ? { stage: nextStage, currentStep: stepIndex + 1 } : {}),
      updatedAt: now,
    })
    .where(eq(onboardingProgress.organizationId, orgId))
    .returning();
  if (!updated) throw new Error('update returned no row');
  return updated;
}

/* ─── Schéma Step 1 (company) ───────────────────────────────────────────── */

// COUNTRIES / SECTORS / SIZES centralisés dans `../lib/enums` — partagés avec
// le router `organization` (page /settings/organization).

const companySchema = z.object({
  legalName: z.string().trim().min(2, 'Raison sociale requise (2 caractères minimum).'),
  tradeName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  country: z.enum(COUNTRIES),
  /**
   * NINEA (Sénégal, 9 chiffres) ou RCCM (CI/UEMOA, ex: `CI-ABJ-2018-B-12345`).
   * Saisie libre acceptée — la validation API externe (DGI/RCCM) viendra avec
   * la Story KYC dédiée. On vérifie juste la non-vacuité ici.
   */
  legalId: z.string().trim().min(5, 'NINEA ou RCCM requis.').max(80),
  sector: z.enum(SECTORS),
  size: z.enum(SIZES),
  address: z.string().trim().min(3, 'Adresse requise.').max(200),
  city: z.string().trim().min(2, 'Ville requise.').max(80),
  taxId: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});
export type CompanyStepInput = z.infer<typeof companySchema>;

/* ─── Schéma Step 2 (user profile) ──────────────────────────────────────── */

/** Rôles fonctionnels possibles de l'utilisateur — alignés sur le design V2 Step 2. */
const USER_ROLES = ['gerant', 'compta', 'commercial', 'autre'] as const;

/** Langues supportées par l'interface — alignées sur les colonnes Paraglide à venir. */
const LANGUAGES = ['fr-fr', 'fr-af', 'en', 'wo'] as const;

const userProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'Prénom requis (2 caractères minimum).').max(40),
  lastName: z.string().trim().min(2, 'Nom requis (2 caractères minimum).').max(40),
  role: z.enum(USER_ROLES),
  language: z.enum(LANGUAGES),
});
export type UserProfileStepInput = z.infer<typeof userProfileSchema>;

/* ─── Schéma Step 3 (consent) ───────────────────────────────────────────── */

/**
 * Step 3 — consentements légaux. Les 3 premiers sont **obligatoires** (CGU OHADA,
 * KYC rétroactif, CDP/ARTCI) — Zod refusera la soumission si `false`. L'IA
 * assistance est facultative. Chaque consentement coché est inséré comme une
 * ligne immuable dans `consent_log` (append-only — Story 14.x ajoutera le
 * trigger Postgres).
 *
 * `version` permet de re-collecter le consentement si les CGU changent.
 */
const consentSchema = z.object({
  cgu: z.literal(true, { errorMap: () => ({ message: 'Acceptation des CGU OHADA requise.' }) }),
  kyc: z.literal(true, { errorMap: () => ({ message: 'Acceptation de la clause KYC requise.' }) }),
  cdp: z.literal(true, { errorMap: () => ({ message: 'Acceptation CDP/ARTCI requise.' }) }),
  ai: z.boolean(),
  version: z.string().min(1).max(20).default('v1'),
});
export type ConsentStepInput = z.infer<typeof consentSchema>;

/** Hash SHA-256 hex via Web Crypto (Workers + Node 20+). Pour anti-corrélation PII. */
async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ─── Router ────────────────────────────────────────────────────────────── */

export const onboardingRouter = router({
  /**
   * Récupère l'état courant du wizard pour l'organisation active. Renvoie
   * `null` si l'onboarding n'a pas encore démarré (aucune ligne en DB).
   */
  get: orgProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.organizationId, ctx.org.id))
      .limit(1);
    return row ?? null;
  }),

  /** Valide le Step 1 (profil entreprise) et avance vers Step 2 (user_profile). */
  completeCompany: orgProcedure.input(companySchema).mutation(({ ctx, input }) =>
    upsertStep({
      db: ctx.db,
      orgId: ctx.org.id,
      ownerUserId: ctx.user.id,
      stepKey: 'company',
      stepIndex: 1,
      nextStage: 'user_profile',
      input,
    }),
  ),

  /** Valide le Step 2 (profil utilisateur) et avance vers Step 3 (consent). */
  completeUserProfile: orgProcedure.input(userProfileSchema).mutation(({ ctx, input }) =>
    upsertStep({
      db: ctx.db,
      orgId: ctx.org.id,
      ownerUserId: ctx.user.id,
      stepKey: 'user',
      stepIndex: 2,
      nextStage: 'consent',
      input,
    }),
  ),

  /**
   * Valide le Step 3 (consentement) — **jalon obligatoire final**. Il :
   *  1. accumule `data.consent` et avance `stage` à `completed` ;
   *  2. marque `completed_obligatory_at` ET `completed_at` (le consent clôt
   *     l'onboarding — plus d'étape welcome séparée), ce qui débloque l'accès
   *     applicatif via `requireOnboardingCompleted` ;
   *  3. bootstrappe la souscription Free (déplacé depuis l'ancien Step plan —
   *     idempotent via l'index unique partiel `subscriptions_org_active_idx`,
   *     donc une re-soumission ne crée pas de doublon) ;
   *  4. insère 1 row immuable dans `consent_log` par consentement coché (PII
   *     hashée).
   *
   * Le plan reste Free par défaut ; le choix/upgrade se fait en post-onboarding
   * dans `/settings/billing`.
   */
  completeConsent: orgProcedure.input(consentSchema).mutation(async ({ ctx, input }) => {
    // 1) Upsert du step (data.consent + stage='completed')
    const row = await upsertStep({
      db: ctx.db,
      orgId: ctx.org.id,
      ownerUserId: ctx.user.id,
      stepKey: 'consent',
      stepIndex: 3,
      nextStage: 'completed',
      input,
    });

    // 2) Marque les jalons (débloque l'app + clôt l'onboarding)
    const now = new Date();
    await ctx.db
      .update(onboardingProgress)
      .set({ completedObligatoryAt: now, completedAt: now, updatedAt: now })
      .where(eq(onboardingProgress.organizationId, ctx.org.id));

    // 2b) Bootstrap de la souscription Free (déplacé de l'ancien Step plan).
    // Idempotent via l'index unique partiel `subscriptions_org_active_idx`.

    // 3) Trace immuable des consentements dans consent_log
    const ipHash = ctx.ip ? await sha256Hex(ctx.ip) : null;
    const ua = ctx.userAgent ?? null;
    const entries: Array<{ type: ConsentType; given: boolean }> = [
      { type: 'cgu_ohada', given: input.cgu },
      { type: 'kyc_retroactif', given: input.kyc },
      { type: 'cdp_artci', given: input.cdp },
      { type: 'ia_disclaimer', given: input.ai },
    ];
    const rowsToInsert = entries
      .filter((e) => e.given)
      .map((e) => ({
        id: generateId(),
        userId: ctx.user.id,
        organizationId: ctx.org.id,
        consentType: e.type,
        version: input.version,
        grantedAt: now,
        ipAddressHash: ipHash,
        userAgent: ua,
      }));
    if (rowsToInsert.length > 0) {
      await ctx.db.insert(consentLog).values(rowsToInsert);
    }

    return { ...row, completedObligatoryAt: now, completedAt: now };
  }),
});
