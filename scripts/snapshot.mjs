#!/usr/bin/env node
/**
 * snapshot.mjs — MAINTENANCE script for the `koralab-bootstrap-saas` skill.
 *
 * Reads a SOURCE monorepo and writes a tokenised, secret-purged copy into the
 * skill's `templates/` directory. Re-run it whenever the reference architecture
 * evolves to refresh the templates.
 *
 * This script is GENERIC: it derives the source project identifiers (slug / scope /
 * display name) from the source repo (or `snapshot.local.json` / CLI flags), so no
 * project-specific value is hard-coded here. Project-specific secrets to scrub
 * (KV ids, emails, org names…) live in `snapshot.local.json` (gitignored) — see
 * `snapshot.local.example.json`.
 *
 * Pipeline:
 *   1. Walk the source tree, skipping generated/heavy/secret files (SKIP_*).
 *   2. For text files, replace the source identifiers with tokens + apply scrubs.
 *   3. Copy binaries verbatim. Rename path segments containing the slug.
 *
 * Tokens written into templates/ (re-substituted by generate.mjs):
 *   @__SCOPE__/        ← @<sourceScope>/   (npm scope)
 *   __PROJECT_NAME__   ← <sourceDisplay>   (display name, prose)
 *   __PROJECT_SLUG__   ← <sourceSlug>      (slug, domains, worker names)
 *
 * Usage:
 *   node snapshot.mjs --source /path/to/repo
 *   node snapshot.mjs --source /path/to/repo --source-slug acme --source-scope acme --source-display Acme
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs';
import { join, relative, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(__dirname, '..');

// ---- args + local config --------------------------------------------------
const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const SOURCE = getArg('--source', process.env.SNAPSHOT_SOURCE || process.cwd());
const OUT = getArg('--out', join(SKILL_ROOT, 'templates'));
const VERBOSE = args.includes('--verbose');

if (!existsSync(join(SOURCE, 'package.json'))) {
  console.error(`✖ Source has no package.json: ${SOURCE}`);
  process.exit(1);
}

const localCfgPath = join(SKILL_ROOT, 'snapshot.local.json');
const localCfg = existsSync(localCfgPath) ? JSON.parse(readFileSync(localCfgPath, 'utf8')) : {};

// ---- derive source identity (CLI > local config > auto-detect) ------------
const srcPkg = JSON.parse(readFileSync(join(SOURCE, 'package.json'), 'utf8'));
function detectScope() {
  for (const dir of ['packages/config', 'packages']) {
    const p = join(SOURCE, dir, 'package.json');
    if (existsSync(p)) {
      const n = JSON.parse(readFileSync(p, 'utf8')).name || '';
      const m = n.match(/^@([^/]+)\//);
      if (m) return m[1];
    }
  }
  // scan packages/* for the first scoped name
  const pkgsDir = join(SOURCE, 'packages');
  if (existsSync(pkgsDir)) {
    for (const e of readdirSync(pkgsDir)) {
      const p = join(pkgsDir, e, 'package.json');
      if (existsSync(p)) {
        const m = (JSON.parse(readFileSync(p, 'utf8')).name || '').match(/^@([^/]+)\//);
        if (m) return m[1];
      }
    }
  }
  return null;
}
const SOURCE_SLUG = getArg('--source-slug', localCfg.sourceSlug || srcPkg.name);
const SOURCE_SCOPE = getArg('--source-scope', localCfg.sourceScope || detectScope() || SOURCE_SLUG);
const SOURCE_DISPLAY = getArg('--source-display',
  localCfg.sourceDisplay || (SOURCE_SLUG.charAt(0).toUpperCase() + SOURCE_SLUG.slice(1)));

if (!SOURCE_SLUG) { console.error('✖ Could not determine source slug. Pass --source-slug.'); process.exit(1); }

// Extra project-specific scrubs from local config: [regexSource, replacement, flags?]
const SCRUB = (localCfg.scrub || []).map(([re, val, flags]) => [new RegExp(re, flags || 'g'), val]);

// ---- skip rules -----------------------------------------------------------
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.turbo', '.tanstack', '.output', '.vinxi', '.nitro',
  '.wrangler', 'dist', 'build', 'coverage', '.vitest', 'test-results',
  'playwright-report', '.cache', 'storybook-static',
  '_archive', '_bmad', '_bmad-output', '.claude',
]);
const SKIP_PATHS = new Set(['package-lock.json', 'yarn.lock']);
const SKIP_MATCHERS = [
  (p) => /(^|\/)\.env(\.|$)/.test(p) && !p.endsWith('.example'),
  (p) => /(^|\/)\.dev\.vars$/.test(p),
  (p) => /\.tsbuildinfo$/.test(p),
  // routeTree.gen.ts is KEPT so the generated project typechecks immediately.
  (p) => /(^|\/)migrations\/.*\.sql$/.test(p),
  (p) => /(^|\/)docs\/(ui-designs|adrs|design-system)\//.test(p),
  (p) => /\.DS_Store$/.test(p),
];

// ---- text detection -------------------------------------------------------
const TEXT_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.jsonc', '.md', '.mdx',
  '.css', '.scss', '.html', '.yml', '.yaml', '.toml', '.sh', '.txt', '.example',
  '.svg', '.webmanifest', '.xml',
  '.gitignore', '.npmrc', '.nvmrc', '.prettierignore', '.editorconfig', '.env',
]);
const TEXT_BASENAMES = new Set([
  '.gitignore', '.npmrc', '.nvmrc', '.prettierignore', '.editorconfig',
  '.dev.vars.example', 'Dockerfile', 'LICENSE', 'README',
]);
function isTextFile(path) {
  const ext = extname(path);
  if (TEXT_EXT.has(ext)) return true;
  if (TEXT_BASENAMES.has(basename(path))) return true;
  if (basename(path).startsWith('.') && ext === '') return true;
  return false;
}

// ---- tokenisation ---------------------------------------------------------
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SCOPE_RE = new RegExp('@' + escapeRe(SOURCE_SCOPE) + '\\/', 'g');
const DISPLAY_RE = SOURCE_DISPLAY ? new RegExp(escapeRe(SOURCE_DISPLAY), 'g') : null;
const SLUG_RE = new RegExp(escapeRe(SOURCE_SLUG), 'g');

function tokenise(content) {
  let out = content;
  out = out.replace(SCOPE_RE, '@__SCOPE__/');
  if (DISPLAY_RE) out = out.replace(DISPLAY_RE, '__PROJECT_NAME__');
  out = out.replace(SLUG_RE, '__PROJECT_SLUG__');
  for (const [re, val] of SCRUB) out = out.replace(re, val);
  return out;
}
function tokenisePath(relPath) {
  return relPath.replace(SLUG_RE, '__PROJECT_SLUG__');
}

// ---- walk + copy ----------------------------------------------------------
let copied = 0, skipped = 0, scrubbed = 0;
function walk(absDir) {
  for (const entry of readdirSync(absDir)) {
    const abs = join(absDir, entry);
    const rel = relative(SOURCE, abs).split('\\').join('/');
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) { skipped++; continue; }
      walk(abs);
      continue;
    }
    if (SKIP_PATHS.has(rel) || SKIP_MATCHERS.some((m) => m(rel))) { skipped++; continue; }
    const outAbs = join(OUT, tokenisePath(rel));
    mkdirSync(dirname(outAbs), { recursive: true });
    if (isTextFile(abs)) {
      const raw = readFileSync(abs, 'utf8');
      const next = tokenise(raw);
      if (next !== raw) scrubbed++;
      writeFileSync(outAbs, next);
    } else {
      writeFileSync(outAbs, readFileSync(abs));
    }
    copied++;
    if (VERBOSE) console.log(`  + ${tokenisePath(rel)}`);
  }
}

// ---- run ------------------------------------------------------------------
console.log(`▶ snapshot`);
console.log(`  source:  ${SOURCE}`);
console.log(`  out:     ${OUT}`);
console.log(`  identity: slug="${SOURCE_SLUG}" scope="@${SOURCE_SCOPE}" display="${SOURCE_DISPLAY}"`);
console.log(`  scrubs:   ${SCRUB.length}${existsSync(localCfgPath) ? '' : ' (no snapshot.local.json — secrets NOT scrubbed!)'}`);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
walk(SOURCE);

writeFileSync(join(OUT, '.template-manifest.json'), JSON.stringify({
  generatedFrom: 'snapshot.mjs',
  sourceIdentity: { slug: SOURCE_SLUG, scope: SOURCE_SCOPE, display: SOURCE_DISPLAY },
  tokens: { '@__SCOPE__/': 'npm scope', __PROJECT_NAME__: 'display name', __PROJECT_SLUG__: 'slug / domain base' },
}, null, 2));

console.log(`✔ done — ${copied} files copied, ${scrubbed} tokenised/scrubbed, ${skipped} skipped`);
if (SCRUB.length === 0) {
  console.log(`\n⚠  No scrub rules loaded. Create snapshot.local.json (see snapshot.local.example.json)`);
  console.log(`   then re-run, and verify: grep -rIE "<your-secrets>" ${relative(process.cwd(), OUT) || OUT}`);
}
