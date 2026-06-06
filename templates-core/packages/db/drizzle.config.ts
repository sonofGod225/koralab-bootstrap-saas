/**
 * Drizzle Kit configuration — génération + application des migrations
 *
 * Référence : architecture.md step 8 Migration Strategy
 *
 * Usage :
 * - `pnpm db:generate` génère les fichiers SQL dans migrations/ depuis les schemas TS
 * - `pnpm db:migrate` applique les migrations contre $DATABASE_URL
 * - `pnpm db:push` (dev only, jamais en prod) sync direct du schema sans migration
 * - `pnpm db:studio` ouvre l'UI Drizzle Studio
 *
 * DATABASE_URL lue depuis packages/db/.env (gitignored).
 */
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in packages/db/.env');
}

export default defineConfig({
  schema: './src/schemas/*.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  casing: 'snake_case',
});
