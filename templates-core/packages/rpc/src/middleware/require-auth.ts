/**
 * require-auth middleware (Story 3.1 — Better-Auth)
 *
 * Garde les procedures protégées : rejette en UNAUTHORIZED si `ctx.user` est
 * absent (requête anonyme), et restreint le type du contexte aux procedures
 * en aval (`user`/`sessionId` garantis non-undefined).
 *
 * La résolution de session se fait en amont, dans `apps/api` (mount tRPC) :
 * `createAuth(env).api.getSession()` lit le cookie Better-Auth, le charge
 * depuis KV (cache) puis DB (fallback), et `createContext` peuple `ctx.user`
 * + `ctx.sessionId`. `packages/rpc` reste agnostique de l'auth.
 */
import { TRPCError } from '@trpc/server';
import { initTRPC } from '@trpc/server';
import type { RpcContext } from '../context';

const t = initTRPC.context<RpcContext>().create();

export const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not implemented yet — Story 3.1 Better-Auth wiring required',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      sessionId: ctx.sessionId,
    },
  });
});
