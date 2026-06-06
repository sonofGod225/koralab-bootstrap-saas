# __PROJECT_NAME__ — Business Digital Suite for Africa

> **Suite SaaS modulaire de gestion d'entreprise** pour TPE et PME d'Afrique francophone.
> Encaissez vos factures plus vite. Conçu pour le Sénégal et la Côte d'Ivoire.

---

## Pitch

__PROJECT_NAME__ est un SaaS B2B mobile-first qui regroupe **CRM + Facturation SYSCOHADA + Encaissements Mobile Money** dans un seul outil pensé pour le marché ouest-africain :

- **Wave Business**, **Paystack**, **Stripe**, **Flutterwave** intégrés en mode facilitator (pas d'agrément BCEAO requis)
- **FNE Côte d'Ivoire** (Facture Normalisée Électronique) certifiée auto via API DGI, asynchrone via Cloudflare Workers Queues
- **Multi-tenancy** triple couche (middleware Hono + Drizzle scope + RLS Postgres)
- **i18n** FR-FR / FR-AF / EN / WO (Paraglide JS)
- **Design system** propre — Base & Brand v3.0 (Fraunces éditorial, palette sahélienne, sentence case partout)
- **Onboarding 8 étapes** + onboarding par module

7 modules **post-MVP** prévus : Comptabilité SYSCOHADA, Achats, Inventaire, RH+Paie, POS mobile, Helpdesk, Immobilisations.

📖 **Documentation complète** :

- PRD v2.3 → [`docs/__PROJECT_NAME__-PRD-v2.0-Africa.md`](./docs/__PROJECT_NAME__-PRD-v2.0-Africa.md)
- Architecture → [`_bmad-output/planning-artifacts/architecture.md`](./_bmad-output/planning-artifacts/architecture.md)
- Epics & Stories → [`_bmad-output/planning-artifacts/epics.md`](./_bmad-output/planning-artifacts/epics.md)
- ADRs (9 décisions actées) → [`docs/adrs/`](./docs/adrs/)

---

## Stack technique

| Couche            | Tech                                                                          | ADR                                                                     |
| ----------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Frontend**      | TanStack Start v1 (SSR) + Vite 8 + Tailwind v4                                | [0002](./docs/adrs/0002-compute-hono-2-workers.md)                      |
| **Backend**       | Hono + tRPC v11 (`@hono/trpc-server`)                                         | [0002](./docs/adrs/0002-compute-hono-2-workers.md)                      |
| **Compute**       | Cloudflare Workers (POPs Lagos, Nairobi, Cape Town, Casablanca, Johannesburg) | [0002](./docs/adrs/0002-compute-hono-2-workers.md)                      |
| **DB**            | Neon Postgres EU Frankfurt + Drizzle ORM (multi-schema par module)            | [0001](./docs/adrs/0001-db-hosting.md)                                  |
| **Auth**          | Better-Auth self-hosted embedded + KV cache                                   | [0003](./docs/adrs/0003-auth-better-auth-embedded.md)                   |
| **Money**         | Dinero.js v2 + BigInt + custom currency FCFA (OHADA 0 décimale)               | [0004](./docs/adrs/0004-money-dinero-bigint.md)                         |
| **IA**            | Anthropic Claude (primary) + OpenAI (fallback) — OCR + Assistant relances     | [0005](./docs/adrs/0005-ai-multi-provider-anthropic-fallback-openai.md) |
| **FNE CI**        | Workers Queue async + retry 5× + sticker monitor                              | [0006](./docs/adrs/0006-fne-ci-async-workers-queue.md)                  |
| **Design system** | shadcn/ui monorepo mode + Fraunces self-hosted                                | [0007](./docs/adrs/0007-shadcn-monorepo-mode.md)                        |

---

## Getting started

### Prérequis

- Node.js 20.18.1+ (`.nvmrc`)
- pnpm 10.33.2+
- Compte Neon (DB) — pour `pnpm dev`
- Compte Cloudflare (déploiement) — optionnel pour dev local

### Setup

```bash
# Installer les deps
pnpm install

# Configurer les secrets locaux (apps/api)
cp .env.example apps/api/.dev.vars
# Éditer apps/api/.dev.vars avec DATABASE_URL Neon

# Idem pour les migrations Drizzle
cp .env.example packages/db/.env

# Lancer les migrations DB
pnpm --filter @__SCOPE__/db db:migrate

# Démarrer les 3 apps en dev
pnpm dev
```

### Commandes principales

```bash
pnpm typecheck       # tsc --noEmit sur tous les packages
pnpm lint            # ESLint sur tous les packages
pnpm format          # Prettier --write
pnpm format:check    # Prettier --check (CI)
pnpm test            # Vitest run sur les packages testables

pnpm --filter @__SCOPE__/suite dev      # apps/suite seul (port 9100)
pnpm --filter @__SCOPE__/admin dev      # apps/admin seul (port 9101)
pnpm --filter @__SCOPE__/api dev        # apps/api seul (port 9187)

pnpm --filter @__SCOPE__/db db:generate # Génère une migration Drizzle
pnpm --filter @__SCOPE__/db db:migrate  # Applique les migrations
pnpm --filter @__SCOPE__/db db:studio   # UI Drizzle Studio
```

---

## Structure monorepo

```
__PROJECT_SLUG__/
├── apps/
│   ├── suite/       # SaaS clients (TPE/PME) — TanStack Start SSR
│   ├── admin/       # Backoffice équipe __PROJECT_NAME__ — TanStack Start SSR
│   └── api/         # Backend Hono + tRPC + queues + cron
├── packages/
│   ├── config/      # tsconfig + eslint + prettier partagés
│   ├── ui/          # Design system Base & Brand (tokens + shadcn Epic 2)
│   ├── types/       # Branded IDs + Money + AppError
│   ├── db/          # Drizzle ORM + Neon driver + schemas (1/module)
│   ├── rpc/         # tRPC server + middleware (auth, audit, rate-limit)
│   ├── events/      # Event bus typé (pub/sub via Workers Queues)
│   └── notifications/ # Channel stubs (Email/WhatsApp/SMS/Push)
├── docs/
│   ├── adrs/        # 9 décisions architecture actées
│   ├── design-system/ # Source design Base & Brand v3.0
│   ├── setup/       # Checklists ops (Cloudflare, Neon EU)
│   └── ui-designs/  # Designs Claude Code Design par Epic
├── _bmad-output/
│   └── planning-artifacts/  # PRD validation, architecture, epics
└── .github/
    └── workflows/   # CI + deploy staging/production + security scan
```

---

## État du projet

**Phase 0 — Foundations (Epic 1)** : 17/17 stories livrées

**🚀 Live URLs** :

- Production : <https://app.__PROJECT_SLUG__.com> · <https://api.__PROJECT_SLUG__.com> · <https://admin.__PROJECT_SLUG__.com>
- Staging : <https://staging.__PROJECT_SLUG__.com> · <https://api.staging.__PROJECT_SLUG__.com> · <https://admin.staging.__PROJECT_SLUG__.com>

- ✅ 1.1 Bootstrap monorepo
- ✅ 1.2 apps/api Hono Worker
- ✅ 1.3 Neon Postgres + Drizzle
- ✅ 1.4 Cloudflare deploy (6 Workers + custom domains live, root domain pending)
- ✅ 1.5 GitHub Actions CI/CD (3 workflows verts)
- ✅ 1.6 Observabilité — Sentry + Axiom + PostHog (Cloudflare Logpush en dette ops)
- ✅ 1.7 Design system fontes Fraunces self-hosted
- ✅ 1.8 shadcn/ui monorepo + 5 primitives custom
- ✅ 1.9 i18n Paraglide (stub maison, structure v2-compat)
- ✅ 1.10 Manifest PWA + icons brand
- ✅ 1.11 ADRs (9 créés)
- ✅ 1.12 packages/rpc tRPC squelette
- ✅ 1.13 packages/events bus
- ✅ 1.14 packages/notifications shell
- ✅ 1.15 audit middleware + audit_log
- ✅ 1.16 rate-limit Upstash
- ✅ 1.17 Versioning automatique (semantic-release + Conventional Commits)

**Epics suivants** : Epic 2 Design System → Epic 3 Identity → Epic 4 Billing → ... → Epic 16 Beta Launch.

---

## Workflow BMad

Ce projet utilise le framework **BMad** (Brain-Manuel agile dev) pour la planification et l'implémentation. Cycle adapté :

```
CS (Concept Story) → VS (Validation Story) → [UD-EPIC] Claude Code Design → DS (Dev Story) → CR (Code Review)
```

Voir [`docs/IMPLEMENTATION_PROCESS.md`](./docs/IMPLEMENTATION_PROCESS.md) pour le détail + [`docs/AGENTS.md`](./docs/AGENTS.md) pour les conventions IA agents (Claude Code, Cursor, Copilot).

---

## Licence

UNLICENSED — propriété privée __PROJECT_SLUG__-africa.

## Auteur

Marius (you@example.com) — fondateur solo + équipe IA.
