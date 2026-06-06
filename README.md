# create-koralab-saas

Scaffold a new Turborepo SaaS monorepo (pnpm + Turbo + shared config + ESLint module
boundaries + TanStack Start SSR + Hono API + tRPC + Drizzle + Better-Auth on Cloudflare
Workers). Ships as a CLI **and** as a Claude Code skill — both share the same engine.

## CLI (recommended)
```bash
npm create koralab-saas@latest my-app          # interactive
# or non-interactive:
node bin/cli.mjs my-app --scope acme --variant core --yes
```

Two **variants**:
- **`core`** (default) — a generic, **build-green** boilerplate bundled in this package:
  full infra wired (config, db, ui, rpc, auth, rbac, events, notifications) + one
  `module-example` product vertical (UI screen + lazy shim + permissions + tRPC router +
  db schema + REST route). No business logic. This is what `npm create` ships.
- **`full`** — a faithful clone of a **private** source monorepo you point at with
  `--source`. The CLI snapshots it at runtime (tokenise + secret-scrub) and materialises a
  renamed copy. Nothing proprietary is bundled in this package.

Verify any generated project: `pnpm install && pnpm typecheck && pnpm build`
(`pnpm --filter @<scope>/suite test:bundle` checks each module is code-split).

## Define the design system at init (core variant)
The CLI lets you choose the design system; the default reproduces the original look exactly.
Palettes are generic: `base` (neutral/primary), `brand` (accent), `success`, `danger`, `warning`.
```bash
# a curated preset:
node bin/cli.mjs my-app --variant core --theme zinc-violet --yes
# custom seed colors → full OKLCH scales (25→950) generated for you:
node bin/cli.mjs my-app --variant core --primary '#334155' --accent '#3b82f6' \
  --radius rounded --font inter --mode dark --yes
```
Flags (all optional): `--theme <preset>` · `--primary/--accent/--success/--danger/--warning <hex>`
· `--font fraunces|inter|geist|system` · `--radius sharp|default|rounded` · `--mode system|light|dark`.
Applied by `scripts/design.mjs` (zero-dep OKLCH→sRGB) + `scripts/apply-theme.mjs`: rewrites
`packages/ui/src/styles/tokens.css` (palettes + semantic `--bs-*` light/dark + radius + fonts),
swaps the Google-Fonts `<link>`, sets the default color mode, and recolors the logo/favicon/manifest
(a generic initial mark). Presets: `terre-soleil` (default), `slate-blue`, `zinc-violet`, `stone-emerald`.

## Layout
```
bin/cli.mjs                  # the CLI (interactive + flags), orchestrates the scripts
SKILL.md                     # trigger + orchestration (read by Claude)
scripts/snapshot.mjs         # maintenance: tokenise a source repo → templates
scripts/generate.mjs         # runtime: materialise a project (--variant core|full + theme flags)
scripts/design.mjs           # theme generator: OKLCH scales + presets + tokens.css renderer
scripts/apply-theme.mjs      # applies a theme to a generated core project (tokens/logo/fonts/mode)
templates-core/              # COMMITTED generic build-green boilerplate (bundled in npm)
templates/                   # gitignored: tokenised faithful copy of a private source repo
overrides-slim/              # full-variant --slim overrides (single module-example)
reference/architecture.md    # conventions to preserve
reference/stack-variants.md  # recipes for non-default stack choices
```

## First-time setup (after cloning this repo)
`templates/` is **not committed** (it is a tokenised snapshot of a possibly proprietary
source repo). Generate it once from your own reference monorepo:
```bash
cp snapshot.local.example.json snapshot.local.json   # then edit: slug/scope/display + secret scrubs
node scripts/snapshot.mjs --source /path/to/your/reference-repo
grep -rIE "<your-slug>|<your-secrets>" templates/      # must be empty before sharing
```
`snapshot.local.json` (your real identifiers + secrets to scrub) is gitignored.

## Quick use
```bash
# Default (faithful, buildable) clone:
node scripts/generate.mjs --name acme --out /path/to/acme
cd /path/to/acme && pnpm install && pnpm typecheck && pnpm build

# Slimmed to a single example module (build-green: infra wired + one module-example):
node scripts/generate.mjs --name acme --out /path/to/acme --slim
```

## Refreshing templates
```bash
node scripts/snapshot.mjs --source /path/to/reference-repo
# then verify no secret leaked:
grep -rIE "<old-name>|<kv-ids>|<email>" templates/   # must be empty
```

## How it works
`snapshot.mjs` copies the source repo into `templates/`, skipping generated/heavy/secret
files, and replaces project identifiers with tokens (`@__SCOPE__/`, `__PROJECT_NAME__`,
`__PROJECT_SLUG__`). `generate.mjs` reverses the substitution into a chosen name/scope/domain.
Because templates are real interconnected code, the default output builds as-is. Non-default
stack axes (Next.js, Node host, node-postgres) are applied as guided recipes after generation.
