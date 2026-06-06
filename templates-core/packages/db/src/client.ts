/**
 * Drizzle client factory — Neon HTTP driver (compatible Cloudflare Workers + Node.js)
 *
 * Référence : architecture.md step 4 (Compute & Hosting) — 2 Workers indépendants.
 *
 * Note : on utilise `neon()` (HTTP fetch single-shot), pas `Pool` (WebSocket).
 * - HTTP : zéro overhead connexion, supporté natif Workers, MAIS pas de transactions multi-statements
 * - Pour les transactions futures (Story 1.x facturation atomique), basculer sur driver `neon-serverless` Pool
 */
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schemas';

export type Database = NeonHttpDatabase<typeof schema>;

/**
 * Crée un client Drizzle pour Neon.
 *
 * @param databaseUrl Connection string Neon (récupérée depuis env binding `DATABASE_URL`)
 */
export const createDb = (databaseUrl: string): Database => {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema, casing: 'snake_case' });
};
