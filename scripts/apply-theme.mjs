/**
 * apply-theme.mjs — applies a resolved theme spec to a generated `core` project.
 *
 * Rewrites packages/ui/src/styles/tokens.css (palettes + semantic + extended +
 * radius + fonts), copies imported self-hosted fonts + brand logos/favicon,
 * regenerates the logo component, swaps the Google-Fonts <link> for preset fonts,
 * and sets the default color mode.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { renderTokensCss, FONTS } from './design.mjs';

const read = (p) => readFileSync(p, 'utf8');
const write = (p, s) => writeFileSync(p, s);

/**
 * @param outDir generated project root
 * @param spec   resolved theme spec (design.resolveSpec)
 * @param ctx    { scope, name, display }
 */
export function applyTheme(outDir, spec, ctx) {
  const { display } = ctx;
  const s = spec.scales;
  const sem = spec.semantic?.light || {};
  const base900 = s.base[900], base25 = s.base[25], brand400 = s.brand[400];
  const themeColor = sem.primary || sem.foreground || base900;
  const bgColor = sem.background || base25;
  const detok = (str) =>
    str
      .replace(/@__SCOPE__\//g, `@${ctx.scope}/`)
      .replace(/__PROJECT_NAME__/g, display)
      .replace(/__PROJECT_SLUG__/g, ctx.name);

  // 1) tokens.css
  const tokensPath = join(outDir, 'packages/ui/src/styles/tokens.css');
  if (existsSync(tokensPath)) write(tokensPath, detok(renderTokensCss(spec)));

  // 2) Imported self-hosted fonts → packages/ui/fonts/
  const fontObj = typeof spec.font === 'object' ? spec.font : null;
  if (fontObj?.selfHosted?.length) {
    const fontsDir = join(outDir, 'packages/ui/fonts');
    mkdirSync(fontsDir, { recursive: true });
    for (const f of fontObj.selfHosted) {
      if (f.src && existsSync(f.src)) copyFileSync(f.src, join(fontsDir, basename(f.file)));
    }
  }

  // 3) Google-Fonts <link> swap (preset fonts only; imported fonts are self-hosted).
  if (typeof spec.font === 'string' && spec.font !== 'fraunces' && FONTS[spec.font]?.googleHref) {
    for (const app of ['suite', 'admin']) {
      const root = join(outDir, `apps/${app}/src/routes/__root.tsx`);
      if (!existsSync(root)) continue;
      write(root, read(root).replace(/href:\s*'https:\/\/fonts\.googleapis\.com\/css2\?[^']*'/g, `href: '${FONTS[spec.font].googleHref}'`));
    }
  }

  // 4) Default color mode → <html> class (system = none; auto via media).
  if (spec.mode === 'dark' || spec.mode === 'light') {
    for (const app of ['suite', 'admin']) {
      const root = join(outDir, `apps/${app}/src/routes/__root.tsx`);
      if (!existsSync(root)) continue;
      write(root, read(root).replace(/<html lang="fr">/, `<html lang="fr" className="${spec.mode}">`));
    }
  }

  // 5) Brand: imported SVG logo (if any) else generic initial mark.
  const initial = (display.match(/[A-Za-z0-9]/)?.[0] || 'A').toUpperCase();
  const publicDir = join(outDir, 'apps/suite/public');
  const logoPath = join(outDir, `apps/suite/src/components/${ctx.name}-logo.tsx`);
  const assets = spec.assets || {};
  const pickLogo = (arr, re) => (arr || []).find((p) => re.test(basename(p).toLowerCase())) || (arr || [])[0] || null;
  const logoSrc = pickLogo(assets.logos, /primary|light/);
  const symbolSrc = pickLogo(assets.symbols, /^(?!.*(dark|mono)).*$/) || pickLogo(assets.symbols, /./);

  if (existsSync(publicDir) && (logoSrc || symbolSrc)) {
    mkdirSync(publicDir, { recursive: true });
    let logoFile = null, symbolFile = null;
    if (logoSrc && existsSync(logoSrc)) { logoFile = 'brand-logo.svg'; copyFileSync(logoSrc, join(publicDir, logoFile)); }
    if (symbolSrc && existsSync(symbolSrc)) { symbolFile = 'brand-symbol.svg'; copyFileSync(symbolSrc, join(publicDir, symbolFile)); }
    if (assets.favicon && existsSync(assets.favicon)) copyFileSync(assets.favicon, join(publicDir, 'favicon.svg'));
    if (existsSync(logoPath)) write(logoPath, brandLogoComponent(display, symbolFile || logoFile, logoFile || symbolFile));
  } else {
    if (existsSync(logoPath)) write(logoPath, genericLogoComponent(display, initial));
    const favicon = join(publicDir, 'favicon.svg');
    if (existsSync(favicon)) write(favicon, faviconSvg(display, initial, base900, brand400));
  }

  // 6) manifest colors.
  const manifest = join(publicDir, 'manifest.webmanifest');
  if (existsSync(manifest)) {
    let m = read(manifest);
    m = m.replace(/"theme_color":\s*"[^"]*"/i, `"theme_color": "${themeColor}"`);
    m = m.replace(/"background_color":\s*"[^"]*"/i, `"background_color": "${bgColor}"`);
    write(manifest, m);
  }
}

/* ── logo components ── */

function brandLogoComponent(display, symbolFile, logoFile) {
  return `/**
 * ${display} brand mark — imported from a Claude Design bundle (SVG in /public).
 * Replace the SVGs in apps/suite/public to update the brand.
 */
export function ${display}Symbol({ size = 24, className }: { size?: number; className?: string }) {
  return <img src="/${symbolFile}" width={size} height={size} className={className} alt="${display}" />;
}

export function ${display}Logo({ size = 22 }: { size?: number }) {
  return <img src="/${logoFile}" height={size} className="inline-block" alt="${display}" />;
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

function genericLogoComponent(display, initial) {
  return `/**
 * ${display} brand mark — generic placeholder generated at init.
 * Replace the SVG/wordmark with your own logo. Colors use design tokens.
 */
export function ${display}Symbol({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden role="img">
      <rect width="32" height="32" rx="8" fill="var(--color-base-900)" />
      <text x="16" y="22" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="600" fontSize="18" fill="var(--color-brand-400)">
        ${initial}
      </text>
    </svg>
  );
}

export function ${display}Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="${display}">
      <${display}Symbol size={size} />
      <span className="font-display text-base-900 text-base font-semibold tracking-tight">${display}</span>
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
