# Tests e2e (Playwright) — `apps/suite`

Socle e2e posé en consolidation pré-Epic 8. Cible : verrouiller bout-en-bout
les flux critiques, à commencer par le **garde-fou d'isolation cross-établissement**
(ADR 0013, « non négociable »).

## Lancer en local

```bash
# 1. Installer le navigateur (une fois)
pnpm --filter @__SCOPE__/suite exec playwright install chromium

# 2a. Laisser Playwright démarrer le front suite (par défaut)
pnpm --filter @__SCOPE__/suite test:e2e

# 2b. …ou réutiliser un stack déjà lancé (pnpm dev) :
E2E_NO_SERVER=1 pnpm --filter @__SCOPE__/suite test:e2e
```

Variables :

- `E2E_BASE_URL` — URL du front (défaut `http://localhost:9100`).
- `E2E_NO_SERVER=1` — ne pas démarrer de serveur (réutiliser `pnpm dev`).

## État des specs

| Spec                              | État        | Dépendances                                                |
| --------------------------------- | ----------- | ---------------------------------------------------------- |
| `smoke.spec.ts`                   | ✅ runnable | front suite seul (route publique `/signin`, pas de DB)     |
| `establishment-isolation.spec.ts` | 🚧 `fixme`  | DB de test + seed + login programmatique (voir ci-dessous) |

La **logique** d'isolation est déjà couverte en tests unitaires
(`packages/rpc/src/__tests__/contacts-visibility.test.ts`,
`require-establishment.test.ts`). Le e2e ajoute la validation bout-en-bout
(UI + tRPC + DB) une fois l'infra disponible.

## Infra requise pour activer les specs adossées aux données

1. **DB de test** : une branche Neon dédiée (jamais la dev/prod) + `DATABASE_URL`.
2. **Secrets** : `BETTER_AUTH_SECRET` (et `RESEND_FROM_EMAIL` si emails).
3. **Seed e2e idempotent** (à créer, ex. `packages/db/scripts/seed-e2e.ts`) :
   org ACME · est_1 (Plateau, primary) · est_2 (Médina) · `owner@acme.sn` ·
   contact C1 org-wide · contact C2 borné est_1.
4. **Login programmatique** Better-Auth (helper de fixture posant le cookie de
   session) — pour éviter de retaper le formulaire à chaque test.

Une fois ces 4 points en place : retirer `.fixme` de
`establishment-isolation.spec.ts` et compléter le helper de login + le seed.

## CI

Workflow manuel `.github/workflows/e2e.yml` (`workflow_dispatch`) — **gated** : il
ne tourne pas sur chaque PR pour ne pas bloquer le pipeline tant que la DB de
test et les secrets ne sont pas configurés côté repo.
