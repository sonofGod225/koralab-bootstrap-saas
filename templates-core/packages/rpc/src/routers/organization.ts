/**
 * organization router — profil de l'organisation active (Story 3.17).
 *
 * Procedures :
 *  - `create`  — crée une nouvelle organisation "brouillon" + membership owner.
 *                Utilisée par l'onboarding (post-signup) et le dropdown
 *                « Créer une organisation ». `protectedProcedure` (pas d'org
 *                active requise).
 *  - `get`     — retourne les champs éditables de l'organisation active
 *  - `update`  — met à jour nom, slug, pays, devise. Protégé par
 *                `requirePermission('identity:organization:update')`.
 *
 * Logo : non géré pour l'instant (upload R2 → Story 5.6). La colonne `logo`
 * reste éditable via Better-Auth `organization.update` directement quand
 * Story 5.6 sera prête.
 *
 * Slug : doit rester URL-safe et unique. Conflit géré explicitement (409 CONFLICT)
 * pour que le front puisse afficher un message clair.
 */
import { z } from 'zod';
import {
  and,
  eq,
  ne,
  establishments,
  member,
  organizations,
  user,
  userEstablishmentAssignments,
} from '@__SCOPE__/db';
import { COUNTRIES, CURRENCIES, SECTORS, SIZES } from '../lib/enums';
import { orgProcedure, protectedProcedure, router, trpcError } from '../trpc';
import { requirePermission } from '../middleware/require-permission';

/** Slug URL-safe dérivé d'un nom + suffixe aléatoire (unicité best-effort). */
function orgSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'organisation';
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

/* ─── Schémas ───────────────────────────────────────────────────────────── */

/** Slug URL-safe : minuscules, chiffres, tirets. Pas de tiret en début/fin. */
const slugSchema = z
  .string()
  .trim()
  .min(2, 'Au moins 2 caractères.')
  .max(60, 'Au plus 60 caractères.')
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Format invalide (minuscules, chiffres, tirets).');

/** Champ optionnel : '' / null / undefined → null persisté. */
const optionalTrimmedText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null));

const updateOrgSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis.').max(100),
  slug: slugSchema,
  country: z.enum(COUNTRIES),
  currency: z.enum(CURRENCIES),
  legalName: z.string().trim().min(2, 'Raison sociale requise.').max(200),
  tradeName: optionalTrimmedText(80),
  legalId: z.string().trim().min(5, 'NINEA ou RCCM requis.').max(80),
  sector: z.enum(SECTORS),
  size: z.enum(SIZES),
  address: z.string().trim().min(3, 'Adresse requise.').max(200),
  city: z.string().trim().min(2, 'Ville requise.').max(80),
  taxId: optionalTrimmedText(80),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrgSchema>;

/* ─── Router ────────────────────────────────────────────────────────────── */

export const organizationRouter = router({
  /**
   * Crée une nouvelle organisation "brouillon" et y attache l'utilisateur
   * courant comme `owner`. Org minimale (nom + pays + devise) ; les champs
   * entreprise (NINEA, secteur, adresse…) sont collectés au Step 1 du wizard
   * d'onboarding. Tant que l'onboarding obligatoire n'est pas terminé,
   * `requireOnboardingCompleted` bloque l'accès aux procédures applicatives.
   *
   * NE touche PAS à `session.active_organization_id` : le client appelle
   * `authClient.organization.setActive()` après coup, pour rester cohérent avec
   * le cache KV de Better-Auth (même pattern que `<OrgSwitcher />`).
   */
  create: protectedProcedure
    .input(
      z
        .object({
          name: z.string().trim().min(2, 'Nom requis.').max(100).optional(),
          country: z.enum(COUNTRIES).optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const [u] = await ctx.db
        .select({ name: user.name, country: user.country })
        .from(user)
        .where(eq(user.id, ctx.user.id))
        .limit(1);

      const name = input?.name?.trim() || `Organisation de ${u?.name ?? 'mon entreprise'}`;
      const country = input?.country ?? u?.country ?? 'SN';
      const orgId = crypto.randomUUID();
      const slug = orgSlug(name);

      await ctx.db.insert(organizations).values({
        id: orgId,
        name,
        slug,
        country,
        currency: 'XOF',
      });
      await ctx.db.insert(member).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: ctx.user.id,
        role: 'owner',
      });

      // Bootstrap « siège » (ADR 0012, garde-fou) : tout org reçoit d'office un
      // établissement principal + l'owner y est affecté → le mur est invisible
      // aux mono-sites, et l'owner accède aux écrans establishment-scopés (3.19+).
      // Driver Neon HTTP : inserts séquentiels (pas de transaction multi-statement).
      const establishmentId = crypto.randomUUID();
      await ctx.db.insert(establishments).values({
        id: establishmentId,
        organizationId: orgId,
        name: 'Siège',
        country,
        isPrimary: true,
      });
      await ctx.db.insert(userEstablishmentAssignments).values({
        id: crypto.randomUUID(),
        userId: ctx.user.id,
        establishmentId,
        organizationId: orgId,
      });

      return { organizationId: orgId, slug };
    }),

  /** Retourne les champs éditables de l'organisation active. */
  get: orgProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        country: organizations.country,
        currency: organizations.currency,
        legalName: organizations.legalName,
        tradeName: organizations.tradeName,
        legalId: organizations.legalId,
        sector: organizations.sector,
        size: organizations.size,
        address: organizations.address,
        city: organizations.city,
        taxId: organizations.taxId,
        taxStatus: organizations.taxStatus,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(eq(organizations.id, ctx.org.id))
      .limit(1);
    if (!row) throw trpcError('NOT_FOUND', 'Organisation introuvable.');
    return row;
  }),

  /**
   * Met à jour les champs éditables. Restreint aux utilisateurs ayant la
   * permission `identity:organization:update` (owner uniquement par défaut).
   */
  update: orgProcedure
    .use(requirePermission('identity:organization:update'))
    .input(updateOrgSchema)
    .mutation(async ({ ctx, input }) => {
      // Vérif unicité du slug parmi les autres orgs.
      const [conflict] = await ctx.db
        .select({ id: organizations.id })
        .from(organizations)
        .where(and(eq(organizations.slug, input.slug), ne(organizations.id, ctx.org.id)))
        .limit(1);
      if (conflict) {
        throw trpcError('CONFLICT', `Le slug « ${input.slug} » est déjà utilisé.`);
      }

      const [updated] = await ctx.db
        .update(organizations)
        .set({
          name: input.name,
          slug: input.slug,
          country: input.country,
          currency: input.currency,
          legalName: input.legalName,
          tradeName: input.tradeName,
          legalId: input.legalId,
          sector: input.sector,
          size: input.size,
          address: input.address,
          city: input.city,
          taxId: input.taxId,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, ctx.org.id))
        .returning();
      if (!updated) throw trpcError('NOT_FOUND', 'Organisation introuvable.');
      return updated;
    }),
});
