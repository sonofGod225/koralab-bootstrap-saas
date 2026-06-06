/**
 * require-org middleware (Story 3.6 — multi-organisation switching)
 *
 * Scope tenant : résout l'organisation active de la requête et vérifie que
 * l'utilisateur courant en est bien membre, puis peuple `ctx.org`.
 *
 * Source de l'organisation active : `session.activeOrganizationId` (plugin
 * `organization` de Better-Auth), résolu en amont par `apps/api` et transmis
 * via `ctx.activeOrganizationId`. L'appartenance est **revérifiée ici** à
 * chaque appel (défense en profondeur) : un membership peut avoir été révoqué
 * après l'ouverture de la session.
 *
 * Filtrage des requêtes : les procédures `orgProcedure` doivent filtrer leurs
 * requêtes Drizzle par `organization_id = ctx.org.id`. Un filet de sécurité
 * RLS PostgreSQL sera ajouté avec les premières tables tenant métier (cf. note
 * Story 3.6 — aucune table tenant à protéger à ce stade hors `audit_log`).
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { and, eq, member, organizations } from '@__SCOPE__/db';
import type { RpcContext } from '../context';

const t = initTRPC.context<RpcContext>().create();

export const requireOrg = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentification requise.' });
  }
  if (!ctx.activeOrganizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Aucune organisation active. Sélectionnez une organisation.',
    });
  }

  // Vérifie l'appartenance + récupère le slug de l'organisation active.
  const [row] = await ctx.db
    .select({ slug: organizations.slug })
    .from(member)
    .innerJoin(organizations, eq(member.organizationId, organizations.id))
    .where(and(eq(member.userId, ctx.user.id), eq(member.organizationId, ctx.activeOrganizationId)))
    .limit(1);

  if (!row) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: "Vous n'êtes pas membre de cette organisation.",
    });
  }

  return next({
    ctx: {
      // `user` est réaffecté explicitement (et non via `...ctx`) pour propager
      // le narrowing non-undefined aux procédures `orgProcedure` en aval.
      ...ctx,
      user: ctx.user,
      org: { id: ctx.activeOrganizationId, slug: row.slug },
    },
  });
});
