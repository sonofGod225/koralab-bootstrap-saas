/**
 * health router — preuve de vie du wiring tRPC (Story 1.12)
 *
 * `ping`   — procedure publique sans middleware, retourne `{ pong: true, timestamp }`
 * `dbPing` — procedure publique qui hit la DB via ctx.db, retourne `{ ok, oneEqualsOne }`
 *            (valide que le client Drizzle est correctement injecté dans le context)
 */
import { sql } from '@__SCOPE__/db';
import { publicProcedure, router } from '../trpc';

export const healthRouter = router({
  ping: publicProcedure.query(() => ({
    pong: true,
    timestamp: new Date().toISOString(),
  })),

  dbPing: publicProcedure.query(async ({ ctx }) => {
    const result = (await ctx.db.execute(sql`SELECT 1 AS one`)) as unknown;
    const rows: ReadonlyArray<{ one?: number }> = Array.isArray(result)
      ? (result as ReadonlyArray<{ one?: number }>)
      : ((result as { rows?: ReadonlyArray<{ one?: number }> }).rows ?? []);
    return {
      ok: true,
      oneEqualsOne: rows[0]?.one ?? null,
    };
  }),
});
