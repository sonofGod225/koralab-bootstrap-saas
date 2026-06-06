/**
 * set-version — propage la version produit dans tous les package.json.
 *
 * Story 1.17 (versioning automatique). Invoqué par `@semantic-release/exec`
 * en phase `prepare` : `node scripts/set-version.mjs ${nextRelease.version}`.
 * Le commit-back (`@semantic-release/git`) committe ensuite les fichiers.
 *
 * Liste littérale des 11 workspaces (volontairement explicite, pas de glob :
 * le monorepo est fixe et petit — déterminisme garanti).
 *
 * Usage : node scripts/set-version.mjs <version>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`set-version: version invalide "${version ?? ''}"`);
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  'package.json',
  'apps/api/package.json',
  'apps/suite/package.json',
  'apps/admin/package.json',
  'packages/config/package.json',
  'packages/ui/package.json',
  'packages/types/package.json',
  'packages/db/package.json',
  'packages/rpc/package.json',
  'packages/events/package.json',
  'packages/notifications/package.json',
];

for (const rel of files) {
  const abs = resolve(root, rel);
  const pkg = JSON.parse(readFileSync(abs, 'utf8'));
  if (pkg.version === version) continue;
  pkg.version = version;
  // Indent 2 espaces + newline final — cohérent avec les fichiers existants
  // et la config Prettier du repo.
  writeFileSync(abs, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`set-version: ${rel} -> ${version}`);
}
