/* eslint-disable no-console -- script CLI : sortie console attendue */
/**
 * Reset des rôles custom (ADR 0011 — migration RBAC vers le registre typé).
 *
 * Au déploiement du nouveau namespace canonique (EN) + registre `@__SCOPE__/rbac`,
 * les permissions des rôles **custom** existants peuvent ne plus concorder avec
 * les gates backend (ancien namespace, resource figée `*`). Plutôt qu'un remap
 * fragile, on **purge** les rôles org-scopés ; les owners les recréent via la
 * matrice corrigée (UI affiche un EmptyState dédié).
 *
 * Les 4 rôles prédéfinis (`organization_id IS NULL`) ne sont **pas** touchés.
 * Le cascade FK supprime aussi les `role_permissions` associées.
 *
 *   pnpm --filter @__SCOPE__/db db:reset-custom-roles
 */
import 'dotenv/config';
import { isNotNull } from 'drizzle-orm';
import { createDb } from '../src/client';
import { roles } from '../src/schemas/rbac';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL requis dans packages/db/.env');

  const db = createDb(url);

  // Compte avant purge (pour le log) — uniquement les rôles custom org-scopés.
  const before = await db
    .select({ id: roles.id })
    .from(roles)
    .where(isNotNull(roles.organizationId));
  const deleted = await db
    .delete(roles)
    .where(isNotNull(roles.organizationId))
    .returning({ id: roles.id });

  console.log(
    `✅ Reset rôles custom : ${deleted.length} rôle(s) supprimé(s) (sur ${before.length} détecté(s)). ` +
      'Les rôles prédéfinis sont conservés.',
  );
}

main().catch((err: unknown) => {
  console.error('❌ Reset rôles custom échoué :', err);
  process.exit(1);
});
