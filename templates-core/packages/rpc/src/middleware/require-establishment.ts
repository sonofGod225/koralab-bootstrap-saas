/**
 * require-establishment middleware (Story 3.19 — multi-établissement, ADR 0012)
 *
 * À chaîner **après** `requireOrg` : résout l'**établissement actif** de la
 * requête et peuple `ctx.establishment`. Le serveur est la seule autorité.
 *
 * Source de l'établissement actif : `session.active_establishment_id` (colonne
 * gérée hors Better-Auth, Story 3.19), **lue fraîche** depuis la table `session`
 * — donc pas de cache KV à invalider.
 *
 * Accessibilité (ADR 0012 §2) :
 * - rôle **org-spanning** (`member.role` ∈ {owner, admin}) → **traverse** le mur
 *   (tout établissement non supprimé de l'org) ;
 * - sinon **borné** aux `user_establishment_assignments` de l'utilisateur.
 *
 * Invariant `établissement ⊂ org` + dérivation du défaut : si l'id stocké n'est
 * pas accessible (autre org, supprimé, non affecté) il est **ignoré** ; on dérive
 * alors le défaut (1 seul accessible → lui ; sinon le siège `is_primary` s'il est
 * accessible, sinon le 1ᵉʳ). 0 accessible → `FORBIDDEN`.
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { eq, session } from '@__SCOPE__/db';
import type { RpcContext } from '../context';
import { getAccessibleEstablishments } from '../services/establishment-access';

const t = initTRPC.context<RpcContext>().create();

export const requireEstablishment = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentification requise.' });
  }
  if (!ctx.org) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Aucune organisation active.' });
  }
  const org = ctx.org;
  const currentUser = ctx.user;

  // Établissements accessibles (owner/admin traverse, sinon borné aux affectations).
  const accessible = await getAccessibleEstablishments(ctx.db, org.id, currentUser.id);

  const first = accessible[0];
  if (!first) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message:
        'Aucun établissement accessible. Demandez à un administrateur de vous affecter à un établissement.',
    });
  }

  // Établissement actif : autorité **KV** (`est:{sessionId}`, posé par `setActive`).
  // Les sessions Better-Auth vivent en KV et non en Postgres → la colonne
  // `session.active_establishment_id` resterait vide. Repli colonne pour les
  // environnements sans KV (tests unitaires).
  let activeId: string | null = null;
  if (ctx.sessionId) {
    if (ctx.env.SESSIONS_KV) {
      activeId = await ctx.env.SESSIONS_KV.get(`est:${ctx.sessionId}`);
    }
    if (!activeId) {
      const [s] = await ctx.db
        .select({ aeid: session.activeEstablishmentId })
        .from(session)
        .where(eq(session.id, ctx.sessionId))
        .limit(1);
      activeId = s?.aeid ?? null;
    }
  }

  const accessibleIds = new Set(accessible.map((e) => e.id));
  let chosenId: string;
  if (activeId && accessibleIds.has(activeId)) {
    // Invariant respecté : l'id stocké appartient bien à l'org active + accessible.
    chosenId = activeId;
  } else if (accessible.length === 1) {
    chosenId = first.id;
  } else {
    chosenId = accessible.find((e) => e.isPrimary)?.id ?? first.id;
  }

  return next({
    ctx: { ...ctx, user: currentUser, org, establishment: { id: chosenId } },
  });
});
