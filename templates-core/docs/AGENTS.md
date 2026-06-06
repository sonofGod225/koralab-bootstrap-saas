---
title: __PROJECT_NAME__ — Instructions pour les AI agents (Claude Code, Codex, Copilot, autres)
version: 1.0
date: 2026-05-14
audience: AI coding agents
references:
  - ./__PROJECT_NAME__-PRD-v2.0-Africa.md
  - ./DESIGN_SYSTEM.md
  - ./IMPLEMENTATION_PROCESS.md
  - ../_bmad-output/planning-artifacts/architecture.md
---

# 🤖 __PROJECT_NAME__ — Guide AI Agents

> **AI agents : LIRE CE FICHIER EN PREMIER avant toute contribution au codebase.** Ce document est le **point d'entrée canonique** vers les sources de vérité du projet.

## 🎯 Mission __PROJECT_NAME__ (en 1 phrase)

> **__PROJECT_NAME__ est une suite complète de gestion d'entreprise SaaS B2B mobile-first pour les TPE et PME d'Afrique francophone**, démarrant par un trio commercial intégré (CRM + Facturation SYSCOHADA + Encaissements Mobile Money), construite par un solo founder + assistants IA en stack TanStack Start + Hono + Cloudflare Workers + Drizzle + Neon Postgres.

## 📚 Documents canoniques (lire dans cet ordre)

### Niveau 1 — Vision produit & exigences

1. **[`__PROJECT_NAME__-PRD-v2.0-Africa.md`](./__PROJECT_NAME__-PRD-v2.0-Africa.md)** (PRD v2.3) — vision, personas, scope MVP, NFRs, conformité, modules
2. **[`__PROJECT_NAME__-PRD-v2.0-Africa-validation-report.md`](./__PROJECT_NAME__-PRD-v2.0-Africa-validation-report.md)** — décisions actées (Lot 1, révisions v2.1/v2.2/v2.3)

### Niveau 2 — Architecture technique

3. **[`_bmad-output/planning-artifacts/architecture.md`](../_bmad-output/planning-artifacts/architecture.md)** (~2400 lignes) — décisions techniques, patterns d'implémentation, structure projet, frontières
4. **[`__PROJECT_NAME__-Architecture-v2.0-extracted.md`](./__PROJECT_NAME__-Architecture-v2.0-extracted.md)** — extrait architecture pré-création (référence)

### Niveau 3 — Design & UI

5. **[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)** — point d'entrée design system Base et Brand v3.0
6. **[`design-system/project/README.md`](./design-system/project/README.md)** — spec exhaustive (brand pillars, content fundamentals, visual foundations, iconography)
7. **[`design-system/project/SKILL.md`](./design-system/project/SKILL.md)** — non-négociables résumés
8. **[`design-system/project/tokens/__PROJECT_SLUG__-tokens.css`](./design-system/project/tokens/__PROJECT_SLUG__-tokens.css)** — Tailwind v4 `@theme` block (source of truth tokens)

### Niveau 4 — Processus d'implémentation

9. **[`IMPLEMENTATION_PROCESS.md`](./IMPLEMENTATION_PROCESS.md)** — cycle d'implémentation __PROJECT_NAME__ (CS → VS → UD-EPIC → DS → CR)
10. **[`ui-designs/README.md`](./ui-designs/README.md)** — index des bundles UI Design par épic
11. **[`ui-designs/epic-<current>/`](./ui-designs/)** — bundle UI Design de l'épic en cours

### Niveau 5 — Décisions architecturales

12. **`docs/adrs/`** (à créer Phase 0) — Architecture Decision Records pour toute déviation des patterns documentés

## 🚨 Règles non-négociables __PROJECT_NAME__

### A. Patterns de code (depuis architecture.md step 5)

1. **Naming** : DB `snake_case` pluriel ; code `camelCase` ; fichiers `kebab-case.ts` ; composants `PascalCase.tsx` ; types `PascalCase` ; constantes `SCREAMING_SNAKE_CASE` ; events `entity.action` (snake)
2. **Type discipline** : `strict: true`, JAMAIS `any` (utiliser `unknown`), branded IDs (`InvoiceId`, `OrganizationId`), discriminated unions pour états
3. **Money** : TOUJOURS via `Dinero.js v2`, JAMAIS `number` ou `string` pour valeurs monétaires. Stockage BDD : `BigInt`
4. **Multi-tenancy** : TOUTE requête Drizzle inclut `where(eq(table.organization_id, ctx.org.id))` — vérifié par middleware + RLS PostgreSQL
5. **Tests co-localisés** : `*.test.ts` à côté du fichier, jamais `__tests__/` séparé
6. **Imports stricts par package** : voir `architecture.md` Frontière 2 — règles d'import par package
7. **EventBus typé** : pas d'appels directs cross-modules ; tout passe par `packages/events`
8. **Audit log** : entités auditables (`invoice`, `payment`, `customer`, `rbac_assignment`, `kyc_status`, `organization`) MUST émettre audit log via middleware tRPC `audit`
9. **Codes erreur métier** : `BUDI_ERR_*` typés dans `packages/types/src/errors.ts`
10. **Hono middleware order** : `logger` → `secureHeaders` → `cors` → `auth-routes` → `webhooks` → `rateLimit` → `auth` → `tenant` → `audit` → `tRPC`

