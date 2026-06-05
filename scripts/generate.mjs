#!/usr/bin/env node
/**
 * generate.mjs — RUNTIME generator for the `koralab-bootstrap-saas` skill.
 *
 * Materialises a new monorepo from `templates/` by re-substituting the tokens
 * left by snapshot.mjs. The DEFAULT output is a faithful, buildable clone of the
 * reference architecture (it is real, interconnected code with the names swapped).
 *
 * Usage:
 *   node generate.mjs --name acme [--scope acme] --out /abs/path/acme [options]
 *
 * Required:
 *   --name <slug>     project slug (lowercase, npm-safe). Drives root name, scope,
 *                     worker names, domains. e.g. "acme"
 *   --out  <dir>      target directory (created; must be empty or non-existent)
 *
 * Optional:
 *   --scope <name>    npm scope without @ (default: --name)
 *   --display <Name>  display/prose name (default: capitalised --name)
 *   --domain <fqdn>   root domain (default: <name>.com)
 *   --no-admin        omit apps/admin
 *   --no-landing      omit apps/landing
 *   --slim            EXPERIMENTAL: prune the business modules (module-invoicing,
 *                     module-crm) and emit a follow-up report. The slim tree needs
 *                     manual fixups to typecheck — see the printed TODO list.
 *   --no-git          skip `git init`
 *   --dry-run         print what would happen, write nothing
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, relative, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, '..', 'templates');

// ---- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i !== -1 && args[i + 1] ? args[i + 1] : d; };

const NAME = val('--name');
const OUT = val('--out');
if (!NAME || !OUT) {
  console.error('✖ --name and --out are required.\n  node generate.mjs --name acme --out /abs/path/acme');
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(NAME)) {
  console.error(`✖ --name "${NAME}" must be lowercase, npm-safe (a-z, 0-9, -), start with a letter.`);
  process.exit(1);
}
const SCOPE = val('--scope', NAME);
const DISPLAY = val('--display', NAME.charAt(0).toUpperCase() + NAME.slice(1).replace(/-/g, ''));
const DOMAIN = val('--domain', `${NAME}.com`);
const SLIM = flag('--slim');
const NO_ADMIN = flag('--no-admin');
const NO_LANDING = flag('--no-landing');
const NO_GIT = flag('--no-git');
const DRY = flag('--dry-run');

if (!existsSync(TEMPLATES)) {
  console.error(`✖ templates/ not found at ${TEMPLATES}. Run snapshot.mjs first.`);
  process.exit(1);
}
if (existsSync(OUT) && readdirSync(OUT).length > 0) {
  console.error(`✖ --out ${OUT} exists and is not empty.`);
  process.exit(1);
}

// ---- detokenisation -------------------------------------------------------
// __PROJECT_SLUG__.com → DOMAIN handled before generic slug substitution.
function detokenise(content) {
  let out = content;
  out = out.replace(/__PROJECT_SLUG__\.com/g, DOMAIN);  // domains first
  out = out.replace(/@__SCOPE__\//g, `@${SCOPE}/`);
  out = out.replace(/__PROJECT_NAME__/g, DISPLAY);
  out = out.replace(/__PROJECT_SLUG__/g, NAME);
  return out;
}
function detokenisePath(p) {
  return p.replace(/__PROJECT_SLUG__/g, NAME);
}

// ---- prune rules ----------------------------------------------------------
const BUSINESS_DIRS = ['packages/module-invoicing', 'packages/module-crm'];
function isPruned(relPosix) {
  if (relPosix === '.template-manifest.json') return true;
  if (NO_ADMIN && (relPosix === 'apps/admin' || relPosix.startsWith('apps/admin/'))) return true;
  if (NO_LANDING && (relPosix === 'apps/landing' || relPosix.startsWith('apps/landing/'))) return true;
  if (SLIM && BUSINESS_DIRS.some((d) => relPosix === d || relPosix.startsWith(d + '/'))) return true;
  return false;
}

// ---- text detection (mirror of snapshot) ----------------------------------
const TEXT_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.jsonc',
  '.md', '.mdx', '.css', '.scss', '.html', '.yml', '.yaml', '.toml', '.sh', '.txt',
  '.example', '.svg', '.webmanifest', '.xml', '.gitignore', '.npmrc', '.nvmrc',
  '.prettierignore', '.editorconfig', '.env']);
const TEXT_BASENAMES = new Set(['.gitignore', '.npmrc', '.nvmrc', '.prettierignore',
  '.editorconfig', '.dev.vars.example', 'Dockerfile', 'LICENSE', 'README']);
function isText(p) {
  const e = extname(p);
  if (TEXT_EXT.has(e)) return true;
  if (TEXT_BASENAMES.has(basename(p))) return true;
  if (basename(p).startsWith('.') && e === '') return true;
  return false;
}

// ---- walk + write ---------------------------------------------------------
let written = 0, pruned = 0;
function walk(absDir) {
  for (const entry of readdirSync(absDir)) {
    const abs = join(absDir, entry);
    const rel = relative(TEMPLATES, abs).split('\\').join('/');
    if (isPruned(rel)) { pruned++; continue; }
    const st = statSync(abs);
    if (st.isDirectory()) { walk(abs); continue; }

    const outAbs = join(OUT, detokenisePath(rel));
    if (DRY) { console.log(`  → ${detokenisePath(rel)}`); written++; continue; }
    mkdirSync(dirname(outAbs), { recursive: true });
    if (isText(abs)) writeFileSync(outAbs, detokenise(readFileSync(abs, 'utf8')));
    else writeFileSync(outAbs, readFileSync(abs));
    written++;
  }
}

// ---- run ------------------------------------------------------------------
console.log(`▶ generate "${NAME}" (scope @${SCOPE}, "${DISPLAY}", ${DOMAIN})`);
console.log(`  out: ${OUT}${SLIM ? '  [slim]' : ''}${DRY ? '  [dry-run]' : ''}`);
if (!DRY) mkdirSync(OUT, { recursive: true });
walk(TEMPLATES);

if (!DRY && !NO_GIT) {
  try {
    execSync('git init -q && git add -A', { cwd: OUT, stdio: 'ignore' });
  } catch { /* git optional */ }
}

console.log(`✔ ${written} files written${pruned ? `, ${pruned} pruned` : ''}.`);

// ---- next steps -----------------------------------------------------------
console.log(`\nNext:`);
console.log(`  cd ${OUT}`);
console.log(`  pnpm install`);
console.log(`  pnpm typecheck && pnpm build`);
console.log(`  cp .env.example .env   # then fill secrets`);

if (SLIM) {
  console.log(`\n⚠  --slim removed the business modules. Manual follow-up required to typecheck:`);
  console.log(`   • packages/rbac/src/registry.ts — drop imports of @${SCOPE}/module-invoicing|crm permissions`);
  console.log(`   • packages/rbac/package.json    — drop those workspace deps`);
  console.log(`   • packages/rpc/src/router.ts     — drop invoicing/contacts/catalogue/billing sub-routers`);
  console.log(`   • packages/db/src/schemas/index.ts — drop business schema re-exports`);
  console.log(`   • apps/suite: src/routes/_app/*.lazy.tsx, module-split.config.json, src/features/* — keep only one example module`);
  console.log(`   • apps/api/src/{crons,queues}/* — drop billing/import handlers + their wrangler.toml bindings`);
  console.log(`   See reference/architecture.md → "Adding / removing a module".`);
}
