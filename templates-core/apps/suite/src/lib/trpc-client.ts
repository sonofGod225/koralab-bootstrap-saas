/**
 * Client tRPC type-safe — apps/suite.
 *
 * Premier câblage tRPC côté frontend (Story 7.3). Le serveur est monté sur
 * `/trpc/*` par `apps/api` ([index.ts](../../../api/src/index.ts)). La
 * session Better-Auth est résolue côté serveur via les cookies — pas besoin
 * de header `Authorization` côté client (les cookies sont envoyés
 * automatiquement par `fetch` en `credentials: 'include'` car l'API tourne
 * sur un autre port en dev).
 *
 * Usage minimal (client vanilla, sans React Query) :
 *   const state = await trpc.onboarding.get.query();
 *   await trpc.onboarding.completeCompany.mutate({ legalName: '…', … });
 *
 * Quand on aura besoin d'invalidations / loaders avec cache, on layerera
 * `@trpc/tanstack-react-query` (React Query est déjà transitivement présent
 * via `@tanstack/react-router-ssr-query`).
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { TRPCClient } from '@trpc/client';
import type { AppRouter } from '@__SCOPE__/rpc/client';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9187';

// Annotation explicite : sans elle, `tsc` lève TS2883 (type inféré qui dépend
// d'un module non portable depuis le monorepo).
export const trpc: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      // Envoie les cookies de session Better-Auth (cross-origin en dev,
      // same-origin en prod si déployé sur sous-domaines liés).
      fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
    }),
  ],
});

export type Trpc = typeof trpc;
