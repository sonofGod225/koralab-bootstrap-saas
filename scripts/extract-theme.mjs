#!/usr/bin/env node
/**
 * extract-theme.mjs — heuristic mapper: a Claude Design bundle → a theme spec.
 *
 * Reads a fetch-design manifest (JSON), parses the bundle's CSS custom properties,
 * and maps them by name/role to the boilerplate theme spec:
 *   { primary, accent, success, danger, warning,   // scale seeds
 *     semantic: { light, dark },                    // exact --bs-* overrides
 *     extended: { colors, gradients },              // editorial palette + gradients
 *     fontSpec: { display, sans, selfHosted },      // imported fonts
 *     radiusValues, assets: { logos, symbols, favicon } }
 *
 * The mapping is best-effort: it logs its decisions + uncertainties to stderr so an
 * agent can refine. Usage:
 *   node fetch-design.mjs <url> /tmp/kb > /tmp/kb/manifest.json
 *   node extract-theme.mjs /tmp/kb/manifest.json > /tmp/kb/spec.json
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const manifestPath = process.argv[2];
if (!manifestPath) { console.error('Usage: node extract-theme.mjs <manifest.json>'); process.exit(1); }
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const log = (...a) => console.error('  ·', ...a);

/* ── parse all CSS custom properties (last definition wins) ── */
const vars = new Map();
for (const css of manifest.css || manifest.allCss || []) {
  let text;
  try { text = readFileSync(css, 'utf8'); } catch { continue; }
  for (const m of text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(m[1].trim(), m[2].trim());
  }
}

const isHex = (v) => /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v);
/** Resolve a value (following var() chains) to a concrete string. */
function resolve(value, depth = 0) {
  if (!value || depth > 8) return value;
  const m = value.match(/^var\((--[\w-]+)\)$/);
  if (m && vars.has(m[1])) return resolve(vars.get(m[1]).trim(), depth + 1);
  return value;
}
/** First var whose NAME matches any regex → resolved hex (or null). */
function pickHex(...patterns) {
  for (const re of patterns) {
    for (const [name, val] of vars) {
      if (re.test(name)) {
        const r = resolve(val);
        if (isHex(r)) return { name, hex: r };
      }
    }
  }
  return null;
}
function pickValue(...patterns) {
  for (const re of patterns) {
    for (const [name, val] of vars) {
      if (re.test(name)) { const r = resolve(val); if (r) return { name, value: r }; }
    }
  }
  return null;
}

/* ── role seeds (scales) ── */
const seed = (label, fallback, ...pats) => {
  const hit = pickHex(...pats);
  log(`${label.padEnd(8)} ← ${hit ? `${hit.name} ${hit.hex}` : `(fallback ${fallback})`}`);
  return hit ? hit.hex : fallback;
};
const accent = seed('brand', '#6366f1', /(^|-)accent$/i, /tera|signature|brand|primary-accent/i);
const primary = seed('base', '#3f3f46', /bois|fg-secondary/i, /encre|fg-primary|neutral|^--text$/i);
const success = seed('success', '#16a34a', /success|bogolan|green|emerald|vert/i, /foret|forest/i);
const danger = seed('danger', '#dc2626', /danger|error|red|rouge/i, /hibiscus/i, /flamme/i);
const warning = seed('warning', '#d97706', /warning|^--color-mil$|amber|jaune|yellow/i, /\bor\b/i);

