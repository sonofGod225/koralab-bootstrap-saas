/**
 * Génération des icônes PWA __PROJECT_NAME__ (Story 1.10).
 *
 * Produit :
 * - icon-192.png        (192x192, purpose "any") — bordée arrondie brand Base 900.
 * - icon-512.png        (512x512, purpose "any") — idem haute résolution.
 * - icon-maskable-512.png (512x512, purpose "maskable") — safe zone 80%, bord plein.
 *
 * Le SVG source est le PetalSymbol __PROJECT_NAME__ (Base 900 base, Brand 400 accent),
 * inliné ici pour rester indépendant de l'arborescence apps/.
 *
 * Usage :
 *   node packages/ui/scripts/generate-icons.mjs
 *
 * Les PNG générés sont copiés dans apps/suite/public/ et apps/admin/public/.
 *
 * Dépendance : sharp (devDependency root).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../..');

const TERRE_900 = '#2A1A0F';
const SOLEIL_400 = '#E89B5A';
const TERRE_100 = '#F4E4CC';

/**
 * Construit le SVG PetalSymbol carré.
 *
 * @param {number} size — taille viewport (px).
 * @param {object} options
 * @param {string} options.bg — couleur fond carré.
 * @param {string} options.base — couleur des 3 pétales principales.
 * @param {string} options.accent — couleur de la pétale Brand (bottom-right).
 * @param {number} options.padding — marge interne (% du viewport, 0–1).
 * @param {number} options.cornerRadius — radius arrondi du carré fond (px).
 * @returns {string} SVG source.
 */
function buildPetalSvg(size, { bg, base, accent, padding, cornerRadius }) {
  // Le PetalSymbol viewbox est 56×56. On le centre dans le size×size avec padding.
  const inner = size * (1 - padding * 2);
  const offset = (size - inner) / 2;
  const scale = inner / 56;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="${bg}"/>
    <g transform="translate(${offset}, ${offset}) scale(${scale})">
      <path d="M 8 28 L 8 18 Q 8 8 18 8 L 28 8 L 28 28 Z" fill="${base}"/>
      <path d="M 30 28 L 30 8 L 48 8 Q 48 8 48 18 L 48 28 Z" fill="${base}"/>
      <path d="M 8 30 L 28 30 L 28 48 L 18 48 Q 8 48 8 38 Z" fill="${base}"/>
      <path d="M 30 30 L 48 30 L 48 38 Q 48 48 38 48 L 30 48 Z" fill="${accent}"/>
    </g>
  </svg>`;
}

/**
 * Rasterise un SVG en PNG via sharp.
 *
 * @param {string} svg — source SVG.
 * @param {number} size — taille de sortie en px (carré).
 * @returns {Promise<Buffer>} buffer PNG.
 */
async function rasterize(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

const TARGETS = [
  resolve(REPO_ROOT, 'apps/suite/public'),
  resolve(REPO_ROOT, 'apps/admin/public'),
];

/**
 * Écrit un buffer dans tous les dossiers target.
 */
function writeAll(filename, buffer) {
  for (const target of TARGETS) {
    mkdirSync(target, { recursive: true });
    const path = resolve(target, filename);
    writeFileSync(path, buffer);
    console.log(`  → ${path} (${buffer.length} bytes)`);
  }
}

async function main() {
  console.log('Génération des icônes PWA __PROJECT_NAME__…');

  // icon-192 et icon-512 : purpose "any" — bord arrondi (rx ≈ 14% — équivalent
  // au radius Apple iOS pour le rendu sur Android Chrome/Edge sans mask).
  // Padding interne 18 % pour aérer le pétale.
  console.log('\nicon-192.png (any) :');
  const svg192 = buildPetalSvg(192, {
    bg: TERRE_900,
    base: TERRE_100,
    accent: SOLEIL_400,
    padding: 0.18,
    cornerRadius: 28,
  });
  writeAll('icon-192.png', await rasterize(svg192, 192));

  console.log('\nicon-512.png (any) :');
  const svg512 = buildPetalSvg(512, {
    bg: TERRE_900,
    base: TERRE_100,
    accent: SOLEIL_400,
    padding: 0.18,
    cornerRadius: 76,
  });
  writeAll('icon-512.png', await rasterize(svg512, 512));

  // icon-maskable-512 : purpose "maskable" — la safe zone Android exige
  // que le contenu visible tienne dans un cercle de 80 % du carré. On
  // augmente le padding à 22 % et on supprime le radius (fond plein), le
  // launcher Android masquera selon sa propre forme (cercle, squircle...).
  console.log('\nicon-maskable-512.png (maskable, safe zone 80%) :');
  const svgMaskable = buildPetalSvg(512, {
    bg: TERRE_900,
    base: TERRE_100,
    accent: SOLEIL_400,
    padding: 0.22,
    cornerRadius: 0,
  });
  writeAll('icon-maskable-512.png', await rasterize(svgMaskable, 512));

  console.log('\nTerminé.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
