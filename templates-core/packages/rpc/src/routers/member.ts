/**
 * member router — consultation des membres et invitations d'une organisation
 * (page `/settings/team`).
 *
 * Better-Auth (`organization.getFullOrganization`) ne sait filtrer ni paginer
 * côté serveur : il renvoie l'org complète. Pour un filtrage **réellement
 * backend** (recherche nom/email, rôle, statut d'invitation), on lit donc
 * directement les tables `member ⋈ user` et `invitation`, scopées à l'org
 * active et protégées par `requirePermission('identity:member:read')`
 * (owner/admin/member/guest l'ont via `*:*:read`, cf. seed RBAC).
 *
 * Les **mutations** (inviter / retirer un membre / révoquer une invitation)
 * restent gérées par Better-Auth côté client : elles maintiennent le membership
 * et l'org active cohérents avec le cache KV. Ce router est en lecture seule.
 */
import { z } from 'zod';
import { and, count, desc, eq, ilike, invitation, member, or, user } from '@__SCOPE__/db';
import { orgProcedure, router } from '../trpc';
import { requirePermission } from '../middleware/require-permission';

/** Statuts d'invitation Better-Auth (cf. schéma `invitation.status`). */
const INVITATION_STATUSES = ['pending', 'accepted', 'rejected', 'canceled'] as const;

const listSchema = z.object({
  /** Recherche partielle (ILIKE) sur le nom OU l'email du membre. */
  search: z.string().trim().min(1).max(120).optional(),
  /** Filtre par rôle exact (`owner`, `admin`, `member`, custom…). */
  role: z.string().trim().min(1).max(80).optional(),
  /**
   * Pagination **opt-in** (page 0-indexée). Si `pageSize` est absent, la liste
   * complète est renvoyée — d'autres écrans (drawer d'affectation) en dépendent.
   */
  page: z.number().int().min(0).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});
export type MemberListInput = z.infer<typeof listSchema>;

const listInvitationsSchema = z.object({
  /** Recherche partielle (ILIKE) sur l'email invité. */
  search: z.string().trim().min(1).max(120).optional(),
  /** Filtre par statut (défaut : `pending`). */
  status: z.enum(INVITATION_STATUSES).default('pending'),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type ListInvitationsInput = z.infer<typeof listInvitationsSchema>;

export const memberRouter = router({
  /**
   * Membres de l'organisation active, filtrés en SQL. Renvoie aussi la liste
   * des rôles présents (`availableRoles`) pour peupler le dropdown de filtre
   * sans dépendre du sous-ensemble courant (rôles custom inclus).
   */
  list: orgProcedure
    .use(requirePermission('identity:member:read'))
    .input(listSchema)
    .query(async ({ ctx, input }) => {
      const conds = [eq(member.organizationId, ctx.org.id)];
      if (input.search) {
        conds.push(
          or(ilike(user.name, `%${input.search}%`), ilike(user.email, `%${input.search}%`))!,
        );
      }
      if (input.role) conds.push(eq(member.role, input.role));

      const base = ctx.db
        .select({
          id: member.id,
          userId: member.userId,
          role: member.role,
          createdAt: member.createdAt,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(and(...conds))
        .orderBy(desc(member.createdAt));

      // Pagination opt-in : `pageSize` fourni → fenêtre ; sinon liste complète.
      const rows =
        input.pageSize != null
          ? await base.limit(input.pageSize).offset((input.page ?? 0) * input.pageSize)
          : await base;

      // Rôles distincts + total **non filtré** : le dropdown garde l'éventail
      // complet et l'en-tête « N membres » reflète la taille réelle de l'équipe.
      const roleRows = await ctx.db
        .selectDistinct({ role: member.role })
        .from(member)
        .where(eq(member.organizationId, ctx.org.id));
      const availableRoles = roleRows.map((r) => r.role).sort();

      const [totalRow] = await ctx.db
        .select({ value: count() })
        .from(member)
        .where(eq(member.organizationId, ctx.org.id));
      const total = totalRow?.value ?? 0;

      // Total **filtré** (recherche/rôle) — pilote le nombre de pages côté client.
      const [filteredRow] = await ctx.db
        .select({ value: count() })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(and(...conds));
      const filteredTotal = filteredRow?.value ?? 0;

      const items = rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        role: r.role,
        createdAt: r.createdAt.toISOString(),
        user: { name: r.name, email: r.email, image: r.image },
      }));

      return { items, availableRoles, total, filteredTotal };
    }),

  /** Invitations de l'organisation active, filtrées par statut + recherche email. */
  listInvitations: orgProcedure
    .use(requirePermission('identity:member:read'))
    .input(listInvitationsSchema)
    .query(async ({ ctx, input }) => {
      const conds = [
        eq(invitation.organizationId, ctx.org.id),
        eq(invitation.status, input.status),
      ];
      if (input.search) conds.push(ilike(invitation.email, `%${input.search}%`));

      const [rows, [totalRow]] = await Promise.all([
        ctx.db
          .select({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
          })
          .from(invitation)
          .where(and(...conds))
          .orderBy(desc(invitation.createdAt))
          .limit(input.pageSize)
          .offset(input.page * input.pageSize),
        ctx.db
          .select({ value: count() })
          .from(invitation)
          .where(and(...conds)),
      ]);

      return {
        items: rows.map((r) => ({
          id: r.id,
          email: r.email,
          role: r.role,
          status: r.status,
          expiresAt: r.expiresAt.toISOString(),
          createdAt: r.createdAt.toISOString(),
        })),
        total: totalRow?.value ?? 0,
      };
    }),
});
