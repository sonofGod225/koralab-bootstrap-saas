# create-koralab-saas

> 🇬🇧 **English version: [README.md](README.md)**

Génère un monorepo SaaS Turborepo (pnpm + Turbo + package de config partagé + frontières de
modules ESLint + TanStack Start SSR + API Hono + tRPC + Drizzle + Better-Auth sur Cloudflare
Workers). Disponible comme **CLI** **et** comme **skill Claude Code** — les deux partagent le
même moteur.

## Prérequis
- Node ≥ 20, pnpm ≥ 10.

## Démarrage rapide (CLI)
```bash
npm create koralab-saas@latest mon-app          # interactif
# ou non-interactif :
node bin/cli.mjs mon-app --scope acme --variant core --yes
```
Vérifier n'importe quel projet généré : `pnpm install && pnpm typecheck && pnpm build`
(`pnpm --filter @<scope>/suite test:bundle` vérifie que chaque module est bien code-split).

## Deux variantes
- **`core`** (par défaut) — un boilerplate générique **qui compile** (build-green), bundlé dans
  le package : toute l'infra câblée (config, db, ui, rpc, auth, rbac, events, notifications) +
  **un** vertical produit `module-example` (écran UI + shim lazy + permissions + router tRPC +
  schéma db + route REST). Aucune logique métier. C'est ce que `npm create` livre.
- **`full`** — un **clone fidèle** d'un monorepo source **privé** que tu indiques via `--source`.
  Le CLI le snapshote au runtime (tokenise + purge des secrets) et matérialise une copie renommée.
  Rien de propriétaire n'est bundlé dans ce package.

## Définir le design system à l'initialisation (variante core)
Le CLI te laisse choisir le design system ; **sans option, le défaut reproduit l'apparence d'origine
à l'identique**. Les palettes sont génériques : `base` (neutre/primaire), `brand` (accent),
`success`, `danger`, `warning`.
```bash
# un preset curé :
node bin/cli.mjs mon-app --variant core --theme zinc-violet --yes
# couleurs custom → échelles OKLCH complètes (25→950) générées pour toi :
node bin/cli.mjs mon-app --variant core --primary '#334155' --accent '#3b82f6' \
  --radius rounded --font inter --mode dark --yes
```
Options (toutes optionnelles) : `--theme <preset>` · `--primary/--accent/--success/--danger/--warning <hex>`
· `--font fraunces|inter|geist|system` · `--radius sharp|default|rounded` · `--mode system|light|dark`.
Appliqué par `scripts/design.mjs` (conversion OKLCH→sRGB, zéro dépendance) + `scripts/apply-theme.mjs` :
réécrit `packages/ui/src/styles/tokens.css` (palettes + sémantique `--bs-*` clair/sombre + radius +
polices), échange le `<link>` Google Fonts, pose le mode par défaut, et recolore logo/favicon/manifest.
Presets : `terre-soleil` (défaut), `slate-blue`, `zinc-violet`, `stone-emerald`.

### Importer un design system depuis un bundle Claude Design
Donne une URL Claude Design et le projet généré adopte ce design system (couleurs, polices, radius,
logos). L'endpoint renvoie un `tar.gz` de tout le projet de design.
```bash
node bin/cli.mjs mon-app --variant core --design-url https://api.anthropic.com/v1/design/h/<hash> --yes
# ou pas à pas (= aussi le chemin agent) :
node scripts/fetch-design.mjs <url> /tmp/kb > /tmp/kb/manifest.json   # download + untar + manifest
node scripts/extract-theme.mjs /tmp/kb/manifest.json > /tmp/kb/spec.json   # mapping heuristique → spec
node scripts/generate.mjs --variant core --name mon-app --design-dir /tmp/kb --out ./mon-app
```
Importé : couleurs sémantiques exactes → `--bs-*`, échelles utilitaires générées (seeds), couleurs
éditoriales étendues + dégradés, les polices self-hostées du bundle (`.ttf`), et logos/favicon de marque.
Le mappeur heuristique journalise ses décisions ; pour des noms de tokens inhabituels, laisse l'agent
affiner le spec (voir `SKILL.md`).

