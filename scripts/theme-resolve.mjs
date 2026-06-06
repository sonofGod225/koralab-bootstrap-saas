/**
 * theme-resolve.mjs — build a resolved theme spec from CLI-style options.
 *
 * Shared by generate.mjs (theme at init) and retheme.mjs (re-theme an existing
 * project). Handles design-bundle import (--spec / --design-dir / --design-url)
 * and the theme flags, then returns a resolved spec (design.resolveSpec).
 */
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { resolveSpec } from './design.mjs';

const THEME_FLAGS = ['theme', 'primary', 'accent', 'success', 'danger', 'warning', 'font', 'radius', 'mode'];

/**
 * @param {{ val: (flag:string)=>string|undefined, selfDir: string }} io
 *   val    — reads an option value (e.g. from process.argv)
 *   selfDir — dir containing fetch-design.mjs / extract-theme.mjs
 * @returns {{ spec: object, hasDesign: boolean }}
 */
export function buildThemeSpec({ val, selfDir }) {
  let designOpts = null;

  if (val('--spec')) {
    designOpts = JSON.parse(readFileSync(val('--spec'), 'utf8'));
  } else {
    let manifestPath;
    if (val('--design-url')) {
      const tmp = mkdtempSync(join(tmpdir(), 'koralab-design-'));
      const manifest = execFileSync('node', [join(selfDir, 'fetch-design.mjs'), val('--design-url'), tmp], { encoding: 'utf8' });
      manifestPath = join(tmp, 'manifest.json');
      writeFileSync(manifestPath, manifest);
    } else if (val('--design-dir')) {
      manifestPath = join(val('--design-dir'), 'manifest.json');
      if (!existsSync(manifestPath)) {
        throw new Error(`--design-dir expects a fetch-design output containing manifest.json (${manifestPath} missing).`);
      }
    }
    if (manifestPath) {
      const out = execFileSync('node', [join(selfDir, 'extract-theme.mjs'), manifestPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
      designOpts = JSON.parse(out);
    }
  }

  // Explicit theme flags override the imported design.
  const flagOpts = {};
  for (const f of THEME_FLAGS) { const v = val(`--${f}`); if (v) flagOpts[f] = v; }

  return { spec: resolveSpec({ ...(designOpts || {}), ...flagOpts }), hasDesign: !!designOpts };
}
