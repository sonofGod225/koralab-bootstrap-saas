/**
 * Story 2.2 — garde anti-fuite de la palette Tailwind par défaut.
 *
 * `tokens.css` purge la palette par défaut (`--color-*: initial`) : seule la
 * palette __PROJECT_NAME__ (base / brand / success / danger / warning) existe comme
 * classes utilitaires. Ce test verrouille l'intention côté code source —
 * il échoue si une classe `text-orange-500`, `bg-slate-100`, etc. est écrite
 * dans les apps ou dans `packages/ui` (elle serait inerte, mais interdite).
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// <root>/packages/ui/src/__tests__/no-default-palette.test.ts → <root>
const ROOT = join(fileURLToPath(import.meta.url), '..', '..', '..', '..', '..');

/** Palettes Tailwind par défaut — interdites dans __PROJECT_NAME__. */
const DEFAULT_PALETTES = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];
const PREFIXES = [
  'bg',
  'text',
  'border',
  'ring',
  'from',
  'via',
  'to',
  'fill',
  'stroke',
  'divide',
  'outline',
  'accent',
  'caret',
  'decoration',
  'placeholder',
  'shadow',
];
const LEAK = new RegExp(
  `\\b(${PREFIXES.join('|')})-(${DEFAULT_PALETTES.join('|')})-(50|100|200|300|400|500|600|700|800|900|950)\\b`,
  'g',
);

const SCAN_DIRS = [join(ROOT, 'apps'), join(ROOT, 'packages/ui/src')];
const EXT = /\.(tsx?|css|html)$/;

function walk(dir: string): string[] {
  let files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '__tests__') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files = files.concat(walk(full));
    else if (EXT.test(entry)) files.push(full);
  }
  return files;
}

describe('Story 2.2 — palette Tailwind par défaut', () => {
  it('aucune classe de la palette par défaut ne fuit dans apps/ ni packages/ui', () => {
    const leaks: string[] = [];
    for (const root of SCAN_DIRS) {
      for (const file of walk(root)) {
        const matches = readFileSync(file, 'utf8').match(LEAK);
        if (matches) {
          leaks.push(`${relative(ROOT, file)} → ${[...new Set(matches)].join(', ')}`);
        }
      }
    }
    expect(leaks, `Classes Tailwind par défaut interdites :\n${leaks.join('\n')}`).toEqual([]);
  });
});