> ⚠️ Les URLs de bundle Claude Design sont **éphémères** — récupère-les vite. Une fois téléchargé,
> travaille depuis le dossier extrait (`--design-dir`) ou un spec sauvegardé (`--spec`), qui n'expirent pas.

### Re-thémer un projet existant (après génération)
Le theming ne se limite pas à l'init — re-thème un projet `core` déjà généré, sur place :
```bash
# depuis le projet (script livré dans les projets générés) :
pnpm theme -- --theme stone-emerald
pnpm theme -- --design-url https://api.anthropic.com/v1/design/h/<hash>
# ou directement :
node bin/cli.mjs theme --out ./mon-app --primary '#334155' --accent '#3b82f6' --mode dark --yes
node scripts/retheme.mjs ./mon-app --theme zinc-violet
```
`retheme.mjs` re-déduit l'identité du projet (scope/nom/display) depuis le repo, reconstruit le spec
de thème (mêmes options + import design) et relance `apply-theme` (réécrit `tokens.css`, copie
polices/logos, recolore le manifest). Un garde-fou empêche d'écraser un `tokens.css` non généré
(variante `full` / édité à la main) sauf `--yes`. Le script `pnpm theme` délègue à
`npx create-koralab-saas@latest theme` → pleinement opérationnel **une fois le package publié sur npm**.

## Arborescence
```
bin/cli.mjs                  # le CLI (interactif + flags), orchestre les scripts
SKILL.md                     # déclencheur + orchestration (lu par Claude)
scripts/snapshot.mjs         # maintenance : tokenise un repo source → templates
scripts/generate.mjs         # runtime : matérialise un projet (--variant core|full + theme)
scripts/design.mjs           # générateur de thème : échelles OKLCH + presets + rendu tokens.css
scripts/apply-theme.mjs      # applique un thème à un projet core (tokens/logo/polices/mode)
scripts/fetch-design.mjs     # download + untar d'un bundle Claude Design → manifest JSON
scripts/extract-theme.mjs    # heuristique : tokens d'un bundle → spec de thème
scripts/theme-resolve.mjs    # partagé : options (+ import design) → spec de thème résolu
scripts/retheme.mjs          # re-thème un projet généré existant, sur place
templates-core/              # boilerplate générique COMMITÉ build-green (bundlé dans npm)
templates/                   # gitignoré : copie fidèle tokenisée d'un repo source privé
overrides-slim/              # overrides --slim de la variante full (un seul module-example)
reference/architecture.md    # conventions à préserver
reference/stack-variants.md  # recettes pour les choix de stack non-défaut
```

## Maintenance — rafraîchir les templates (variante full)
`templates/` n'est **pas commité** (c'est un snapshot tokenisé d'un repo possiblement propriétaire).
À régénérer depuis ton monorepo de référence :
```bash
cp snapshot.local.example.json snapshot.local.json   # puis édite : slug/scope/display + secrets à scrubber
node scripts/snapshot.mjs --source /chemin/vers/ton-repo
grep -rIE "<ton-slug>|<tes-secrets>" templates/        # doit être vide avant partage
```
`snapshot.local.json` (tes identifiants réels + secrets à scrubber) est gitignoré.

## Comment ça marche
`snapshot.mjs` copie le repo source dans `templates/` en sautant les fichiers générés/lourds/secrets
et remplace les identifiants par des tokens (`@__SCOPE__/`, `__PROJECT_NAME__`, `__PROJECT_SLUG__`).
`generate.mjs` inverse la substitution vers un nom/scope/domaine choisi. Comme les templates sont du
vrai code interconnecté, la sortie par défaut compile telle quelle. Les axes de stack non-défaut
(Next.js, hébergement Node, node-postgres) sont appliqués via des recettes guidées après génération
(voir `reference/stack-variants.md`).

## Publication npm
`npm publish` n'est pas effectué automatiquement (license MIT à confirmer). Une fois publié :
`npm create koralab-saas@latest` et `pnpm theme` deviennent pleinement opérationnels.
