#!/usr/bin/env node
/**
 * build-fonts — subset + conversion WOFF2 des fontes Fraunces (Story 2.3).
 *
 * Convertit les 2 fichiers Fraunces variables (Roman + Italic) en WOFF2,
 * sous-définis aux plages Unicode nécessaires à __PROJECT_NAME__ : latin + français
 * + wolof latinisé + ponctuation + devises.
 *
 * Tous les axes de variation sont **conservés** (`opsz` 9-144, `SOFT`, `WONK`,
 * `wght` 100-900) — fidélité maximale au bundle de design, qui livre ces mêmes
 * fichiers source. Le sous-ensemble Unicode reste appliqué pour limiter le poids.
 *
 * Outil : `subset-font` (harfbuzz + woff2 en wasm — aucune dépendance système).
 * Régénération : `pnpm --filter @__SCOPE__/ui fonts:build`.
 */

import subsetFont from 'subset-font';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FONTS_DIR = join(fileURLToPath(import.meta.url), '..', '..', 'fonts');
const SOURCE_DIR = join(FONTS_DIR, 'source');

// Plages Unicode retenues — miroir du `unicode-range` déclaré dans fonts.css :
// latin de base + Latin-1 + Latin Extended-A (œ, Ÿ, ŋ wolof…) + ponctuation
// générale + symboles monétaires. Latin Extended Additional (U+1E00) n'est
// pas requis pour le français / wolof — exclu pour alléger.
const RANGES = [
  [0x20, 0x17f],
  [0x2000, 0x206f],
  [0x20a0, 0x20cf],
];

let text = '';
for (const [start, end] of RANGES) {
  for (let cp = start; cp <= end; cp++) text += String.fromCodePoint(cp);
}

const SOURCES = [
  { in: 'Fraunces-VariableFont_opsz_wght.ttf', out: 'Fraunces-VariableFont.woff2' },
  { in: 'Fraunces-Italic-VariableFont_opsz_wght.ttf', out: 'Fraunces-Italic-VariableFont.woff2' },
];

let total = 0;
for (const { in: src, out } of SOURCES) {
  const input = await readFile(join(SOURCE_DIR, src));
  const woff2 = await subsetFont(input, text, {
    targetFormat: 'woff2',
  });
  await writeFile(join(FONTS_DIR, out), woff2);
  total += woff2.length;
  console.log(
    `  ${out}  ${(woff2.length / 1024).toFixed(1)} KB` +
      `  (source ${src} ${(input.length / 1024).toFixed(1)} KB)`,
  );
}
console.log(`  ── total WOFF2 : ${(total / 1024).toFixed(1)} KB`);
