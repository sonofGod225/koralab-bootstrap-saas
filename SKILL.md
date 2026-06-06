---
name: koralab-bootstrap-saas
description: >-
  Bootstrap a new Turborepo SaaS monorepo that faithfully reproduces the BudiSuite
  architecture (pnpm + Turbo + shared config package + ESLint module boundaries +
  TanStack Start SSR + Hono API + tRPC + Drizzle + Better-Auth, deployed on Cloudflare
  Workers). Use when the user wants to scaffold/create a new project "like budisuite",
  start a new monorepo with the same structure, or bootstrap a SaaS skeleton. Triggers:
  "bootstrap a monorepo", "scaffold a new project like budisuite", "crée un monorepo
  comme budisuite", "nouveau projet SaaS turbo".
---

# koralab-bootstrap-saas

Generates a new monorepo from tokenised templates derived from the BudiSuite reference
repo. Hybrid mechanism: a deterministic generator script does the bulk copy + name
substitution; you (the agent) collect the choices and handle non-default stack variants.

## What the templates contain

A faithful, secret-purged, tokenised copy of the reference architecture:

- **Root tooling**: pnpm workspace, `turbo.json`, shared `tsconfig`, ESLint flat config,
  Prettier, Husky + lint-staged + commitlint, semantic-release, `.github/workflows/*`,
  `.npmrc`/`.nvmrc`/`.gitignore`, `.env.example`.
- **`packages/config`** (the crown jewel): shared `tsconfig` presets (base/react/worker),
  ESLint presets (base/react/**module**/worker). `eslint/module.js` is what mechanically
  locks the module boundary — a `module-*` package may only import `@scope/ui`,
  `@scope/types`, `@scope/config` and external libs.
- **`packages/*`**: `types` (branded ids, Money as bigint), `db` (Drizzle + Neon,
  snake_case, `organization_id` tenant scoping), `ui` (tsup + shadcn + design tokens),
  `rpc` (tRPC skeleton + middleware), `auth` (Better-Auth + KV sessions), `rbac`,
  `events`, `payments`, `notifications`, plus the product modules.
- **`apps/*`**: `suite`/`admin` (TanStack Start SSR on Cloudflare), `api` (Hono +
  fetch/queue/scheduled handlers), `landing` (Worker placeholder).

Tokens in templates: `@__SCOPE__/`, `__PROJECT_NAME__`, `__PROJECT_SLUG__`. The generator
re-substitutes them. No secrets, KV ids, lockfiles, or `.env` (only `.env.example`) ship.

## Workflow

### 1. Collect the choices
Ask the user (use AskUserQuestion) for:
- **name** (slug, lowercase npm-safe) — required. **scope** (default = name). **display name**,
  **root domain** (default `<name>.com`).
- **apps**: include `admin`? `landing`? (default: yes)
- **stack axes** (default = BudiSuite stack, the faithful path):
  - front: `tanstack-start` (default) | `nextjs` | `remix`
  - deploy target: `cloudflare-workers` (default) | `node`
  - db driver: `neon-serverless` (default) | `node-postgres`
- **slim?** (default no) — replace the business product modules with a single
  `module-example` (screen + lazy shim + permissions, wired into rbac + apps/suite).
  **Build-green as-is** (verified: install + typecheck + build + test:bundle). The
  backend routers/schemas (rpc, db) keep the reference examples.

### 2. Run the generator
Pick a **variant**:
- `--variant core` — the committed generic **build-green** boilerplate (`templates-core/`,
  full infra + one `module-example`, no business). This is what the published CLI ships.
- `--variant full` (default of the script) — the faithful clone from `templates/` (the
  private snapshot of the reference repo). Add `--slim` to reduce it to one `module-example`.

```bash
node ~/.claude/skills/koralab-bootstrap-saas/scripts/generate.mjs \
  --variant core --name <slug> --scope <scope> --display <Name> --domain <domain> \
  --out <abs-target-dir> [--no-admin] [--no-landing]
```
Both outputs are buildable as-is. There is also a CLI wrapper (`bin/cli.mjs`, published as
`create-koralab-saas`) with interactive prompts; in `full` mode it snapshots a private
`--source` repo at runtime. The default output is real, interconnected code, renamed.

### 3. Non-default stack variants (hybrid step)
If the user picked a non-default value for front / deploy target / db driver, AFTER running
the generator apply the recipe in `reference/stack-variants.md`. Those recipes scaffold the
alternative with its official CLI (e.g. `create-next-app`) and then re-apply the BudiSuite
conventions (shared `packages/config`, the `boundaries` ESLint preset, `workspace:*`
protocol, the `@scope/*` naming).

### 4. Verify
```bash
cd <target> && pnpm install && pnpm typecheck && pnpm build && pnpm lint
```
`pnpm build` also runs the `test:bundle` gate that asserts each module is code-split.

## Maintenance
To refresh the templates after the reference architecture changes:
```bash
node ~/.claude/skills/koralab-bootstrap-saas/scripts/snapshot.mjs --source <repo> 
```
Then re-check no secret leaked:
`grep -rIE "budisuite|<kv-ids>|<email>" templates/` must be empty.

## Conventions to preserve (read `reference/architecture.md`)
The module boundary, the "Voie A" lazy-shim + `test:bundle` code-split gate, Money as
bigint, mandatory `organization_id` tenant scoping, and per-module settings living under the
global settings module. Do not weaken these when adapting variants.
