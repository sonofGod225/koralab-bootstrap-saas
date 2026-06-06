/**
 * Story 2.13 — contrat de contraste WCAG 2.1 AA.
 *
 * Vérifie les ratios de contraste des paires de couleurs critiques du design
 * system Base & Brand (cf. AC Story 2.13).
 */

import { describe, it, expect } from 'vitest';

/** Luminance relative d'un canal sRGB (0-255) selon WCAG 2.1. */
function channelLuminance(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminance relative d'une couleur hex `#rrggbb`. */
function relativeLuminance(hex: string): number {
  const n = hex.replace('#', '');
  const r = channelLuminance(parseInt(n.slice(0, 2), 16));
  const g = channelLuminance(parseInt(n.slice(2, 4), 16));
  const b = channelLuminance(parseInt(n.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste WCAG entre deux couleurs hex (1 → 21). */
function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

// Tokens Base & Brand (tokens.css)
const TERRE_25 = '#fcf7ee';
const TERRE_900 = '#2a1a0f';
const SOLEIL_400 = '#e89b5a';
const BRIQUE_600 = '#b8421a';

describe('Story 2.13 — contraste WCAG 2.1 AA', () => {
  it('Base 900 sur Ivoire 25 ≥ 7:1 (AAA texte normal)', () => {
    expect(contrastRatio(TERRE_900, TERRE_25)).toBeGreaterThanOrEqual(7);
  });

  it('Brand 400 sur Base 900 ≥ 4.5:1 (AA texte normal)', () => {
    expect(contrastRatio(SOLEIL_400, TERRE_900)).toBeGreaterThanOrEqual(4.5);
  });

  it('Danger 600 sur Ivoire 25 ≥ 4.5:1 (AA texte normal)', () => {
    expect(contrastRatio(BRIQUE_600, TERRE_25)).toBeGreaterThanOrEqual(4.5);
  });
});
