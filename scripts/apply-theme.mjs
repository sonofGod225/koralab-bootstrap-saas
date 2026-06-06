/**
 * apply-theme.mjs — applies a resolved theme spec to a generated `core` project.
 *
 * Rewrites packages/ui/src/styles/tokens.css (palettes + semantic + radius + fonts),
 * regenerates the logo component / favicon / manifest colors, swaps the Google-Fonts
 * <link> when the font is not the self-hosted default, and sets the default color mode.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { renderTokensCss, FONTS } from './design.mjs';

const exists = (p) => existsSync(p);
const read = (p) => readFileSync(p, 'utf8');
const write = (p, s) => writeFileSync(p, s);

/**
 * @param outDir generated project root
 * @param spec   resolved theme spec (from design.resolveSpec)
 * @param ctx    { scope, name, display }
 */
export function applyTheme(outDir, spec, ctx) {
  const { scope, display } = ctx;
  const s = spec.scales;
  const base900 = s.base[900], base25 = s.base[25], brand400 = s.brand[400];
  const detok = (str) =>
    str
      .replace(/@__SCOPE__\//g, `@${scope}/`)
      .replace(/__PROJECT_NAME__/g, display)
      .replace(/__PROJECT_SLUG__/g, ctx.name);

  // 1) tokens.css
  const tokensPath = join(outDir, 'packages/ui/src/styles/tokens.css');
  if (exists(tokensPath)) write(tokensPath, detok(renderTokensCss(spec)));

  // 2) Font <link> swap (non-default fonts) on each app root.
  const font = FONTS[spec.font] || FONTS.fraunces;
  if (spec.font !== 'fraunces' && font.googleHref) {
    for (const app of ['suite', 'admin']) {
      const root = join(outDir, `apps/${app}/src/routes/__root.tsx`);
      if (!exists(root)) continue;
      let c = read(root);
      c = c.replace(/href:\s*'https:\/\/fonts\.googleapis\.com\/css2\?[^']*'/g, `href: '${font.googleHref}'`);
      write(root, c);
    }
  }

  // 3) Default color mode → <html> class (system = no class, auto via media).
  if (spec.mode === 'dark' || spec.mode === 'light') {
    for (const app of ['suite', 'admin']) {
      const root = join(outDir, `apps/${app}/src/routes/__root.tsx`);
      if (!exists(root)) continue;
      let c = read(root);
      c = c.replace(/<html lang="fr">/, `<html lang="fr" className="${spec.mode}">`);
      write(root, c);
    }
  }

  // 4) Logo component (suite) — generic mark: rounded tile + initial in brand.
  const initial = (display.match(/[A-Za-z0-9]/)?.[0] || 'A').toUpperCase();
  const logoPath = join(outDir, `apps/suite/src/components/${ctx.name}-logo.tsx`);
  if (exists(logoPath)) write(logoPath, logoComponent(display, initial));

  // 5) favicon + manifest colors.
  const favicon = join(outDir, 'apps/suite/public/favicon.svg');
  if (exists(favicon)) write(favicon, faviconSvg(display, initial, base900, brand400));
  const manifest = join(outDir, 'apps/suite/public/manifest.webmanifest');
  if (exists(manifest)) {
    let m = read(manifest);
    m = m.replace(/"theme_color":\s*"[^"]*"/i, `"theme_color": "${base900}"`);
    m = m.replace(/"background_color":\s*"[^"]*"/i, `"background_color": "${base25}"`);
    write(manifest, m);
  }
}

function logoComponent(display, initial) {
  return `/**
 * ${display} brand mark — generic placeholder generated at init.
 * Replace the SVG/wordmark with your own logo. Colors use design tokens
 * (base-900 tile, brand-400 glyph) so they follow the theme automatically.
 */
export function ${display}Symbol({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden role="img">
      <rect width="32" height="32" rx="8" fill="var(--color-base-900)" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="600"
        fontSize="18"
        fill="var(--color-brand-400)"
      >
        ${initial}
      </text>
    </svg>
  );
}

export function ${display}Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="${display}">
      <${display}Symbol size={size} />
      <span className="font-display text-base-900 text-base font-semibold tracking-tight">
        ${display}
      </span>
    </span>
  );
}

export function ${display}Loader({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div
      className="bg-background flex min-h-screen flex-col items-center justify-center gap-5"
      role="status"
      aria-live="polite"
    >
      <${display}Symbol size={56} className="animate-pulse" />
      <p className="text-base-600 text-sm">{message}</p>
    </div>
  );
}
`;
}

function faviconSvg(display, initial, base900, brand400) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" role="img" aria-labelledby="title">
  <title id="title">${display} favicon</title>
  <rect width="32" height="32" rx="6" fill="${base900}"/>
  <text x="16" y="23" text-anchor="middle" font-family="Georgia, serif" font-weight="600" font-size="20" fill="${brand400}">${initial}</text>
</svg>
`;
}
