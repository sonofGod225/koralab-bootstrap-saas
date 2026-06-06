/**
 * @__SCOPE__/auth — configuration Better-Auth de __PROJECT_NAME__ (ADR 0003).
 *
 * `createAuth(env, log?)` est une factory par requête (la connexion DB et le
 * namespace KV viennent de l'env Worker). `apps/api` la monte sur Hono
 * (`/api/auth/*`) et l'utilise pour résoudre la session côté tRPC.
 */
export { createAuth, type AuthEnv, type BudiAuth, type Auth } from './auth';