### B. Design system (depuis design-system/project/README.md)

1. **Sentence case partout.** JAMAIS `ALL CAPS`, JAMAIS `Title Case On Sentences`
2. **Brand 400 ≤ 15% de toute surface.** Signature, pas remplissage
3. **Italic Fraunces en Brand 600 — max 2 par page.** Réservé moments éditoriaux
4. **Pill buttons (radius 100px)** — JAMAIS sharp corners
5. **Card radii 16-20px, input radii 12px** — JAMAIS 0 ni 4px
6. **No emoji** dans UI. Status via dots colorés + badges + copy
7. **No corporate jargon** : bannis `solutions`, `synergies`, `disruption`, `révolutionnaire`, `innovant`, `game-changer`, `best-in-class`, `cutting-edge`, `écosystème`, `transformation digitale`
8. **Currency** : `145 000 FCFA` (thin space, jamais `FCFA 145 000`)
9. **Invoice numbers** : JetBrains Mono `text-sm` : `FAC-2026-0142`
10. **Tabular numerals** obligatoires dans tables et dashboards
11. **Dates long form** : `12 mai 2026`. Court UI tight : `12/05`
12. **Skeleton screens** en Base 100 (JAMAIS spinners, JAMAIS progress dots)
13. **Lucide icons stroke 1.5px**, rounded caps. Color follows text
14. **Sidebars 240-280px**, jamais 320px

### C. Design system — règles d'enforcement (`@__SCOPE__/ui`)

> **Doc de référence** : [`packages/ui/README.md`](../packages/ui/README.md) — tokens, inventaire complet des primitives, exemples d'usage. ADRs : [0007](./adrs/0007-shadcn-monorepo-mode.md) (monorepo) + [0010](./adrs/0010-design-system-__PROJECT_SLUG__-ui.md) (contrat de consommation).

1. **Importer, JAMAIS ré-implémenter.** Toute UI d'app vient de `@__SCOPE__/ui`. `pnpm ui:check` audite les apps contre les duplications.
2. **Imports per-component** : TOUJOURS `import { Button } from "@__SCOPE__/ui/button"` (tree-shaking). Le barrel `@__SCOPE__/ui` est réservé aux tests/specimen.
3. **JAMAIS de dossier `apps/*/src/components/ui/`** — les primitives vivent exclusivement dans `packages/ui` (banni par `ui:check`).
4. **Pour ajouter un composant shadcn** : `pnpm dlx shadcn@latest add <component>` → s'installe dans `packages/ui/src/components/` via `packages/ui/components.json`. Ajouter le sous-chemin dans `packages/ui/package.json` › `exports` + le barrel `src/index.ts`.
5. **NE JAMAIS** modifier un composant shadcn copié sans ADR documentée. Pour étendre, créer un wrapper dans `packages/ui/src/primitives/`.
6. **i18n des primitives** : toute chaîne affichée passe par `@__SCOPE__/ui/i18n` (`useUIMessages()` / `<UILocaleProvider>`). JAMAIS de libellé hardcodé dans une primitive.

### D. UI Design workflow (depuis IMPLEMENTATION_PROCESS.md)

1. **Avant d'implémenter un écran** : lire le HTML/CSS dans `docs/ui-designs/epic-<current>/project/screens/<screen>.html`
2. **NE PAS render** le prototype HTML dans un browser pour screenshot — lire le source directement
3. **Recreer pixel-perfect** mais ne pas copier la structure interne HTML du prototype
4. **Utiliser** `@__SCOPE__/ui/*` (shadcn + primitives __PROJECT_NAME__) plutôt que recoder
5. **Implémenter les états** : empty, loading skeleton, error, success, edge cases (montant 0, longs textes)

### E. Sécurité et compliance

