/**
 * design.mjs — theme generator for the `core` boilerplate (zero-dep).
 *
 * Given a theme spec (preset, custom seeds, or an imported design's tokens) it
 * renders the full `packages/ui/src/styles/tokens.css`: palette scales
 * (base / brand / success / danger / warning), the semantic `--bs-*` layer
 * (light + dark), optional extended colors + gradients, typography, radius,
 * shadows, and @font-face. Color scales are generated in OKLCH from a seed hue.
 */

/* ───────────────────────── OKLCH ↔ sRGB ───────────────────────── */

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

export function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
export function rgbToHex(r, g, b) {
  const to = (x) => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function hexToOklab(hex) {
  const [R, G, B] = hexToRgb(hex).map((v) => srgbToLinear(v / 255));
  const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
  const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
  const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}
export function oklabToHex({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const R = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return rgbToHex(linearToSrgb(clamp01(R)), linearToSrgb(clamp01(G)), linearToSrgb(clamp01(B)));
}
export function hexToLch(hex) {
  const { L, a, b } = hexToOklab(hex);
  return { L, C: Math.hypot(a, b), H: Math.atan2(b, a) };
}
export function lchToHex(L, C, H) {
  return oklabToHex({ L, a: C * Math.cos(H), b: C * Math.sin(H) });
}

/* ───────────────────────── scale generation ───────────────────────── */

const L_TARGET = {
  25: 0.985, 50: 0.967, 100: 0.935, 200: 0.872, 300: 0.8, 400: 0.72,
  500: 0.64, 600: 0.56, 700: 0.48, 800: 0.4, 900: 0.32, 950: 0.23,
};
const C_TAPER = {
  25: 0.3, 50: 0.45, 100: 0.65, 200: 0.85, 300: 0.95, 400: 1.0,
  500: 1.0, 600: 0.95, 700: 0.85, 800: 0.72, 900: 0.58, 950: 0.46,
};
const STEPS = {
  base: [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  brand: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  success: [50, 200, 400, 600, 800, 900],
  danger: [50, 200, 400, 600, 800, 900],
  warning: [50, 200, 400, 600],
};

export function genScale(seedHex, steps, { neutral = false } = {}) {
  const { C, H } = hexToLch(seedHex);
  const baseC = neutral ? Math.min(C, 0.028) : C;
  const out = {};
  for (const step of steps) out[step] = lchToHex(L_TARGET[step], baseC * C_TAPER[step], H);
  return out;
}

/* ───────────────────────── presets ───────────────────────── */

const TERRE_SOLEIL = {
  base: { 25: '#fcf7ee', 50: '#f8efdf', 100: '#f4e4cc', 200: '#e5d2b5', 300: '#bfa378', 400: '#a18560', 500: '#8c6f4f', 600: '#6b4423', 700: '#4a2f18', 800: '#3a2412', 900: '#2a1a0f', 950: '#1a0f08' },
  brand: { 50: '#fdf1dd', 100: '#fbe2ba', 200: '#f5c994', 300: '#efb071', 400: '#e89b5a', 500: '#d6843e', 600: '#b86a28', 700: '#95531c', 800: '#6b3a12', 900: '#3d200a' },
  success: { 50: '#e8f0dc', 200: '#a8c083', 400: '#6a9c42', 600: '#4a7c36', 800: '#2c4f1f', 900: '#1a3010' },
  danger: { 50: '#fae8e0', 200: '#e6a084', 400: '#d85f36', 600: '#b8421a', 800: '#7a2a0e', 900: '#4a180a' },
  warning: { 50: '#fff5d9', 200: '#ffdf8c', 400: '#efc548', 600: '#bd9420' },
};

export const PRESETS = {
  'terre-soleil': { label: 'Terre & Soleil (default)', explicit: TERRE_SOLEIL, font: 'fraunces', radius: 'default' },
  'slate-blue': { label: 'Slate & Blue', primary: '#334155', accent: '#3b82f6', font: 'inter', radius: 'default' },
  'zinc-violet': { label: 'Zinc & Violet', primary: '#3f3f46', accent: '#8b5cf6', font: 'inter', radius: 'rounded' },
  'stone-emerald': { label: 'Stone & Emerald', primary: '#44403c', accent: '#10b981', font: 'inter', radius: 'default' },
};

const SEMANTIC_DEFAULTS = { success: '#16a34a', danger: '#dc2626', warning: '#d97706' };

/* ───────────────────────── fonts & radius ───────────────────────── */

const MONO = `'JetBrains Mono', 'Fira Code', Consolas, monospace`;

export const FONTS = {
  fraunces: {
    selfHostedFraunces: true,
    display: `'Fraunces', Georgia, 'Times New Roman', serif`,
    sans: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    googleHref: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  },
  inter: {
    selfHostedFraunces: false,
    display: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    sans: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    googleHref: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
  },
  geist: {
    selfHostedFraunces: false,
    display: `'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    sans: `'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    googleHref: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  },
  system: {
    selfHostedFraunces: false,
    display: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    sans: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    googleHref: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
  },
};

export const RADII = {
  sharp: { sm: 4, md: 6, lg: 8, xl: 10, '2xl': 12, '3xl': 16, pill: 100, input: 6, tile: 8, card: 10 },
  default: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, pill: 100, input: 12, tile: 16, card: 20 },
  rounded: { sm: 12, md: 16, lg: 22, xl: 28, '2xl': 32, '3xl': 40, pill: 100, input: 16, tile: 22, card: 28 },
};

/* ───────────────────────── spec resolution ───────────────────────── */

export function resolveSpec(opts = {}) {
  const presetKey = opts.theme && PRESETS[opts.theme] ? opts.theme : 'terre-soleil';
  const preset = PRESETS[presetKey];
  const font = opts.font || preset.font || 'fraunces';
  const radius = opts.radius || preset.radius || 'default';
  const mode = opts.mode || 'system';

  let scales;
  if (opts.scales) {
    scales = opts.scales;
  } else if (opts.primary || opts.accent) {
    const primary = opts.primary || '#3f3f46';
    const accent = opts.accent || '#6366f1';
    scales = {
      base: genScale(primary, STEPS.base, { neutral: true }),
      brand: genScale(accent, STEPS.brand),
      success: genScale(opts.success || SEMANTIC_DEFAULTS.success, STEPS.success),
      danger: genScale(opts.danger || SEMANTIC_DEFAULTS.danger, STEPS.danger),
      warning: genScale(opts.warning || SEMANTIC_DEFAULTS.warning, STEPS.warning),
    };
  } else if (preset.explicit) {
    scales = preset.explicit;
  } else {
    scales = {
      base: genScale(preset.primary, STEPS.base, { neutral: true }),
      brand: genScale(preset.accent, STEPS.brand),
      success: genScale(SEMANTIC_DEFAULTS.success, STEPS.success),
      danger: genScale(SEMANTIC_DEFAULTS.danger, STEPS.danger),
      warning: genScale(SEMANTIC_DEFAULTS.warning, STEPS.warning),
    };
  }
  return {
    preset: presetKey,
    scales,
    mode,
    // font: a FONTS key (string) OR an object { display, sans, mono?, selfHosted:[{family,file,style}] }
    font: opts.fontSpec || font,
    // radius: a RADII key (string) OR an object of px values
    radius: opts.radiusValues || radius,
    // exact semantic overrides: { light:{...}, dark:{...} } using camelCase keys (optional)
    semantic: opts.semantic || null,
    // extended palette + gradients: { colors:{name:hex}, gradients:{name:value} } (optional)
    extended: opts.extended || null,
    // asset paths for apply-theme to copy (optional): { logos:[], symbols:[], favicon }
    assets: opts.assets || null,
  };
}

/* ───────────────────────── tokens.css renderer ───────────────────────── */

const rgbTriplet = (hex) => hexToRgb(hex).join(' ');
const paletteBlock = (name, scale, title) =>
  `  /* === ${title} === */\n` +
  Object.entries(scale).map(([k, v]) => `  --color-${name}-${k}: ${v};`).join('\n');

const BS_KEYS = [
  ['--bs-background', 'background'], ['--bs-foreground', 'foreground'], ['--bs-card', 'card'],
  ['--bs-popover', 'popover'], ['--bs-muted', 'muted'], ['--bs-muted-foreground', 'mutedForeground'],
  ['--bs-subtle', 'subtle'], ['--bs-subtle-foreground', 'subtleForeground'], ['--bs-primary', 'primary'],
  ['--bs-primary-foreground', 'primaryForeground'], ['--bs-secondary', 'secondary'],
  ['--bs-border', 'border'], ['--bs-border-subtle', 'borderSubtle'],
];

function lightDefaults(s, base900rgb) {
  return {
    background: s.base[25], foreground: s.base[900], card: '#ffffff', popover: '#ffffff',
    muted: s.base[50], mutedForeground: s.base[600], subtle: s.base[100], subtleForeground: s.base[700],
    primary: s.base[900], primaryForeground: s.base[25], secondary: s.base[100],
    border: `rgb(${base900rgb} / 0.12)`, borderSubtle: `rgb(${base900rgb} / 0.06)`,
    fieldBg: '#ffffff', fieldBgHover: s.base[25], fieldBorder: 'var(--color-base-200)',
    fieldPlaceholder: 'var(--color-base-400)', fieldIcon: 'var(--color-base-500)',
    fieldShadow: 'inset 0 0.5px 0 rgb(255 255 255 / 0.5)',
  };
}
function darkDefaults(s, base50rgb) {
  return {
    background: s.base[950], foreground: s.base[50], card: s.base[900], popover: s.base[800],
    muted: s.base[900], mutedForeground: s.base[300], subtle: s.base[800], subtleForeground: s.base[200],
    primary: s.base[50], primaryForeground: s.base[900], secondary: s.base[800],
    border: `rgb(${base50rgb} / 0.14)`, borderSubtle: `rgb(${base50rgb} / 0.07)`,
    fieldBg: s.base[900], fieldBgHover: s.base[800], fieldBorder: `rgb(${base50rgb} / 0.14)`,
    fieldPlaceholder: 'var(--color-base-400)', fieldIcon: 'var(--color-base-300)',
    fieldShadow: 'inset 0 0.5px 0 rgb(255 255 255 / 0.06)',
  };
}
function semBlock(defaults, override, indent) {
  const v = { ...defaults, ...(override || {}) };
  const L = (k, val) => `${indent}${k}: ${val};`;
  return [
    ...BS_KEYS.map(([css, key]) => L(css, v[key])),
    '',
    L('--field-bg', v.fieldBg), L('--field-bg-hover', v.fieldBgHover), L('--field-border', v.fieldBorder),
    L('--field-placeholder', v.fieldPlaceholder), L('--field-icon', v.fieldIcon),
    L('--field-shadow-inset', v.fieldShadow),
  ].join('\n');
}

function fontFaceBlock(font) {
  if (font.selfHosted && font.selfHosted.length) {
    return (
      font.selfHosted
        .map((f) => {
          const fmt = /\.ttf$/i.test(f.file) ? 'truetype-variations'
            : /\.woff2$/i.test(f.file) ? 'woff2-variations'
            : /\.otf$/i.test(f.file) ? 'opentype' : 'woff2';
          return `@font-face {\n  font-family: '${f.family}';\n  font-style: ${f.style || 'normal'};\n  font-weight: 100 900;\n  font-display: swap;\n  src: url('../../fonts/${f.file}') format('${fmt}');\n}`;
        })
        .join('\n\n') + '\n\n'
    );
  }
  if (font.selfHostedFraunces) {
    return `@font-face {
  font-family: 'Fraunces';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('../../fonts/Fraunces-VariableFont.woff2') format('woff2-variations');
  unicode-range: U+0000-017F, U+2000-206F, U+20A0-20CF;
}

@font-face {
  font-family: 'Fraunces';
  font-style: italic;
  font-weight: 100 900;
  font-display: swap;
  src: url('../../fonts/Fraunces-Italic-VariableFont.woff2') format('woff2-variations');
  unicode-range: U+0000-017F, U+2000-206F, U+20A0-20CF;
}\n\n`;
  }
  return `/* Fonts loaded via <link> in each app's <head> (see app root). */\n\n`;
}

function extendedBlock(extended) {
  if (!extended) return '';
  const colors = Object.entries(extended.colors || {})
    .map(([k, v]) => `  --color-${k}: ${v};`).join('\n');
  const grads = Object.entries(extended.gradients || {})
    .map(([k, v]) => `  --${k.startsWith('gradient') ? k : `gradient-${k}`}: ${v};`).join('\n');
  if (!colors && !grads) return '';
  return `\n\n  /* === EXTENDED — imported design palette + gradients ===\n     Editorial colors / signature gradients carried over from the design. */\n${[colors, grads].filter(Boolean).join('\n')}`;
}

export function renderTokensCss(spec) {
  const s = spec.scales;
  const font = typeof spec.font === 'object' && spec.font ? spec.font : (FONTS[spec.font] || FONTS.fraunces);
  const r = typeof spec.radius === 'object' && spec.radius
    ? { ...RADII.default, ...spec.radius }
    : (RADII[spec.radius] || RADII.default);
  const radiusLabel = typeof spec.radius === 'string' ? spec.radius : 'custom';
  const base900rgb = rgbTriplet(s.base[900]);
  const base50rgb = rgbTriplet(s.base[50]);
  const brand400rgb = rgbTriplet(s.brand[400]);
  const sem = spec.semantic || {};

  return `/**
 * Design tokens — generated by create-koralab-saas (scripts/design.mjs).
 * Single source of truth (colors, fonts, sizes, radii, shadows).
 * Imported by the apps via: @import '@__SCOPE__/ui/styles/tokens.css';
 * Re-theme: re-run the generator, or edit the palette/semantic blocks below.
 */

${fontFaceBlock(font)}@theme {
  /* Default Tailwind palette purged — only the palettes below exist as utilities. */
  --color-*: initial;
  --color-white: #ffffff;
  --color-black: #000000;
  --color-transparent: transparent;
  --color-current: currentColor;
  --color-inherit: inherit;

${paletteBlock('brand', s.brand, 'BRAND — signature accent (≤ 15% of any surface)')}

${paletteBlock('base', s.base, 'BASE — primary text + background + CTA')}

${paletteBlock('success', s.success, 'SUCCESS')}

${paletteBlock('danger', s.danger, 'DANGER')}

${paletteBlock('warning', s.warning, 'WARNING')}${extendedBlock(spec.extended)}

  /* === SEMANTIC TOKENS (dark-mode aware via --bs-* below) === */
  --color-background: var(--bs-background);
  --color-foreground: var(--bs-foreground);
  --color-card: var(--bs-card);
  --color-card-foreground: var(--bs-foreground);
  --color-popover: var(--bs-popover);
  --color-popover-foreground: var(--bs-foreground);
  --color-muted: var(--bs-muted);
  --color-muted-foreground: var(--bs-muted-foreground);
  --color-subtle: var(--bs-subtle);
  --color-subtle-foreground: var(--bs-subtle-foreground);
  --color-primary: var(--bs-primary);
  --color-primary-foreground: var(--bs-primary-foreground);
  --color-secondary: var(--bs-secondary);
  --color-secondary-foreground: var(--bs-foreground);
  --color-accent: var(--color-brand-400);
  --color-accent-foreground: var(--color-base-900);
  --color-destructive: var(--color-danger-600);
  --color-destructive-foreground: #ffffff;
  --color-border: var(--bs-border);
  --color-border-subtle: var(--bs-border-subtle);
  --color-input: var(--bs-border);
  --color-ring: var(--color-brand-400);

  /* === TYPOGRAPHY === */
  --font-display: ${font.display};
  --font-display--font-feature-settings: 'ss01', 'ss02';
  --font-sans: ${font.sans};
  --font-mono: ${font.mono || MONO};

  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-md: 15px;
  --text-lg: 17px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;
  --text-4xl: 40px;
  --text-5xl: 56px;
  --text-6xl: 72px;

  --tracking-display: -2px;
  --tracking-tighter: -1.2px;
  --tracking-tight: -0.6px;
  --tracking-normal: -0.2px;
  --tracking-wide: 0.5px;
  --tracking-widest: 1.5px;

  /* === BORDER RADIUS (${radiusLabel}) === */
  --radius-sm: ${r.sm}px;
  --radius-md: ${r.md}px;
  --radius-lg: ${r.lg}px;
  --radius-xl: ${r.xl}px;
  --radius-2xl: ${r['2xl']}px;
  --radius-3xl: ${r['3xl']}px;
  --radius-pill: ${r.pill}px;
  --radius-full: 9999px;
  --radius-input: ${r.input}px;
  --radius-tile: ${r.tile}px;
  --radius-card: ${r.card}px;

  /* === SHADOWS (warm, never pure black) === */
  --shadow-xs: 0 1px 2px 0 rgb(${base900rgb} / 0.04);
  --shadow-sm: 0 1px 3px 0 rgb(${base900rgb} / 0.06), 0 1px 2px -1px rgb(${base900rgb} / 0.04);
  --shadow-md: 0 4px 8px -2px rgb(${base900rgb} / 0.06), 0 2px 4px -2px rgb(${base900rgb} / 0.04);
  --shadow-lg: 0 12px 20px -4px rgb(${base900rgb} / 0.08), 0 4px 8px -4px rgb(${base900rgb} / 0.04);
  --shadow-focus: 0 0 0 3px rgb(${brand400rgb} / 0.25);
  --ring-focus: rgb(${brand400rgb} / 0.25);
}

/* === Semantic runtime values — light (default) === */
:root {
  color-scheme: light dark;
${semBlock(lightDefaults(s, base900rgb), sem.light, '  ')}
}

/* === Dark values === */
.dark {
${semBlock(darkDefaults(s, base50rgb), sem.dark, '  ')}
}

@media (prefers-color-scheme: dark) {
  :root:not(.light) {
${semBlock(darkDefaults(s, base50rgb), sem.dark, '    ')}
  }
}

/* === Base styles === */
* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
  font-feature-settings: 'ss01', 'cv11';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

::selection {
  background-color: var(--color-brand-200);
  color: var(--color-base-900);
}

:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
  border-radius: var(--radius-sm);
}

@utility border-hairline {
  border-width: 0.5px;
  border-style: solid;
  border-color: rgb(${base900rgb} / 0.06);
}
`;
}
