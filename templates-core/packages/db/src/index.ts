/**
 * @__SCOPE__/db — Drizzle ORM + Neon driver
 *
 * Exports :
 * - `createDb(url)` factory pour instancier un client (Workers + Node.js)
 * - `schema` agrégat de tous les schemas modules
 * - Re-export des types/tables de chaque schéma
 */
export { createDb, type Database } from './client';
export { redact } from './redact';
export * as schema from './schemas';
export * from './schemas/identity';
export * from './schemas/audit';
export * from './schemas/rbac';
export * from './schemas/onboarding';
export * from './schemas/establishments';
export * from './schemas/example';
export * from './schemas/status';

// Re-export utilitaires Drizzle couramment utilisés par les consumers (apps/api, packages/rpc futur)
export {
  sql,
  eq,
  ne,
  and,
  or,
  not,
  desc,
  asc,
  gt,
  gte,
  lt,
  lte,
  like,
  ilike,
  isNull,
  isNotNull,
  inArray,
  count,
} from 'drizzle-orm';
