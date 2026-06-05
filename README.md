# koralab-bootstrap-saas

A Claude Code skill that bootstraps a new Turborepo SaaS monorepo reproducing the BudiSuite
architecture (pnpm + Turbo + shared config package + ESLint module boundaries + TanStack
Start SSR + Hono API + tRPC + Drizzle + Better-Auth on Cloudflare Workers).

## Layout
```
SKILL.md                     # trigger + orchestration (read by Claude)
scripts/snapshot.mjs         # maintenance: refresh templates/ from a source repo
scripts/generate.mjs         # runtime: materialise a new project from templates/
templates/                   # tokenised, secret-purged faithful copy of the reference repo
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

# Slimmed to a single example module (experimental — see printed TODOs):
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
