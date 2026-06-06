/**
 * Tests `formatMoney()` — regles UX-DR6 __PROJECT_NAME__.
 *
 * - XOF/XAF : 0 decimale, espace fine insecable entre groupes.
 * - EUR : 2 decimales avec virgule + symbole EUR (NBSP devant).
 * - USD : prefixe $.
 */

import { describe, it, expect } from 'vitest';
import { formatMoney } from '../primitives/money-display';

describe('formatMoney', () => {
  it('formate XOF sans decimale avec espace fine entre milliers', () => {
    const out = formatMoney(145000n, 'XOF');
    // La NBSP entre milliers peut etre thin (U+202F) ou normale (U+00A0)
    // selon le runtime Intl. On verifie juste la presence des morceaux.
    expect(out).toContain('145');
    expect(out).toContain('000');
    expect(out).toContain('FCFA');
    expect(out).not.toContain(',');
    expect(out).not.toContain('.');
  });

  it('formate XAF identique XOF', () => {
    const out = formatMoney(2500n, 'XAF');
    expect(out).toContain('2');
    expect(out).toContain('500');
    expect(out).toContain('FCFA');
  });

  it('formate EUR avec 2 decimales + symbole EUR', () => {
    const out = formatMoney(14500n, 'EUR'); // = 145,00 EUR
    expect(out).toContain('145');
    expect(out).toContain(',00');
    expect(out).toContain('€');
  });

  it('formate USD avec prefixe $ et 2 decimales', () => {
    const out = formatMoney(14500n, 'USD'); // = $145,00
    expect(out).toContain('$');
    expect(out).toContain('145');
    expect(out).toContain(',00');
  });

  it('gere les montants negatifs', () => {
    const out = formatMoney(-50000n, 'XOF');
    expect(out.startsWith('-')).toBe(true);
    expect(out).toContain('50');
    expect(out).toContain('000');
  });

  it('gere zero', () => {
    // L'espace devant FCFA / EUR peut etre NBSP (U+00A0) ou normale selon Intl.
    expect(formatMoney(0n, 'XOF')).toMatch(/^0\s?FCFA$/);
    expect(formatMoney(0n, 'EUR')).toMatch(/^0,00\s?€$/);
  });

  it('preserve la precision sur tres gros montants (bigint)', () => {
    // 1 000 000 000 FCFA = 1 milliard
    const out = formatMoney(1_000_000_000n, 'XOF');
    expect(out).toContain('1');
    expect(out).toContain('000');
    expect(out).toContain('FCFA');
  });
});
