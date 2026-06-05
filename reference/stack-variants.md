# Stack variants (hybrid adaptation recipes)

The generator emits the **default** stack faithfully (TanStack Start + Hono + Cloudflare +
Neon). For a non-default axis, run the generator first, then apply the matching recipe below.
The golden rule for every variant: **keep `packages/config`, the `boundaries` ESLint preset,
`workspace:*`, and the `@scope/*` naming** — only the chosen layer changes.

## Front: `nextjs` (instead of TanStack Start)
1. Replace `apps/suite` (and `apps/admin` if kept): `pnpm dlx create-next-app@latest apps/suite
   --ts --app --no-src-dir --import-alias "#/*"` then delete the TanStack-specific files
   (`router.tsx`, `routeTree.gen.ts`, `module-split.config.json`, `*.lazy.tsx`).
2. Re-wire: set `"name": "@<scope>/suite"`, extend `@<scope>/config/tsconfig/react.json`,
   add `@<scope>/ui`, `@<scope>/rpc` (client), module packages as deps.
3. Module code-split becomes `next/dynamic(() => import('@<scope>/module-x'))` instead of the
   lazy route shim. Update `module-split.config.json` semantics or drop the `test:bundle` gate.
4. tRPC client: use `@trpc/next` or the React Query integration in a Next route handler.

## Front: `remix` — analogous to Next: scaffold with `create-remix`, then re-apply config
extends + workspace deps + `@scope/*` naming; modules via `React.lazy`/route-level splitting.

## Deploy target: `node` (instead of Cloudflare Workers)
1. `apps/api`: replace the Hono Workers entry with `@hono/node-server` (`serve({ fetch:
   app.fetch, port })`). Drop `wrangler.toml`, `worker-configuration.d.ts`; extend
   `@<scope>/config/tsconfig/base.json` (not `worker.json`).
2. Bindings → env/services: KV → Redis/`ioredis`; R2 → S3 SDK or local disk; Queues →
   BullMQ/pg-boss; Crons → `node-cron` or a system scheduler.
3. Front apps: build static/SSR for a Node host (Vite `node` SSR adapter) instead of the
   Cloudflare vite plugin; drop `@cloudflare/vite-plugin`.
4. Remove `.github/workflows/deploy-*` wrangler steps; replace with your Node deploy.

## DB driver: `node-postgres` (instead of Neon serverless)
1. `packages/db`: swap `@neondatabase/serverless` for `pg` (or `postgres`). Change
   `src/client.ts` `createDb` to use `drizzle-orm/node-postgres` with a `Pool`.
2. `drizzle.config.ts`: keep `dialect: 'postgresql'`; the schema/migrations are unchanged.
3. Connection pooling now matters — instantiate the pool once per process (not per request as
   the serverless HTTP driver allowed).

## Including / excluding pieces (no recipe needed — generator flags)
- `--no-admin`, `--no-landing` drop those apps.
- `--slim` prunes the business modules to a single example (then follow the printed TODO to
  re-green typecheck — see `architecture.md` → "Adding / removing a module").
- To drop `payments`/`notifications`, delete the package and its `@scope/...` references in
  `packages/rpc` (deps + router) and re-typecheck.
