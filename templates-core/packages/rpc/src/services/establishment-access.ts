/**
 * Accès établissement (Story 3.19, ADR 0012) — source unique de la règle
 * d'accessibilité, partagée par `require-establishment` et le router
 * `establishments`.
 *
 * Règle (ADR 0012 §2) : un rôle **org-spanning** (owner/admin) traverse le mur
 * (tout établissement non supprimé de l'org) ; sinon l'utilisateur est **borné**
 * à ses `user_establishment_assignments`.
 */
import {
  and,
  eq,
  establishments,
  isNull,
  member,
  userEstablishmentAssignments,
  type Database,
} from '@__SCOPE__/db';

/** Rôles qui traversent le mur (accès à tout établissement de l'org). */
const ORG_SPANNING_ROLES = new Set(['owner', 'admin']);

export interface AccessibleEstablishment {
  id: string;
  name: string;
  isPrimary: boolean;
}

/** `true` si l'utilisateur a un rôle org-spanning (owner/admin) dans l'org. */
export async function isOrgSpanning(db: Database, orgId: string, userId: string): Promise<boolean> {
  const [m] = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
    .limit(1);
  return m ? ORG_SPANNING_ROLES.has(m.role) : false;
}

/**
 * Établissements (non supprimés) accessibles à l'utilisateur dans l'org : tous si
 * org-spanning, sinon ceux auxquels il est affecté. `organization_id` scope
 * applicatif (pas de RLS).
 */
export async function getAccessibleEstablishments(
  db: Database,
  orgId: string,
  userId: string,
): Promise<AccessibleEstablishment[]> {
  if (await isOrgSpanning(db, orgId, userId)) {
    return db
      .select({
        id: establishments.id,
        name: establishments.name,
        isPrimary: establishments.isPrimary,
      })
      .from(establishments)
      .where(and(eq(establishments.organizationId, orgId), isNull(establishments.deletedAt)));
  }
  return db
    .select({
      id: establishments.id,
      name: establishments.name,
      isPrimary: establishments.isPrimary,
    })
    .from(userEstablishmentAssignments)
    .innerJoin(establishments, eq(establishments.id, userEstablishmentAssignments.establishmentId))
    .where(
      and(
        eq(userEstablishmentAssignments.organizationId, orgId),
        eq(userEstablishmentAssignments.userId, userId),
        isNull(establishments.deletedAt),
      ),
    );
}
