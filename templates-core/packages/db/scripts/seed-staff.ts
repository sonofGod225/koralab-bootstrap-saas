/* eslint-disable no-console -- script CLI : sortie console attendue */
/**
 * Seed staff — promeut un compte existant en `role='admin'` (Epic 24).
 *
 * Le back-office `apps/admin` n'a pas d'auto-inscription : les comptes staff
 * sont des utilisateurs __PROJECT_NAME__ normaux promus au rôle plateforme `admin`
 * (plugin `admin` de Better-Auth). Ce script est idempotent.
 *
 *   BUDISUITE_STAFF_EMAIL=salif.sow@__PROJECT_SLUG__.com pnpm --filter @__SCOPE__/db db:seed:staff
 *
 * L'utilisateur doit déjà s'être inscrit (email vérifié + 2FA recommandée).
 * Si l'email n'existe pas encore, le script le signale sans échouer.
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { createDb } from '../src/client';
import { user } from '../src/schemas/identity';

async function main() {
  const email = process.env.BUDISUITE_STAFF_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new Error('BUDISUITE_STAFF_EMAIL est requis (ex: salif.sow@__PROJECT_SLUG__.com).');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL est requis dans packages/db/.env');
  }

  const db = createDb(process.env.DATABASE_URL);
  const [existing] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!existing) {
    console.warn(
      `⚠️  Aucun compte trouvé pour « ${email} ». Inscris-toi d'abord sur l'app, puis relance ce script.`,
    );
    return;
  }

  if (existing.role === 'admin') {
    console.log(`✓ « ${email} » est déjà staff (role='admin'). Rien à faire.`);
    return;
  }

  await db
    .update(user)
    .set({ role: 'admin', updatedAt: new Date() })
    .where(eq(user.id, existing.id));
  console.log(`✓ « ${email} » promu staff (role='admin'). Accès back-office activé.`);
}

main().catch((err) => {
  console.error('seed-staff a échoué :', err);
  process.exit(1);
});
