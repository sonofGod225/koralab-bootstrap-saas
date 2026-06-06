#!/usr/bin/env node
/**
 * create-koralab-saas — CLI to scaffold a Turborepo SaaS monorepo.
 *
 * Two variants:
 *   • core (default) — bundled generic, build-green boilerplate (templates-core/).
 *   • full           — faithful clone of a PRIVATE source repo you provide; the CLI
 *                      snapshots it at runtime (tokenise + secret-scrub) then materialises.
 *                      Nothing proprietary ships in this package.
 *
 * Interactive by default; every prompt has an equivalent flag for CI / non-interactive use.
 *
 * Usage:
 *   npm create koralab-saas@latest my-app
 *   node bin/cli.mjs my-app --scope acme --variant core --yes
 *   node bin/cli.mjs my-app --variant full --source /path/to/private-repo
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { existsSync, readdirSync, mkdtempSync } from 'node:fs';
import { join, dirname, resolve, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { PRESETS, FONTS } from '../scripts/design.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(__dirname, '..');
const GENERATE = join(SKILL_ROOT, 'scripts', 'generate.mjs');
const SNAPSHOT = join(SKILL_ROOT, 'scripts', 'snapshot.mjs');

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i !== -1 && argv[i + 1] ? argv[i + 1] : d; };
const positional = argv.find((a) => !a.startsWith('-') && argv[argv.indexOf(a) - 1]?.startsWith('--') !== true);
const YES = flag('--yes') || flag('-y');

const C = { dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, c: (s) => `\x1b[36m${s}\x1b[0m` };
const isValidName = (n) => /^[a-z][a-z0-9-]*$/.test(n);

async function main() {
  console.log(`\n  ${C.b('create-koralab-saas')} ${C.dim('— scaffold a Turborepo SaaS monorepo')}\n`);

  const interactive = !YES && stdin.isTTY;
  const rl = interactive ? createInterface({ input: stdin, output: stdout }) : null;
  const ask = async (q, def) => {
    if (!rl) return def;
    const a = (await rl.question(`  ${q}${def ? C.dim(` (${def})`) : ''} `)).trim();
    return a || def;
  };
  const askChoice = async (q, choices, def) => {
    if (!rl) return def;
    const a = (await rl.question(`  ${q} ${C.dim(`[${choices.join('/')}]`)} ${C.dim(`(${def})`)} `)).trim().toLowerCase();
    return choices.includes(a) ? a : def;
  };
  const askBool = async (q, def) => {
    if (!rl) return def;
    const a = (await rl.question(`  ${q} ${C.dim(def ? '[Y/n]' : '[y/N]')} `)).trim().toLowerCase();
    if (!a) return def;
    return a.startsWith('y');
  };

  try {
    // name
    let name = positional || val('--name');
    if (!name && rl) name = await ask('Project name (lowercase, npm-safe):', 'my-app');
    if (!name) fail('Project name is required (positional arg or --name).');
    if (!isValidName(name)) fail(`Invalid name "${name}" — use lowercase letters, digits, '-', starting with a letter.`);

    // scope / display / domain
    const scope = val('--scope') || (await ask('npm scope (without @):', name)) || name;
    const display = val('--display') || (await ask('Display name:', cap(name)));
    const domain = val('--domain') || (await ask('Root domain:', `${name}.com`));

    // variant
    const variant = (val('--variant') || (await askChoice('Variant: core = generic build-green boilerplate; full = clone a private repo', ['core', 'full'], 'core'))).toLowerCase();
    if (!['core', 'full'].includes(variant)) fail(`--variant must be 'core' or 'full'.`);

    // full → source repo
    let source = val('--source');
    if (variant === 'full' && !source) source = await ask('Path to the PRIVATE source monorepo to clone:', '');
    if (variant === 'full' && (!source || !existsSync(join(resolveAbs(source), 'package.json')))) {
      fail(`--variant full needs --source pointing to a monorepo root (package.json not found).`);
    }

    // apps
    const noAdmin = flag('--no-admin') || !(await askBool('Include the admin app?', true));
    const noLanding = flag('--no-landing') || !(await askBool('Include the landing app?', true));

    // theme (core variant only)
    const theme = {};
    if (variant === 'core') {
      const presetKeys = Object.keys(PRESETS);
      if (val('--primary') || val('--accent')) {
        theme.primary = val('--primary');
        theme.accent = val('--accent');
      } else if (val('--theme')) {
        theme.theme = val('--theme');
      } else {
        const how = await askChoice('Design system: a preset, or custom colors?', ['preset', 'custom'], 'preset');
        if (how === 'custom') {
          theme.primary = await ask('Primary / neutral color (hex):', '#3f3f46');
          theme.accent = await ask('Accent color (hex):', '#6366f1');
        } else {
          theme.theme = await askChoice(`Preset (${presetKeys.join(' / ')})`, presetKeys, 'terre-soleil');
        }
      }
      theme.success = val('--success');
      theme.danger = val('--danger');
      theme.warning = val('--warning');
      // Defaults come from the chosen preset; only override on explicit flag or
      // interactive choice (so non-interactive keeps the preset's font/radius).
      const presetSpec = theme.theme ? PRESETS[theme.theme] : null;
      theme.font = val('--font') || (rl ? await askChoice('Font', Object.keys(FONTS), presetSpec?.font || 'fraunces') : undefined);
      theme.radius = val('--radius') || (rl ? await askChoice('Radius', ['sharp', 'default', 'rounded'], presetSpec?.radius || 'default') : undefined);
      theme.mode = val('--mode') || (rl ? await askChoice('Default color mode', ['system', 'light', 'dark'], 'system') : undefined);
    }

    // out
    const out = resolveAbs(val('--out') || name);
    if (existsSync(out) && readdirSync(out).length > 0) fail(`Target ${out} exists and is not empty.`);

    rl?.close();

    // ---- run ----
    const genArgs = ['--name', name, '--scope', scope, '--display', display, '--domain', domain, '--out', out, '--variant', variant];
    if (noAdmin) genArgs.push('--no-admin');
    if (noLanding) genArgs.push('--no-landing');
    for (const [k, v] of Object.entries(theme)) if (v) genArgs.push(`--${k}`, v);

    if (variant === 'full') {
      const tmp = mkdtempSync(join(tmpdir(), 'koralab-tpl-'));
      console.log(`\n  ${C.c('▸')} Snapshotting source repo → templates (tokenise + scrub)…`);
      run('node', [SNAPSHOT, '--source', resolveAbs(source), '--out', tmp]);
      genArgs.push('--templates', tmp);
    }

    console.log(`  ${C.c('▸')} Generating project…\n`);
    run('node', [GENERATE, ...genArgs]);

    console.log(`\n  ${C.g('✓')} Done. Next:\n`);
    console.log(`    cd ${require_relative(out)}`);
    console.log(`    pnpm install`);
    console.log(`    pnpm typecheck && pnpm build`);
    console.log(`    cp .env.example .env   ${C.dim('# then fill secrets')}\n`);
  } finally {
    rl?.close();
  }
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ''); }
function resolveAbs(p) { return isAbsolute(p) ? p : resolve(process.cwd(), p); }
function require_relative(p) { const r = p.replace(process.cwd() + '/', ''); return r || p; }
function run(cmd, args) { execFileSync(cmd, args, { stdio: 'inherit' }); }
function fail(msg) { console.error(`\n  ${C.r('✖')} ${msg}\n`); process.exit(1); }

main().catch((e) => fail(e?.message || String(e)));
