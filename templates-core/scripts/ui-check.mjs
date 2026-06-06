#!/usr/bin/env node
/**
 * ui-check — audit anti-duplication du design system (Story 2.16).
 *
 * Vérifie que les apps (`apps/* /src/components/**`) ne ré-implémentent pas
 * une primitive déjà fournie par `@__SCOPE__/ui` (cf. ADR 0007 + ADR 0010).
 *
 * Détecte :
 *  1. Tout dossier `apps/* /src/components/ui/` — banni : les primitives
 *     vivent exclusivement dans `packages/ui`.
 *  2. Tout fichier d'app dont le nom correspond à une primitive `@__SCOPE__/ui`
 *     (ex: `button.tsx`, `data-table.tsx`) — duplication probable.
 *
 * Sortie : warnings (n'échoue pas le build par défaut, cf. AC Story 2.16).
 * Passer `--strict` pour sortir en code 1 si une duplication est trouvée
 * (utilisable comme gate CI une fois le design system stabilisé).
 *
 * Usage : `pnpm ui:check` (ou `node scripts/ui-check.mjs --strict`).
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const strict = process.argv.includes('--strict');

/** Liste les fichiers `.tsx`/`.ts` sous `dir` (récursif). */
function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      out.push(...walk(full));
    } else if (/\.(tsx|ts)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Noms de primitives exposées par @__SCOPE__/ui (sans extension). */
function uiPrimitiveNames() {
  const dirs = [
    join(ROOT, 'packages/ui/src/components/ui'),
    join(ROOT, 'packages/ui/src/primitives'),
  ];
  const names = new Set();
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (/\.tsx$/.test(f) && f !== 'index.tsx') {
        names.add(basename(f, '.tsx'));
      }
    }
  }
  return names;
}

const primitives = uiPrimitiveNames();
const appsDir = join(ROOT, 'apps');
const warnings = [];

if (existsSync(appsDir)) {
  for (const app of readdirSync(appsDir)) {
    const componentsDir = join(appsDir, app, 'src/components');
    if (!existsSync(componentsDir)) continue;

    // 1. Dossier `components/ui/` banni.
    const uiDir = join(componentsDir, 'ui');
    if (existsSync(uiDir)) {
      warnings.push(
        `Dossier interdit : ${relative(ROOT, uiDir)} — les primitives vivent dans packages/ui (ADR 0007).`,
      );
    }

    // 2. Fichiers dont le nom recouvre une primitive @__SCOPE__/ui.
    for (const file of walk(componentsDir)) {
      const name = basename(file, file.endsWith('.tsx') ? '.tsx' : '.ts');
      if (primitives.has(name)) {
        warnings.push(
          `Duplication probable : ${relative(ROOT, file)} — '${name}' existe déjà dans @__SCOPE__/ui/${name}.`,
        );
      }
    }
  }
}

if (warnings.length === 0) {
  console.log('✓ ui-check : aucune duplication détectée avec @__SCOPE__/ui.');
  process.exit(0);
}

console.warn(
  `\n⚠ ui-check : ${warnings.length} duplication(s) potentielle(s) avec @__SCOPE__/ui :\n`,
);
for (const w of warnings) console.warn(`  • ${w}`);
console.warn(
  '\nRègle : importer depuis @__SCOPE__/ui/<composant> — ne jamais ré-implémenter.\n' +
    'Si une extension est nécessaire, créer un wrapper dans packages/ui/src/primitives/ (+ ADR).\n',
);

process.exit(strict ? 1 : 0);