1. **TLS 1.3** obligatoire toutes communications
2. **Argon2id** pour password hashing (OWASP 2024)
3. **Chiffrement at-rest** sur entités sensibles (KYC, IBAN, audit, **clés API FNE**)
4. **Isolation cross-tenant triple couche** : middleware + Drizzle scope + RLS PostgreSQL
5. **PII redaction logs** : helper `redact(obj, ['email', 'phone', 'ninea', 'iban'])` partout
6. **Webhook idempotency** : vérifier `webhook_events` table avant traitement
7. **Audit OHADA 10 ans** : conservation `audit_log`, `conflict_log` (si réintroduit), `fne_audit_log`, `consent_log`
8. **FNE Côte d'Ivoire** : certification asynchrone via Workers Queue, retry exp 5x, idempotency check, sticker monitoring

### F. Git / Code review

1. **Conventional Commits** : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`
2. **Branches** : `feat/AAAAMMDD-short-description`, `fix/AAAAMMDD-bug-id`
3. **PRs** : template `What / Why / Test plan / Breaking changes / AI-assisted?`
4. **Co-Authored-By** : `Claude Code` / `Codex` dans footer commits IA-générés
5. **Critères review IA-générée** : pattern compliance, type-safety, tests présents, sécurité (no secrets, no SQL injection, no XSS)

## 🛠️ Workflow implémentation typique

```
1. [VS] Story validée par SM → status = ready for dev
   ↓
2. Lire la story dans _bmad-output/implementation-artifacts/
   ├─ Extraire l'epic concerné
   ├─ Extraire "UI Design Reference" si présent
   └─ Extraire les Acceptance Criteria
   ↓
3. Lire docs/AGENTS.md (ce fichier) — déjà fait si tu lis ceci
   ↓
4. Lire docs/ui-designs/epic-<id>/project/screens/<screen>.html
   (lire le source HTML directement, pas screenshot)
   ↓
5. Lire architecture.md section pertinente (patterns, structure)
   ↓
6. Implémenter en React/TS avec @__SCOPE__/ui :
   ├─ Composants shadcn + primitives __PROJECT_NAME__ (MoneyDisplay, KPI, EditorialQuote, etc.)
   ├─ Tokens Tailwind Base et Brand
   ├─ tRPC procedures dans packages/rpc/src/routers/<module>.ts
   ├─ Business logic dans packages/<module>/
   └─ Schemas Drizzle dans packages/db/src/schemas/<module>.ts
   ↓
7. Tests co-localisés *.test.ts
   ↓
8. Commit Conventional + Co-Authored-By
   ↓
9. [CR] Code Review : pattern compliance + visual match + tests
   ↓
10. Si OK → merge ; sinon → retour DS
```

## 📋 Checklist avant de commit

- [ ] Patterns __PROJECT_NAME__ respectés (naming, types, money via Dinero, multi-tenant, etc.)
- [ ] Design system Base et Brand respecté (sentence case, Brand ≤ 15%, pill buttons, etc.)
- [ ] Composants depuis `@__SCOPE__/ui/*` (pas de recoding)
- [ ] Tests `*.test.ts` co-localisés, > 80% couverture sur sync/paiements/auth
- [ ] Pas de `any` TypeScript, pas de `console.log` oublié
- [ ] Pas de secret/clé hardcoded
- [ ] Pas de PII non-redacted dans logs
- [ ] Si nouvelle décision archi → ADR créée dans `docs/adrs/`
- [ ] Visual match avec `docs/ui-designs/epic-<id>/project/screens/<screen>.html`
- [ ] Responsive 360px / 768px / 1280px testé
- [ ] WCAG 2.1 AA respecté (labels forms, contraste, focus visible)
- [ ] Commit Conventional + Co-Authored-By

## ❓ Que faire si une règle est ambiguë ?

1. Cherche d'abord dans `architecture.md` section pertinente
2. Puis dans `design-system/project/README.md`
3. Puis dans le PRD section pertinente
4. Si vraiment ambigu : crée une ADR dans `docs/adrs/ADR-XXX-<topic>.md` documentant ton choix
5. **NE JAMAIS deviner silencieusement** : laisse une trace pour le futur

## 🆘 Que faire en cas de blocage ?

- Pattern non documenté → ADR + flag dans le PR
- Composant manquant → créer dans `packages/ui/src/primitives/` (avec ADR si majeur)
- Conflit décision Lot 1 → re-lire validation report, identifier la dernière révision (v2.3) qui fait foi
- Décision design absente → contacter Marius via PR, ne pas inventer
- Outils manquants → vérifier `package.json` racine et installer via pnpm
