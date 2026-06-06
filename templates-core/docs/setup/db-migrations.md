# Migrations DB — staging & production

Procédure pour appliquer les migrations Drizzle sur **staging** et **production**
(Neon Postgres). Les migrations vivent dans `packages/db/migrations/` et sont
suivies dans la table `drizzle.__drizzle_migrations` de chaque base.

> ## ✅ Automatisé en CI (par défaut)
>
> Les migrations sont appliquées **automatiquement au déploiement** par un job
> `migrate` placé **avant** le déploiement du code :
>
> - **Staging** : `.github/workflows/deploy-staging.yml` → `migrate` → `deploy-api` → suite/admin (à chaque merge sur `main`).
> - **Production** : `.github/workflows/deploy-production.yml` → `validate-tag` → `migrate` → `deploy-api` → suite/admin (sur release / `workflow_dispatch`).
>
> Le job lance `pnpm --filter @__SCOPE__/db db:migrate` puis `db:seed:status`
> (idempotent), avec `DATABASE_URL` issu du **secret d'environnement GitHub**
> (`staging` / `production`). **Pré-requis** : définir le secret `DATABASE_URL`
> dans chaque _GitHub Environment_ (Settings → Environments) ; protéger
> `production` par une _required reviewer_ recommandée.
>
> La procédure manuelle ci-dessous reste valable pour un **backfill ponctuel**,
> un **hotfix**, ou si le secret CI n'est pas encore configuré.

> **Migrations en attente actuellement** (après Epics 24/25) :
>
> - `0011_tiresome_callisto` — rôle staff (`user.role/banned/ban_reason/ban_expires`, `session.impersonated_by`)
> - `0012_glorious_rocket_raccoon` — statut système (`service_components`, `health_check_runs`, `system_incidents`, `incident_updates`, `maintenance_windows`, `job_runs`)
>
> Les deux sont **additives** (ajout de colonnes nullable/à défaut + nouvelles
> tables) — aucune perte de données, aucune réécriture de table existante.

## 1. Pré-requis (une fois par poste)

```bash
# Copier les modèles puis renseigner la vraie DATABASE_URL Neon (pooled).
cp packages/db/.env.staging.example     packages/db/.env.staging
cp packages/db/.env.production.example  packages/db/.env.production
# Éditer chaque fichier. Ces .env.* sont gitignored — ne jamais committer.
```

URL Neon : dashboard Neon (projet staging/prod, connection string _pooled_, role
applicatif). Doit finir par `?sslmode=require`.

## 2. Sauvegarde / point de restauration (PRODUCTION surtout)

Avant d'appliquer en production :

- Vérifier que les **backups quotidiens** Neon sont actifs (rétention 30 j — NFR44)
  et que le **PITR 7 j** est disponible (NFR45). Neon permet un _restore branch_
  / point-in-time si besoin de rollback.
- Idéalement créer une **branche Neon** de la prod juste avant (snapshot logique)
  pour rollback instantané.

## 3. Vérifier ce qui est en attente

```bash
# Compte des migrations déjà appliquées sur la cible vs nb de fichiers locaux.
DOTENV_CONFIG_PATH=.env.staging node -e "require('dotenv/config'); \
  const {neon}=require('@neondatabase/serverless'); \
  neon(process.env.DATABASE_URL)\`select count(*)::int n from drizzle.__drizzle_migrations\`.then(r=>console.log('applied:',r[0].n))"
ls packages/db/migrations/*.sql | wc -l   # nb de fichiers
```

## 4. Appliquer — staging d'abord

```bash
pnpm --filter @__SCOPE__/db db:migrate:staging
```

Vérifier le schéma (SQL editor Neon staging, ou un `select` rapide) :

```sql
select to_regclass('public.service_components') sc,
       to_regclass('public.job_runs') jr,
       (select count(*) from information_schema.columns where table_name='user' and column_name='role') user_role;
```

Smoke test staging : `GET https://api.staging.__PROJECT_SLUG__.com/health/full` (200),
connexion back-office, page `https://status.staging.__PROJECT_SLUG__.com` (si routée).

## 5. Appliquer — production (après validation staging)

```bash
pnpm --filter @__SCOPE__/db db:migrate:production
```

Même vérification schéma sur la base prod.

## 6. Seeds par environnement

Le **registre des composants** (`service_components`, Epic 25) et les
catalogues (rbac/plans) doivent exister sur chaque base :

```bash
pnpm --filter @__SCOPE__/db db:seed:staging      # rbac + plans + status (idempotent)
pnpm --filter @__SCOPE__/db db:seed:production
```

Promouvoir un compte **staff** (back-office) sur chaque env — l'utilisateur doit
d'abord s'être inscrit sur l'app de l'env :

```bash
DOTENV_CONFIG_PATH=.env.staging    BUDISUITE_STAFF_EMAIL=ops@__PROJECT_SLUG__.com pnpm --filter @__SCOPE__/db db:seed:staff
DOTENV_CONFIG_PATH=.env.production BUDISUITE_STAFF_EMAIL=ops@__PROJECT_SLUG__.com pnpm --filter @__SCOPE__/db db:seed:staff
```

## 7. Secrets applicatifs liés (optionnels, Epic 24/25)

Si non encore définis sur l'env (sinon dégradation gracieuse) :

```bash
wrangler secret put ADMIN_IP_WHITELIST  --env staging   # ex: "1.2.3.4,5.6.7.8" (back-office)
wrangler secret put ALERTS_EMAIL        --env staging    # destinataire alertes ops (Story 25.16)
wrangler secret put SENTRY_AUTH_TOKEN   --env staging    # panneau observabilité (sinon "indisponible")
wrangler secret put SENTRY_ORG_SLUG     --env staging
wrangler secret put SENTRY_PROJECT_SLUG --env staging
# (idem --env production)
```

Le cron `status-probe` (`*/5 * * * *`) est déclaré dans `apps/api/wrangler.toml`
`[triggers]` — il s'active automatiquement au prochain `wrangler deploy`.

## 8. Rollback

Migrations additives → risque faible. En cas de problème :

- Restaurer via **PITR Neon** ou la branche snapshot créée à l'étape 2.
- Drizzle ne fournit pas de `down` automatique ; pour annuler manuellement, `DROP`
  les nouvelles tables / `ALTER TABLE … DROP COLUMN` (les colonnes étant nullable,
  l'app tolère leur absence uniquement si le code est aussi rollback).

## Notes

- Le mécanisme `DOTENV_CONFIG_PATH=.env.<env>` repose sur `import 'dotenv/config'`
  (déjà présent dans `drizzle.config.ts` et les scripts de seed).
- Toujours appliquer **staging → vérifier → production**.
- Ne jamais utiliser `db:push` en staging/prod (sync sans migration — dev only).
