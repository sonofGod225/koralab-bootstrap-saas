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

**Design system (core variant):** the user can define the theme at init via
`--theme <preset>` or custom `--primary/--accent <hex>` (+ `--success/--danger/--warning`),
`--font fraunces|inter|geist|system`, `--radius sharp|default|rounded`, `--mode system|light|dark`.
`scripts/design.mjs` (zero-dep OKLCH→sRGB) generates the palette scales and `scripts/apply-theme.mjs`
rewrites `packages/ui/src/styles/tokens.css` (generic palettes `base/brand/success/danger/warning`
+ semantic `--bs-*` + radius + fonts) and recolors logo/favicon/manifest. No theme flags ⇒ the
default reproduces the original "Terre & Soleil" look. Theming applies to `core` only.

**Import a design system from a Claude Design bundle (core variant):** when the user pastes a
Claude Design instruction (an `https://api.anthropic.com/v1/design/h/<hash>` URL — the endpoint
returns a `tar.gz` of the whole design project), the boilerplate can adopt that design system.
- **CLI / deterministic**: `generate.mjs --variant core --design-url <url>` runs
  `scripts/fetch-design.mjs` (download + untar + manifest) → `scripts/extract-theme.mjs` (heuristic
  token mapping) → a theme spec → `apply-theme`. Imports: exact semantic colors into `--bs-*`,
  generated utility scales (seeds), extended editorial colors + gradients, self-hosted fonts (the
  bundle's `.ttf`), and the brand logos/favicon. Also `--design-dir <fetched-dir>` and `--spec <file>`.
- **Agent path (best fidelity)**: run `node scripts/fetch-design.mjs <url> /tmp/kb` then **read**
  `/tmp/kb/extracted/**/styles/tokens.css` + `uploads/*brand*.md`, and write a refined theme-spec
  JSON (map the design's roles: signature accent → `accent`, neutral/text → `primary`, semantic
  greens/reds/ambers → `success/danger/warning`, surfaces/text → `semantic.light/dark`, editorial
  colors + gradients → `extended`, fonts → `fontSpec.selfHosted`, logos → `assets`). Then
  `generate.mjs --variant core --spec /tmp/kb/spec.json …`. The agent mapping beats the heuristic
  when token names are unusual. Spec schema: see `scripts/design.mjs` `resolveSpec`.

**Re-theme an existing project (after generation):** theming also works on an already-generated
`core` project — no re-scaffold needed. `scripts/retheme.mjs <projectDir> [theme flags]` re-derives
the project identity (scope/name/display) from the repo, rebuilds the spec (same theme flags +
design import via `--theme/--primary/--design-url/--design-dir/--spec`), and re-applies it (rewrites
`tokens.css`, copies fonts/logos, recolors manifest). CLI: `create-koralab-saas theme --out <dir> …`;
generated projects also ship a `pnpm theme` script. It refuses to overwrite a non-generated
`tokens.css` (full variant / hand-edited) without `--yes`. Agent path: write a refined spec JSON and
`node scripts/retheme.mjs <dir> --spec <file>`.

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
