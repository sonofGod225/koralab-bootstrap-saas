# Architecture conventions (non-negotiable)

These are the patterns that make the reference monorepo what it is. Preserve them when
generating or adapting a project. `@scope` below = the project's npm scope (e.g. `@acme`).

## 1. Shared config package — single source of truth
`packages/config` owns every tsconfig/eslint/prettier preset. Every other package/app
*extends* it; nothing redefines compiler/lint rules locally.
- `tsconfig`: `base` (ES2022, strict, `noUncheckedIndexedAccess`) → `react` (DOM + jsx) →
  `worker` (Cloudflare runtime).
- `eslint`: `base` → `react` → `module` (adds the boundary lock) and `worker`.

## 2. Module boundary (the "non-negotiable" piece)
`packages/config/eslint/module.js` uses `eslint-plugin-boundaries` (`boundaries/external`)
so a `packages/module-*` package may import **only** `@scope/ui`, `@scope/types`,
`@scope/config` and external libs — never another `@scope/module-*` and never an app
(`@scope/suite|admin|api`). This keeps every module autonomous and extractible.

## 3. Module pattern "Voie A" (lazy shim + code-split gate)
A product module is a self-contained package (`screens/`, `lib/`, `permissions.ts`,
barrel `index.ts`) consumed *as source*. The app mounts it through a thin
`createLazyFileRoute` shim (`apps/suite/src/routes/_app/<mod>.lazy.tsx`) so the module lands in
its own chunk. `apps/suite/module-split.config.json` + `scripts/assert-module-split.mjs` are a
`test:bundle` gate (run after `build`) asserting each module is actually split out.

Each module exports `./permissions` (pure data, `as const`). `packages/rbac` aggregates all
module permission manifests — dependency is **uni-directional**: `rbac → module-*`, never the
reverse.

## 4. Data conventions
- **Money is `bigint`** (smallest currency unit), never `number`. A CI audit forbids `number`
  for money fields.
- **Tenant scoping**: every business table carries `organization_id`; queries must filter by
  it. A CI heuristic audit flags Drizzle queries missing the scope.
- Drizzle `casing: 'snake_case'`, one schema file per domain under `packages/db/src/schemas/`,
  re-exported from `schemas/index.ts`. Client is a `createDb(url)` factory (Neon HTTP driver).

## 5. Per-module settings live in the global settings module
A module's settings screens live under the app's global settings (`/app/settings/<module>`),
not in the module's own data nav. The module sidebar carries only its data navigation.

## 6. Sessions in KV
Better-Auth stores sessions in KV (secondary storage). Any custom column on the `session`
table requires `storeSessionInDatabase: true`, otherwise UPDATE/SELECT silently no-op.

## 7. Native bindings (Vite 8 / Rolldown)
The root `package.json` declares Rolldown + OXC native bindings (darwin/linux × arm64/x64) as
explicit deps so cross-platform CI installs don't fail. Keep them.

## Adding / removing a module
**Add**: create `packages/module-<name>` (extend `@scope/config/eslint/module.js`), export
`./permissions`, register it in `packages/rbac` registry, add a `*.lazy.tsx` shim + an entry
in `apps/suite/module-split.config.json`, and (if it has data) a schema in `packages/db` + a
sub-router in `packages/rpc`.

**Remove**: delete the package, then drop its references in `packages/rbac/src/registry.ts`
(+ `src/index.ts` re-export + `package.json` deps), the app's `*.lazy.tsx` / `*.tsx` route /
`module-split.config.json` / `src/features/*`, and regenerate `routeTree.gen.ts` (via a build).
typecheck after each to find dangling references. `--slim` does exactly this for the demo
product modules, leaving one build-green `module-example` (see `overrides-slim/`).
