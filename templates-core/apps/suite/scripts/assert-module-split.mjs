/**
 * Quality gate : code-split des modules produit (Murat / POC modularité).
 *
 * RISQUE PROTÉGÉ — régression silencieuse : du code d'un `packages/module-*`
 * réintègre le bundle chargé eagerly (import statique hors `.lazy.tsx`, barrel
 * cassé, shim transformé en import direct). Invisible fonctionnellement, donc
 * indétectable en review/QA → ne se voit qu'à l'usure du TTI. D'où ce gate.
 *
 * DOUBLE ASSERTION (sinon le gate « mesure son propre aveuglement ») :
 *   1. Le shim du module est bien LAZY  — `isDynamicEntry` + cible d'un
 *      `dynamicImports`, ET son fichier existe (client + serveur).
 *   2. Le shim n'est PAS EAGER — absent de la clôture transitive des `imports`
 *      statiques partant des chunks `isEntry`.
 *
 * FAIL-HARD (pas de faux vert) : manifest absent/illisible, chunk manquant,
 * liste de modules vide, ou shim introuvable → exit 1.
 *
 * Lancé via `pnpm test:bundle` (turbo : `dependsOn: ["build"]`).
 * Config déclarative : module-split.config.json (scale à N modules sans code).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CWD = process.cwd();
const fail = (msg) => {
  console.error(`\n❌ assert-module-split : ${msg}\n`);
  process.exit(1);
};
const readJson = (rel) => {
  const abs = resolve(CWD, rel);
  if (!existsSync(abs)) fail(`fichier introuvable : ${rel} (lancer le build d'abord ?)`);
  try {
    return JSON.parse(readFileSync(abs, 'utf8'));
  } catch (err) {
    return fail(`JSON illisible : ${rel} — ${err.message}`);
  }
};

const config = readJson('module-split.config.json');
const manifest = readJson(config.serverManifest);

const modules = Array.isArray(config.modules) ? config.modules : [];
if (modules.length === 0) fail('aucun module déclaré dans module-split.config.json');

// 1) Clôture transitive des imports STATIQUES depuis les entrées `isEntry`.
const eager = new Set();
const walk = (key) => {
  if (eager.has(key)) return;
  eager.add(key);
  const entry = manifest[key];
  if (!entry) return;
  for (const dep of entry.imports ?? []) walk(dep);
};
for (const [key, entry] of Object.entries(manifest)) {
  if (entry.isEntry) walk(key);
}

// 2) Toutes les cibles de `dynamicImports` (= ce qui est chargé lazy).
const dynamicTargets = new Set();
for (const entry of Object.values(manifest)) {
  for (const dep of entry.dynamicImports ?? []) dynamicTargets.add(dep);
}

const clientAssets = existsSync(resolve(CWD, config.clientAssetsDir))
  ? new Set(readdirSync(resolve(CWD, config.clientAssetsDir)))
  : fail(`dossier client introuvable : ${config.clientAssetsDir}`);

const problems = [];
for (const mod of modules) {
  const { name, shimSrc } = mod;
  const entry = manifest[shimSrc];

  if (!entry) {
    problems.push(`[${name}] shim absent du manifest : « ${shimSrc} » (shim supprimé ?)`);
    continue;
  }
  // Face A — bien lazy.
  if (!entry.isDynamicEntry) {
    problems.push(`[${name}] « ${shimSrc} » n'est PAS un dynamicEntry → chargé eagerly.`);
  }
  if (!dynamicTargets.has(shimSrc)) {
    problems.push(`[${name}] « ${shimSrc} » n'est la cible d'aucun dynamicImport (mort/non monté ?).`);
  }
  // Le build client et le build serveur ont des hash distincts : on retrouve
  // le chunk client par préfixe de `name` (ex. `crm.lazy-*.js`), pas par le
  // nom exact du fichier serveur.
  const prefix = `${entry.name}-`;
  const hasClientChunk = [...clientAssets].some((f) => f.startsWith(prefix) && f.endsWith('.js'));
  if (!hasClientChunk) {
    problems.push(`[${name}] chunk client manquant : aucun « ${prefix}*.js » dans ${config.clientAssetsDir} (module non bundlé côté client ?).`);
  }
  // Face B — pas eager.
  if (eager.has(shimSrc)) {
    problems.push(`[${name}] « ${shimSrc} » est atteint via les imports STATIQUES de l'entry → fuite dans le bundle initial.`);
  }
}

if (problems.length > 0) {
  fail(`code-split rompu :\n   - ${problems.join('\n   - ')}`);
}

console.log(
  `✅ code-split OK — ${modules.length} module(s) lazy & hors bundle initial : ${modules
    .map((m) => m.name)
    .join(', ')}`,
);
