/* eslint-disable no-console -- script CLI : sortie console attendue */
/**
 * Backfill multi-établissement (Story 3.18, ADR 0012 — garde-fou).
 *
 * Pour chaque organisation **sans établissement** : crée un « siège »
 * (`is_primary = true`, `country = organizations.country`) et y **affecte tous
 * les membres actuels** de l'org. Rend le mur invisible aux orgs legacy et évite
 * qu'un owner/membre se retrouve sans établissement (sinon bloqué par
 * `requireEstablishment` en Story 3.19).
 *
 * Idempotent : une org possédant déjà au moins un établissement non supprimé est
 * ignorée ; un membre déjà affecté au siège n'est pas redoublé.
 *
 *   pnpm --filter @__SCOPE__/db db:backfill:establishments
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { createDb } from '../src/client';
import { establishments, userEstablishmentAssignments } from '../src/schemas/establishments';
import { member, organizations } from '../src/schemas/identity';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL requis dans packages/db/.env');
  const db = createDb(url);

  const orgs = await db
    .select({ id: organizations.id, country: organizations.country })
    .from(organizations);

  let created = 0;
  let assigned = 0;
  let skipped = 0;

  for (const org of orgs) {
    const [existing] = await db
      .select({ id: establishments.id })
      .from(establishments)
      .where(and(eq(establishments.organizationId, org.id), isNull(establishments.deletedAt)))
      .limit(1);
    if (existing) {
      skipped += 1;
      continue;
    }

    const establishmentId = randomUUID();
    await db.insert(establishments).values({
      id: establishmentId,
      organizationId: org.id,
      name: 'Siège',
      country: org.country,
      isPrimary: true,
    });
    created += 1;

    const members = await db
      .select({ userId: member.userId })
      .from(member)
      .where(eq(member.organizationId, org.id));
    for (const m of members) {
      await db.insert(userEstablishmentAssignments).values({
        id: randomUUID(),
        userId: m.userId,
        establishmentId,
        organizationId: org.id,
      });
      assigned += 1;
    }
  }

  console.log(
    `✅ Backfill établissements : ${created} siège(s) créé(s), ${assigned} affectation(s), ${skipped} org(s) déjà OK.`,
  );
}

main().catch((err: unknown) => {
  console.error('❌ Backfill établissements échoué :', err);
  process.exit(1);
});
