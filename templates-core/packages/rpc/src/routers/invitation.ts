/**
 * invitation router — invitations d'organisation.
 *
 * Procedures :
 *  - `listForCurrentUser` — liste les invitations `pending` (non expirées)
 *    adressées à l'email de l'utilisateur courant, toutes organisations
 *    confondues. Better-Auth n'expose pas cette vue (il ne liste que les
 *    invitations de l'org active) ; on lit donc directement la table.
 *  - `assignableRoles` — rôles proposables dans le modal d'invitation
 *    (`/settings/team`) **avec** les modules métier auxquels chaque rôle donne
 *    accès. Source unique pour rendre l'UI cohérente avec le modèle RBAC :
 *    l'accès aux modules d'un membre **découle de son rôle** (∩ entitlement de
 *    l'org), il ne se choisit pas par invitation.
 *
 * L'acceptation / le refus restent gérés côté client via Better-Auth
 * (`authClient.organization.acceptInvitation` / `rejectInvitation`), qui met à
 * jour le membership + l'org active de façon cohérente avec le cache KV.
 */
import {
  and,
  desc,
  eq,
  gt,
  inArray,
  invitation,
  isNull,
  or,
  organizations,
  rolePermissions,
  roles,
  sql,
} from '@__SCOPE__/db';
import { CORE_MODULES, PERMISSION_REGISTRY, canAccess } from '@__SCOPE__/rbac';
import type { PermissionRule } from '@__SCOPE__/rbac';
import { orgProcedure, protectedProcedure, router } from '../trpc';

interface AssignableRoleSource {
  name: string;
  description: string | null;
  isPredefined: boolean;
  rules: PermissionRule[];
}

export interface AssignableRolesResult {
  /** Modules métier actifs de l'org (cœur exclu), label/icône du registre RBAC. */
  modules: { id: string; label: string; icon: string }[];
  /**
   * Rôles proposables (owner exclu ; custom inclus seulement si le plan le
   * permet), avec la liste des modules auxquels le rôle donne réellement accès.
   */
  roles: {
    name: string;
    description: string | null;
    isPredefined: boolean;
    accessibleModules: string[];
  }[];
}

/**
 * Calcul **pur** (sans DB) des rôles assignables + de leurs modules accessibles.
 * Factorisé pour être testable et garder la décision dans `@__SCOPE__/rbac`.
 *
 * Un rôle « accède » à un module métier actif s'il existe **au moins une**
 * permission concrète (`module:resource:action` du registre) que ses règles
 * autorisent — on sonde des permissions concrètes car `matchesPermission`
 * n'accepte pas de joker côté requête.
 */
export function buildAssignableRoles(opts: {
  roles: AssignableRoleSource[];
  enabledModules: string[];
  hasCustomRoles: boolean;
}): AssignableRolesResult {
  // Modules affichables : registre moins le cœur (identity/billing/audit),
  // intersecté avec ce que l'org a réellement souscrit.
  const businessModules = PERMISSION_REGISTRY.filter(
    (m) => !CORE_MODULES.includes(m.module) && opts.enabledModules.includes(m.module),
  );

  const modules = businessModules.map((m) => ({ id: m.module, label: m.label, icon: m.icon }));

  const accessibleFor = (rules: PermissionRule[]): string[] =>
    businessModules
      .filter((m) =>
        m.resources.some((r) =>
          m.actions.some((a) =>
            canAccess({ rules, enabledModules: opts.enabledModules }, `${m.module}:${r.id}:${a}`),
          ),
        ),
      )
      .map((m) => m.module);

  const roles = opts.roles
    // On n'invite pas de propriétaire ; rôles custom seulement si le plan les fournit.
    .filter((r) => r.name !== 'owner' && (r.isPredefined || opts.hasCustomRoles))
    .map((r) => ({
      name: r.name,
      description: r.description,
      isPredefined: r.isPredefined,
      accessibleModules: accessibleFor(r.rules),
    }));

  return { modules, roles };
}

export const invitationRouter = router({
  /** Invitations en attente pour l'email de l'utilisateur courant. */
  listForCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.user.email.toLowerCase();
    return ctx.db
      .select({
        id: invitation.id,
        organizationId: invitation.organizationId,
        organizationName: organizations.name,
        organizationLogo: organizations.logo,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .innerJoin(organizations, eq(organizations.id, invitation.organizationId))
      .where(
        and(
          sql`lower(${invitation.email}) = ${email}`,
          eq(invitation.status, 'pending'),
          gt(invitation.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(invitation.createdAt));
  }),

  /**
   * Rôles assignables dans le modal d'invitation + modules accessibles par rôle.
   *
   * `orgProcedure` (pas `requirePermission('identity:role:read')`) : un `admin`
   * peut inviter mais se voit refuser `*:role:*` — il pourrait donc ouvrir le
   * modal sans pouvoir lister les rôles. La donnée exposée (noms de rôles +
   * modules métier de l'org) est peu sensible et nécessaire au flux d'invitation.
   */
  assignableRoles: orgProcedure.query(async ({ ctx }): Promise<AssignableRolesResult> => {
    // Entitlement de l'org : modules actifs (souscription ∪ inclus au plan) +
    // éligibilité aux rôles custom (feature `custom_roles` du plan).
    // Generic core: no plan/subscription entitlement — example module + custom roles allowed.
    const enabledModules: string[] = ['example'];
    const hasCustomRoles = true;

    // Rôles de l'org (prédéfinis globaux + custom scopés) + leurs règles.
    const roleRows = await ctx.db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isPredefined: roles.isPredefined,
      })
      .from(roles)
      .where(or(eq(roles.organizationId, ctx.org.id), isNull(roles.organizationId)));

    const ids = roleRows.map((r) => r.id);
    const perms = ids.length
      ? await ctx.db
          .select({
            roleId: rolePermissions.roleId,
            effect: rolePermissions.effect,
            permission: rolePermissions.permission,
          })
          .from(rolePermissions)
          .where(inArray(rolePermissions.roleId, ids))
      : [];

    const rulesByRole = new Map<string, PermissionRule[]>();
    for (const p of perms) {
      const arr = rulesByRole.get(p.roleId) ?? [];
      arr.push({ effect: p.effect, permission: p.permission });
      rulesByRole.set(p.roleId, arr);
    }

    return buildAssignableRoles({
      roles: roleRows.map((r) => ({
        name: r.name,
        description: r.description,
        isPredefined: r.isPredefined,
        rules: rulesByRole.get(r.id) ?? [],
      })),
      enabledModules,
      hasCustomRoles,
    });
  }),
});
