/**
 * establishments router — multi-établissement (Stories 3.19-3.20, ADR 0012).
 *
 * 3.19 : `listMine` / `setActive` (établissement actif de session, autorité serveur).
 * 3.20 : CRUD établissements + `entitlement` (limites plan) + affectations
 * user↔établissement. Isolation **applicative** : tout est scopé `ctx.org.id`.
 *
 * Permissions (registre `@__SCOPE__/rbac`, ADR 0011) :
 * - gestion établissement → `identity:establishment:{read,create,update,delete}` ;
 * - affectation user↔établissement → `identity:member:update` (action member-scoped).
 * owner/admin couvrent via wildcards (seed). Accessibilité (owner traverse / membre
 * borné) : `services/establishment-access.ts`.
 *
 * Neon HTTP : pas de transaction multi-statement → `setPrimary` = clear puis set
 * (l'index unique partiel `establishments_one_primary_idx` est le filet).
 */
import { z } from 'zod';
import {
  and,
  auditLog,
  count,
  eq,
  establishments,
  inArray,
  invitation,
  invitationEstablishments,
  isNull,
  member,
  ne,
  organizations,
  session,
  sql,
  user,
  userEstablishmentAssignments,
  type Database,
} from '@__SCOPE__/db';
import { establishmentProcedure, orgProcedure, router, trpcError } from '../trpc';
import { requirePermission } from '../middleware/require-permission';
import { getAccessibleEstablishments } from '../services/establishment-access';

/** Generic core: no plan-based limits (that was billing). Always allow. */
function canCreateMore(limit: number | null, current: number): boolean {
  return limit === null || current < limit;
}

/** Contexte d'une procédure `orgProcedure` (org + user garantis non-null). */
interface OrgCtx {
  readonly db: Database;
  readonly org: { readonly id: string; readonly slug: string };
  readonly user: { readonly id: string };
  readonly sessionId?: string;
  readonly ip?: string;
  readonly userAgent?: string;
}

/** TTL KV de l'établissement actif — aligné sur l'expiration de session (7 j). */
const SESSION_TTL_S = 60 * 60 * 24 * 7;

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().length(2).optional(),
});