/* ── exact semantic light ── */
const sval = (...pats) => { const h = pickHex(...pats); return h ? h.hex : undefined; };
const light = clean({
  background: sval(/bg-page|color-bg$|^--bg$|background$/i),
  foreground: sval(/fg-primary|color-fg$|color-text|encre/i),
  card: sval(/bg-card$|color-surface$|color-card$/i),
  popover: sval(/popover/i),
  muted: sval(/surface-warm|bg-card-warm|color-lin/i),
  mutedForeground: sval(/fg-secondary|fg-tertiary/i),
  subtle: sval(/surface-warm|color-sable/i),
  subtleForeground: sval(/fg-secondary/i),
  primary: sval(/fg-primary|encre/i),
  primaryForeground: sval(/fg-on-dark|on-tera|color-sable/i),
  secondary: sval(/surface-warm|color-sable/i),
  border: sval(/border-default|color-border$/i),
  borderSubtle: sval(/border-subtle/i),
});
/* ── exact semantic dark (only if the design ships *-dark tokens) ── */
const dark = clean({
  background: sval(/surface-dark|bg-page-dark|bg-dark/i),
  card: sval(/bg-card-dark|card-dark/i),
  popover: sval(/popover-dark/i),
  foreground: sval(/fg-on-dark/i),
});

/* ── extended palette + gradients ── */
const SKIP = /^(--color-)?(bg|background|surface|fg|border|white|black|transparent|current|inherit)/i;
const extended = { colors: {}, gradients: {} };
for (const [name, val] of vars) {
  const r = resolve(val);
  if (/gradient/i.test(name) && /gradient|linear-|radial-/i.test(r)) {
    extended.gradients[name.replace(/^--/, '')] = r;
  } else if (/^--color-[\w-]+$/.test(name) && isHex(r) && !SKIP.test(name)) {
    extended.colors[name.replace(/^--color-/, '')] = r;
  }
}

/* ── fonts ── */
const displayFam = pickValue(/font-display/i)?.value;
const sansFam = pickValue(/font-body|font-sans/i)?.value;
const selfHosted = (manifest.fonts || [])
  .filter((f) => /\.(ttf|otf|woff2)$/i.test(f))
  .map((f) => ({
    family: /fraunces/i.test(f) ? 'Fraunces' : basename(f).replace(/[-_].*$/, ''),
    file: basename(f),
    style: /italic/i.test(f) ? 'italic' : 'normal',
    src: f,
  }));
const fontSpec = (displayFam || selfHosted.length)
  ? { display: displayFam || `'Fraunces', Georgia, serif`, sans: sansFam || `'Inter', sans-serif`, selfHosted }
  : undefined;

/* ── radius ── */
const rpx = (...pats) => { const v = pickValue(...pats)?.value; const n = v && parseInt(v, 10); return Number.isFinite(n) ? n : undefined; };
const rsm = rpx(/radius-sm/i), rmd = rpx(/radius-md/i), rlg = rpx(/radius-lg/i);
const radiusValues = (rsm || rmd || rlg)
  ? { sm: rsm ?? 6, md: rmd ?? 10, lg: rlg ?? 14, xl: Math.round((rlg ?? 14) * 1.3), '2xl': Math.round((rlg ?? 14) * 1.6), '3xl': Math.round((rlg ?? 14) * 2.2), pill: 100, input: rsm ?? rmd ?? 6, tile: rmd ?? 10, card: rlg ?? 14 }
  : undefined;

/* ── assets ── */
const assets = {
  logos: manifest.logos || [],
  symbols: manifest.symbols || [],
  favicon: (manifest.favicon || [])[0] || null,
};

const spec = clean({ primary, accent, success, danger, warning,
  semantic: clean({ light: Object.keys(light).length ? light : undefined, dark: Object.keys(dark).length ? dark : undefined }),
  extended: (Object.keys(extended.colors).length || Object.keys(extended.gradients).length) ? extended : undefined,
  fontSpec, radiusValues, assets });

log(`semantic.light keys: ${Object.keys(light).join(', ') || '(none)'}`);
log(`semantic.dark keys:  ${Object.keys(dark).join(', ') || '(none)'}`);
log(`extended colors: ${Object.keys(extended.colors).length}, gradients: ${Object.keys(extended.gradients).length}`);
log(`fonts self-hosted: ${selfHosted.length}, logos: ${assets.logos.length}, favicon: ${assets.favicon ? 'yes' : 'no'}`);

console.log(JSON.stringify(spec, null, 2));

function clean(o) { return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null)); }
