/**
 * @__SCOPE__/rpc/client — type-only exports pour apps/suite & apps/admin
 *
 * Permet aux apps frontend d'inférer les types des inputs/outputs de chaque procedure
 * sans importer le code serveur (qui dépend de @__SCOPE__/db, etc.).
 *
 * Usage côté apps/suite :
 *   import type { AppRouter } from '@__SCOPE__/rpc/client';
 *   import { createTRPCClient, httpBatchLink } from '@trpc/client';
 *   const client = createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: '/trpc' })] });
 *   const pong = await client.health.ping.query();
 */
export type { AppRouter } from './router';
