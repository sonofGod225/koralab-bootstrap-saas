/* eslint-disable no-console -- script CLI : sortie console attendue */
/**
 * Seed RBAC — les 4 rôles prédéfinis __PROJECT_NAME__ + leurs permissions (Story 3.10).
 *
 * Idempotent : purge les rôles prédéfinis (cascade → role_permissions) puis
 * réinsère. À relancer après toute évolution du catalogue de permissions.
 *
 *   pnpm --filter @__SCOPE__/db db:seed
 *
 * Modèle de permission : `module:resource:action`, `*` = joker de segment.
 * Une règle `deny` l'emporte sur une règle `allow` (cf. `require-permission`).
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { createDb } from '../src/client';
import { roles, rolePermissions } from '../src/schemas/rbac';

interface RoleDef {
  id: string;
  name: string;
  description: string;
  rules: ReadonlyArray<{ effect: 'allow' | 'deny'; permission: string }>;
}

/**
 * Définition produit des 4 rôles prédéfinis (cf. AC Story 3.10).
 * - owner  : toutes les permissions.
 * - admin  : tout sauf la facturation du compte (`billing:*`) et la gestion
 *            des rôles/permissions.
 * - member : lecture / création / édition (pas de suppression, pas de billing).
 * - guest  : lecture seule.
 *
 * Le périmètre « modules assignés » de member/guest sera affiné quand
 * l'assignation de modules par membre sera livrée (réf. Story 3.9 / RBAC).
 */
const ROLE_DEFS: ReadonlyArray<RoleDef> = [
  {
    id: 'role_owner',
    name: 'owner',
    description: 'Propriétaire — accès complet à l’organisation.',
    rules: [{ effect: 'allow', permission: '*' }],
  },
  {
    id: 'role_admin',
    name: 'admin',
    description: 'Administrateur — tout sauf la facturation et la gestion des rôles.',
    rules: [
      { effect: 'allow', permission: '*' },
      { effect: 'deny', permission: 'billing:*' },
      { effect: 'deny', permission: '*:role:*' },
      { effect: 'deny', permission: '*:permission:*' },
    ],
  },
  {
    id: 'role_member',
    name: 'member',
    description: 'Membre — lecture, création et édition sur les modules autorisés.',
    rules: [
      { effect: 'allow', permission: '*:*:read' },
      { effect: 'allow', permission: '*:*:create' },
      { effect: 'allow', permission: '*:*:update' },
      { effect: 'deny', permission: 'billing:*' },
    ],
  },
  {
    id: 'role_guest',
    name: 'guest',
    description: 'Invité — lecture seule sur les modules autorisés.',
    rules: [
      { effect: 'allow', permission: '*:*:read' },
      { effect: 'deny', permission: 'billing:*' },
    ],
  },
];

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL requis dans packages/db/.env');

  const db = createDb(url);
  const ids = ROLE_DEFS.map((r) => r.id);

  // Purge idempotente — le cascade FK supprime aussi les role_permissions.
  await db.delete(roles).where(inArray(roles.id, ids));

  for (const def of ROLE_DEFS) {
    await db.insert(roles).values({
      id: def.id,
      name: def.name,
      description: def.description,
      isPredefined: true,
    });
    await db.insert(rolePermissions).values(
      def.rules.map((rule) => ({
        id: randomUUID(),
        roleId: def.id,
        effect: rule.effect,
        permission: rule.permission,
      })),
    );
  }

  const ruleCount = ROLE_DEFS.reduce((n, r) => n + r.rules.length, 0);
  console.log(`✅ Seed RBAC : ${ROLE_DEFS.length} rôles prédéfinis, ${ruleCount} règles.`);
}

main().catch((err: unknown) => {
  console.error('❌ Seed RBAC échoué :', err);
  process.exit(1);
});
