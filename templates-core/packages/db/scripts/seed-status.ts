/* eslint-disable no-console -- script CLI : sortie console attendue */
/**
 * Seed status — registre des composants surveillés (Epic 25, Story 25.1).
 *
 * Idempotent : upsert sur `service_components.key`.
 *
 *   pnpm --filter @__SCOPE__/db db:seed:status
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { createDb } from '../src/client';
import { serviceComponents, type ComponentKind } from '../src/schemas/status';

interface Comp {
  key: string;
  label: string;
  kind: ComponentKind;
  isPublic: boolean;
  sortOrder: number;
}

const COMPONENTS: ReadonlyArray<Comp> = [
  { key: 'api', label: 'API', kind: 'internal', isPublic: true, sortOrder: 0 },
  { key: 'suite', label: 'Application (suite)', kind: 'internal', isPublic: true, sortOrder: 1 },
  { key: 'admin', label: 'Back-office admin', kind: 'internal', isPublic: false, sortOrder: 2 },
  { key: 'db', label: 'Base de données', kind: 'internal', isPublic: true, sortOrder: 3 },
  { key: 'kv', label: 'Cache sessions (KV)', kind: 'internal', isPublic: false, sortOrder: 4 },
  { key: 'queue_billing', label: 'File billing', kind: 'internal', isPublic: false, sortOrder: 5 },
  { key: 'stripe', label: 'Stripe', kind: 'psp', isPublic: true, sortOrder: 6 },
  { key: 'paystack', label: 'Paystack', kind: 'psp', isPublic: true, sortOrder: 7 },
  { key: 'wave', label: 'Wave', kind: 'psp', isPublic: true, sortOrder: 8 },
  { key: 'fne_dgi', label: 'FNE / DGI (CI)', kind: 'external', isPublic: true, sortOrder: 9 },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL est requis dans packages/db/.env');
  const db = createDb(process.env.DATABASE_URL);

  for (const c of COMPONENTS) {
    await db
      .insert(serviceComponents)
      .values({ id: randomUUID(), ...c })
      .onConflictDoUpdate({
        target: serviceComponents.key,
        set: {
          label: c.label,
          kind: c.kind,
          isPublic: c.isPublic,
          sortOrder: c.sortOrder,
          updatedAt: sql`now()`,
        },
      });
  }
  console.log(`✓ ${COMPONENTS.length} composants seedés (service_components).`);
}

main().catch((err) => {
  console.error('seed-status a échoué :', err);
  process.exit(1);
});
