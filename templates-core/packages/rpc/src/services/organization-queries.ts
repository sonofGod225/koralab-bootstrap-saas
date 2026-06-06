/**
 * Requêtes organisation réutilisables (cron, consumers, routers).
 */
import { and, eq, member, user, type Database } from '@__SCOPE__/db';

/**
 * Email du propriétaire (`member.role = 'owner'`) d'une organisation, ou `null`
 * si introuvable. Utilisé par les relances billing (cron + webhooks) pour
 * adresser le destinataire des notifications transactionnelles.
 */
export async function getOwnerEmailForOrganization(
  db: Database,
  organizationId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ email: user.email })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(and(eq(member.organizationId, organizationId), eq(member.role, 'owner')))
    .limit(1);
  return row?.email ?? null;
}