export const establishmentsRouter = router({
  /* ─── 3.19 : sélecteur header + bascule active ───────────────────────────── */

  /** Établissements accessibles à l'utilisateur courant (siège d'abord). */
  listMine: orgProcedure.query(async ({ ctx }) => {
    const rows = await getAccessibleEstablishments(ctx.db, ctx.org.id, ctx.user.id);
    return rows
      .map((e) => ({ id: e.id, name: e.name, isPrimary: e.isPrimary }))
      .sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }),

  /** Établissement actif résolu (invariant + défaut appliqués) — pour le header. */
  current: establishmentProcedure.query(({ ctx }) => ({ id: ctx.establishment?.id ?? null })),

  /** Bascule l'établissement actif de la session (refuse non accessible). */
  setActive: orgProcedure
    .input(z.object({ establishmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const accessible = await getAccessibleEstablishments(ctx.db, ctx.org.id, ctx.user.id);
      if (!accessible.some((e) => e.id === input.establishmentId)) {
        throw trpcError('FORBIDDEN', 'Établissement non accessible.');
      }
      if (!ctx.sessionId) throw trpcError('UNAUTHORIZED', 'Session requise.');
      // Autorité serveur : l'établissement actif vit en **KV** (clé `est:{sessionId}`).
      // Les sessions Better-Auth sont stockées en KV (`secondaryStorage`) et non en
      // Postgres ; écrire `session.active_establishment_id` toucherait 0 ligne (ADR 0012,
      // Story 3.19). Repli sur la colonne en l'absence de KV (tests unitaires).
      if (ctx.env.SESSIONS_KV) {
        await ctx.env.SESSIONS_KV.put(`est:${ctx.sessionId}`, input.establishmentId, {
          expirationTtl: SESSION_TTL_S,
        });
      } else {
        await ctx.db
          .update(session)
          .set({ activeEstablishmentId: input.establishmentId })
          .where(eq(session.id, ctx.sessionId));
      }
      return { ok: true, establishmentId: input.establishmentId };
    }),

  /* ─── 3.20 : entitlement + CRUD ──────────────────────────────────────────── */

  /** Limite plan + compteur courant (gating UI). Le siège compte dans la limite. */
  entitlement: orgProcedure
    .use(requirePermission('identity:establishment:read'))
    .query(async ({ ctx }) => {
      const limit = await getOrgLimit(ctx);
      const current = await countEstablishments(ctx);
      return {
        establishmentLimit: limit,
        establishmentCount: current,
        canCreate: canCreateMore(limit, current),
      };
    }),

  /**
   * Liste paginée des établissements (non supprimés) de l'org + nb de membres
   * affectés. Volume borné par le plan → tri (siège d'abord) + slice en mémoire.
   * Retour `{ items, total }` (aligné contacts.list/catalogue.list).
   */
  list: orgProcedure
    .use(requirePermission('identity:establishment:read'))
    .input(
      z
        .object({
          page: z.number().int().min(0).default(0),
          pageSize: z.number().int().min(1).max(100).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 0;
      const pageSize = input?.pageSize ?? 20;

      const rows = await ctx.db
        .select()
        .from(establishments)
        .where(
          and(eq(establishments.organizationId, ctx.org.id), isNull(establishments.deletedAt)),
        );

      const counts = await ctx.db
        .select({ establishmentId: userEstablishmentAssignments.establishmentId, n: count() })
        .from(userEstablishmentAssignments)
        .where(eq(userEstablishmentAssignments.organizationId, ctx.org.id))
        .groupBy(userEstablishmentAssignments.establishmentId);
      const byEstablishment = new Map(counts.map((c) => [c.establishmentId, Number(c.n)]));

      const sorted = rows
        .map((e) => ({
          id: e.id,
          name: e.name,
          address: e.address,
          city: e.city,
          country: e.country,
          isPrimary: e.isPrimary,
          memberCount: byEstablishment.get(e.id) ?? 0,
          createdAt: e.createdAt,
        }))
        .sort((a, b) => {
          if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

      const start = page * pageSize;
      return { items: sorted.slice(start, start + pageSize), total: sorted.length };
    }),

  /** Détail d'un établissement (scopé org, non supprimé). */
  get: orgProcedure
    .use(requirePermission('identity:establishment:read'))
    .input(z.object({ establishmentId: z.string().min(1) }))
    .query(async ({ ctx, input }) => loadEstablishment(ctx, input.establishmentId)),

  /** Crée un établissement. 1er de l'org → principal. Enforce la limite plan. */
  create: orgProcedure
    .use(requirePermission('identity:establishment:create'))
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      const limit = await getOrgLimit(ctx);
      const current = await countEstablishments(ctx);
      if (!canCreateMore(limit, current)) {
        throw trpcError(
          'FORBIDDEN',
          limit === null
            ? 'Limite atteinte.'
            : `Limite du plan atteinte (${limit} établissement${limit > 1 ? 's' : ''}).`,
        );
      }
      let country = input.country ?? null;
      if (!country) {
        const [orgRow] = await ctx.db
          .select({ country: organizations.country })
          .from(organizations)
          .where(eq(organizations.id, ctx.org.id))
          .limit(1);
        country = orgRow?.country ?? null;
      }
      const id = crypto.randomUUID();
      const isPrimary = current === 0;
      await ctx.db.insert(establishments).values({
        id,
        organizationId: ctx.org.id,
        name: input.name,
        address: input.address ?? null,
        city: input.city ?? null,
        country,
        isPrimary,
      });
      await writeAudit(ctx, 'establishment.created', id, {
        before: null,
        after: { name: input.name, isPrimary },
      });
      return { id, isPrimary };
    }),

  /** Met à jour un établissement (nom, adresse, ville, pays). */
  update: orgProcedure
    .use(requirePermission('identity:establishment:update'))
    .input(createSchema.extend({ establishmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const before = await loadEstablishment(ctx, input.establishmentId);
      await ctx.db
        .update(establishments)
        .set({
          name: input.name,
          address: input.address ?? null,
          city: input.city ?? null,
          country: input.country ?? before.country,
          updatedAt: new Date(),
        })
        .where(eq(establishments.id, before.id));
      await writeAudit(ctx, 'establishment.updated', before.id, {
        before: { name: before.name, address: before.address, city: before.city },
        after: { name: input.name, address: input.address, city: input.city },
      });
      return { id: before.id };
    }),

  /** Supprime (soft) un établissement + purge ses affectations. Refuse le principal s'il en reste d'autres. */
  delete: orgProcedure
    .use(requirePermission('identity:establishment:delete'))
    .input(z.object({ establishmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const target = await loadEstablishment(ctx, input.establishmentId);
      const [{ n: others } = { n: 0 }] = await ctx.db
        .select({ n: count() })
        .from(establishments)
        .where(
          and(
            eq(establishments.organizationId, ctx.org.id),
            isNull(establishments.deletedAt),
            ne(establishments.id, target.id),
          ),
        );
      // Garde : ne jamais laisser l'org à 0 établissement (sinon tout
      // establishmentProcedure renverrait FORBIDDEN, y compris à l'owner).
      if (Number(others) === 0) {
        throw trpcError(
          'BAD_REQUEST',
          "Impossible de supprimer le dernier établissement de l'organisation.",
        );
      }
      if (target.isPrimary) {
        throw trpcError(
          'BAD_REQUEST',
          'Désignez un autre établissement principal avant de supprimer celui-ci.',
        );
      }
      await ctx.db
        .delete(userEstablishmentAssignments)
        .where(eq(userEstablishmentAssignments.establishmentId, target.id));
      await ctx.db
        .update(establishments)
        .set({ deletedAt: new Date(), isPrimary: false })
        .where(eq(establishments.id, target.id));
      await writeAudit(ctx, 'establishment.deleted', target.id, {
        before: { name: target.name },
        after: null,
      });
      return { id: target.id };
    }),

  /** Désigne un établissement comme principal (un seul à la fois). */
  setPrimary: orgProcedure
    .use(requirePermission('identity:establishment:update'))
    .input(z.object({ establishmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const target = await loadEstablishment(ctx, input.establishmentId);
      // Atomique (1 seul UPDATE) : met `is_primary=true` sur la cible et `false`
      // sur les autres en une passe → pas de fenêtre « zéro principal » sur échec
      // partiel (Neon HTTP sans transaction), pas de collision concurrente sur
      // l'index unique partiel.
      await ctx.db
        .update(establishments)
        .set({ isPrimary: sql`(${establishments.id} = ${target.id})`, updatedAt: new Date() })
        .where(
          and(eq(establishments.organizationId, ctx.org.id), isNull(establishments.deletedAt)),
        );
      await writeAudit(ctx, 'establishment.set_primary', target.id, {
        before: null,
        after: { isPrimary: true },
      });
      return { id: target.id };
    }),

  /* ─── 3.20 : affectations user ↔ établissement ───────────────────────────── */

  /** Affecte un membre de l'org à un établissement (idempotent). */
  assignUser: orgProcedure
    .use(requirePermission('identity:member:update'))
    .input(z.object({ userId: z.string().min(1), establishmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const est = await loadEstablishment(ctx, input.establishmentId);
      const [isMember] = await ctx.db
        .select({ id: member.id })
        .from(member)
        .where(and(eq(member.organizationId, ctx.org.id), eq(member.userId, input.userId)))
        .limit(1);
      if (!isMember)
        throw trpcError('NOT_FOUND', "L'utilisateur n'est pas membre de l'organisation.");
      const [existing] = await ctx.db
        .select({ id: userEstablishmentAssignments.id })
        .from(userEstablishmentAssignments)
        .where(
          and(
            eq(userEstablishmentAssignments.userId, input.userId),
            eq(userEstablishmentAssignments.establishmentId, est.id),
          ),
        )
        .limit(1);
      if (existing) return { id: existing.id, alreadyAssigned: true };
      const id = crypto.randomUUID();
      await ctx.db.insert(userEstablishmentAssignments).values({
        id,
        userId: input.userId,
        establishmentId: est.id,
        organizationId: ctx.org.id,
      });
      await writeAudit(ctx, 'establishment.user_assigned', est.id, {
        before: null,
        after: { userId: input.userId },
      });
      return { id, alreadyAssigned: false };
    }),

  /** Retire l'affectation d'un membre à un établissement. */
  unassignUser: orgProcedure
    .use(requirePermission('identity:member:update'))
    .input(z.object({ userId: z.string().min(1), establishmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const est = await loadEstablishment(ctx, input.establishmentId);
      await ctx.db
        .delete(userEstablishmentAssignments)
        .where(
          and(
            eq(userEstablishmentAssignments.organizationId, ctx.org.id),
            eq(userEstablishmentAssignments.userId, input.userId),
            eq(userEstablishmentAssignments.establishmentId, est.id),
          ),
        );
      await writeAudit(ctx, 'establishment.user_unassigned', est.id, {
        before: { userId: input.userId },
        after: null,
      });
      return { ok: true };
    }),

  /** Affectations de l'org (pour le drawer 3.21) : couples (userId, establishmentId). */
  listAssignments: orgProcedure
    .use(requirePermission('identity:member:read'))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          userId: userEstablishmentAssignments.userId,
          establishmentId: userEstablishmentAssignments.establishmentId,
        })
        .from(userEstablishmentAssignments)
        .innerJoin(
          establishments,
          eq(establishments.id, userEstablishmentAssignments.establishmentId),
        )
        .innerJoin(user, eq(user.id, userEstablishmentAssignments.userId))
        .where(
          and(
            eq(userEstablishmentAssignments.organizationId, ctx.org.id),
            isNull(establishments.deletedAt),
          ),
        );
    }),

  /* ─── 3.25 : appartenance établissement portée par l'invitation ──────────── */

  /** Fixe les établissements cibles d'une invitation (remplace l'existant). Story 3.25. */
  setInvitationEstablishments: orgProcedure
    .use(requirePermission('identity:member:update'))
    .input(
      z.object({
        invitationId: z.string().min(1),
        establishmentIds: z.array(z.string().min(1)).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [inv] = await ctx.db
        .select({ id: invitation.id, organizationId: invitation.organizationId })
        .from(invitation)
        .where(eq(invitation.id, input.invitationId))
        .limit(1);
      if (!inv || inv.organizationId !== ctx.org.id)
        throw trpcError('NOT_FOUND', 'Invitation introuvable dans cette organisation.');

      // Remplace les cibles : purge puis ré-insère les établissements valides de l'org.
      await ctx.db
        .delete(invitationEstablishments)
        .where(eq(invitationEstablishments.invitationId, inv.id));
      if (input.establishmentIds.length === 0) return { count: 0 };

      const valid = await ctx.db
        .select({ id: establishments.id })
        .from(establishments)
        .where(
          and(
            eq(establishments.organizationId, ctx.org.id),
            isNull(establishments.deletedAt),
            inArray(establishments.id, input.establishmentIds),
          ),
        );
      const rows = valid.map((v) => ({
        invitationId: inv.id,
        establishmentId: v.id,
        organizationId: ctx.org.id,
      }));
      if (rows.length > 0) await ctx.db.insert(invitationEstablishments).values(rows);
      return { count: rows.length };
    }),

  /** Cibles établissement par invitation (pour l'affichage de la liste). Story 3.25. */
  listInvitationEstablishments: orgProcedure
    .use(requirePermission('identity:member:read'))
    .query(async ({ ctx }) => {
      return ctx.db
        .select({
          invitationId: invitationEstablishments.invitationId,
          establishmentId: invitationEstablishments.establishmentId,
        })
        .from(invitationEstablishments)
        .where(eq(invitationEstablishments.organizationId, ctx.org.id));
    }),

  /**
   * Auto-affecte l'utilisateur courant (invité venant d'accepter) aux établissements
   * cibles de l'invitation — sinon au siège. Idempotent. Appelée par l'écran
   * d'acceptation après `acceptInvitation` (l'invité n'a pas `member:update`). Story 3.25.
   */
  acceptInvitationEstablishments: orgProcedure
    .input(z.object({ invitationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [inv] = await ctx.db
        .select({ id: invitation.id, organizationId: invitation.organizationId })
        .from(invitation)
        .where(eq(invitation.id, input.invitationId))
        .limit(1);
      if (!inv || inv.organizationId !== ctx.org.id)
        throw trpcError('NOT_FOUND', 'Invitation introuvable dans cette organisation.');

      const targets = await ctx.db
        .select({ establishmentId: invitationEstablishments.establishmentId })
        .from(invitationEstablishments)
        .where(eq(invitationEstablishments.invitationId, inv.id));
      let estIds = targets.map((t) => t.establishmentId);

      // Repli : aucun choix explicite → siège (rétro-compatible avec l'ancien comportement).
      if (estIds.length === 0) {
        const [primary] = await ctx.db
          .select({ id: establishments.id })
          .from(establishments)
          .where(
            and(
              eq(establishments.organizationId, ctx.org.id),
              eq(establishments.isPrimary, true),
              isNull(establishments.deletedAt),
            ),
          )
          .limit(1);
        estIds = primary ? [primary.id] : [];
      }

      let assigned = 0;
      for (const estId of estIds) {
        const [est] = await ctx.db
          .select({ id: establishments.id })
          .from(establishments)
          .where(
            and(
              eq(establishments.id, estId),
              eq(establishments.organizationId, ctx.org.id),
              isNull(establishments.deletedAt),
            ),
          )
          .limit(1);
        if (!est) continue;
        const [existing] = await ctx.db
          .select({ id: userEstablishmentAssignments.id })
          .from(userEstablishmentAssignments)
          .where(
            and(
              eq(userEstablishmentAssignments.userId, ctx.user.id),
              eq(userEstablishmentAssignments.establishmentId, est.id),
            ),
          )
          .limit(1);
        if (existing) continue;
        await ctx.db.insert(userEstablishmentAssignments).values({
          id: crypto.randomUUID(),
          userId: ctx.user.id,
          establishmentId: est.id,
          organizationId: ctx.org.id,
        });
        assigned++;
      }
      return { assigned };
    }),
});

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

async function loadEstablishment(ctx: OrgCtx, establishmentId: string) {
  const [row] = await ctx.db
    .select()
    .from(establishments)
    .where(
      and(
        eq(establishments.id, establishmentId),
        eq(establishments.organizationId, ctx.org.id),
        isNull(establishments.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw trpcError('NOT_FOUND', 'Établissement introuvable dans cette organisation.');
  return row;
}

async function countEstablishments(ctx: OrgCtx): Promise<number> {
  const [{ n } = { n: 0 }] = await ctx.db
    .select({ n: count() })
    .from(establishments)
    .where(and(eq(establishments.organizationId, ctx.org.id), isNull(establishments.deletedAt)));
  return Number(n);
}

/** Establishment limit — unlimited in the generic core (plan limits were business). */
async function getOrgLimit(_ctx: OrgCtx): Promise<number | null> {
  return null;
}

async function writeAudit(
  ctx: OrgCtx,
  action: string,
  resourceId: string,
  details: { before: unknown; after: unknown },
): Promise<void> {
  await ctx.db.insert(auditLog).values({
    id: crypto.randomUUID(),
    organizationId: ctx.org.id,
    userId: ctx.user.id,
    sessionId: ctx.sessionId,
    action,
    resourceType: 'establishment',
    resourceId,
    details,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}
