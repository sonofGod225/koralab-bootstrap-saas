# Cloudflare setup — Checklist Story 1.4

> Cette checklist guide la mise en place des **3 Workers + DNS + bindings + secrets** Cloudflare pour le MVP. Elle suppose un compte Cloudflare déjà créé (workspace par défaut OK) et un domaine `__PROJECT_SLUG__.com` configuré sur Cloudflare DNS.
>
> **Durée estimée** : 2-3h de console manuelle + 30 min `wrangler secret put` (Marius en main).
>
> **À faire à plat avant de pouvoir activer** : `.github/workflows/deploy-staging.yml` + `deploy-production.yml`.

---

## 0. Prérequis (à faire en premier)

- [ ] Compte Cloudflare actif (`dash.cloudflare.com`)
- [ ] Domaine `__PROJECT_SLUG__.com` ajouté à Cloudflare et nameservers pointant vers Cloudflare (registrar : OVH, Namecheap, etc.)
- [ ] Plan Cloudflare Workers **paid** ($5/mois) — nécessaire pour `cpu_ms = 30000` (cf. `apps/api/wrangler.toml`) et Workers Queues
- [ ] `wrangler` CLI installé localement : `npm i -g wrangler` (ou via Bun/pnpm dlx)
- [ ] `wrangler login` exécuté localement → token OAuth stocké

## 1. DNS — Zones à configurer dans Cloudflare DNS

Dans `dash.cloudflare.com → __PROJECT_SLUG__.com → DNS → Records`, créer **6 enregistrements CNAME** pointant vers les Workers (les hostnames Workers seront générés au premier deploy) :

| Type  | Nom           | Cible                                    | Proxy CF  | Notes                              |
| ----- | ------------- | ---------------------------------------- | --------- | ---------------------------------- |
| CNAME | `@` (root)    | `__PROJECT_SLUG__-suite-production.workers.dev` | ✅ orange | Landing publique apps/suite        |
| CNAME | `app`         | `__PROJECT_SLUG__-suite-production.workers.dev` | ✅ orange | Dashboard authenticated apps/suite |
| CNAME | `admin`       | `__PROJECT_SLUG__-admin-production.workers.dev` | ✅ orange | Backoffice apps/admin              |
| CNAME | `api`         | `__PROJECT_SLUG__-api-production.workers.dev`   | ✅ orange | Backend apps/api                   |
| CNAME | `staging`     | `__PROJECT_SLUG__-suite-staging.workers.dev`    | ✅ orange | Staging suite                      |
| CNAME | `api.staging` | `__PROJECT_SLUG__-api-staging.workers.dev`      | ✅ orange | Staging api                        |

> **Note** : les hostnames `.workers.dev` ne sont créés qu'après le **premier deploy** du Worker. Tu peux :
>
> 1. Soit déployer une première fois en CI (via `gh actions run deploy-staging`), récupérer les hostnames, puis créer les DNS
> 2. Soit créer les Custom Domains directement dans le dashboard Worker (recommandé — pas besoin de DNS manuel) — étape 3 ci-dessous

## 2. Workers — créer les 3 Workers via dashboard ou wrangler

### 2.1 apps/api (Worker classique)

```bash
cd apps/api
wrangler deploy --env staging      # crée __PROJECT_SLUG__-api-staging.workers.dev
wrangler deploy --env production   # crée __PROJECT_SLUG__-api-production.workers.dev
```

### 2.2 apps/suite (Worker SSR via TanStack Start)

```bash
cd apps/suite
pnpm build                          # vite build → dist/server/
wrangler deploy --env staging
wrangler deploy --env production
```

### 2.3 apps/admin (Worker SSR)

```bash
cd apps/admin
pnpm build
wrangler deploy --env staging
wrangler deploy --env production
```

## 3. Custom Domains — lier les hostnames publics aux Workers

Dans le dashboard de chaque Worker (`dash.cloudflare.com → Workers & Pages → <worker> → Custom Domains`) :

| Worker                       | Custom Domain à ajouter               |
| ---------------------------- | ------------------------------------- |
| `__PROJECT_SLUG__-suite-production` | `__PROJECT_SLUG__.com` + `app.__PROJECT_SLUG__.com` |
| `__PROJECT_SLUG__-suite-staging`    | `staging.__PROJECT_SLUG__.com`               |
| `__PROJECT_SLUG__-admin-production` | `admin.__PROJECT_SLUG__.com`                 |
| `__PROJECT_SLUG__-admin-staging`    | `admin.staging.__PROJECT_SLUG__.com`         |
| `__PROJECT_SLUG__-api-production`   | `api.__PROJECT_SLUG__.com`                   |
| `__PROJECT_SLUG__-api-staging`      | `api.staging.__PROJECT_SLUG__.com`           |

Cloudflare crée alors automatiquement les DNS records nécessaires (proxy orange, SSL Universal activé).

## 4. Bindings — créer les ressources Cloudflare + connecter à `apps/api`

### 4.1 KV Namespace (sessions cache Better-Auth — Story 3.1)

```bash
cd apps/api
wrangler kv:namespace create SESSIONS_KV --env staging
wrangler kv:namespace create SESSIONS_KV --env production
```

Récupère les `id` retournés et ajoute dans `apps/api/wrangler.toml` :

```toml
[[env.staging.kv_namespaces]]
binding = "SESSIONS_KV"
id = "..."  # ID staging

[[env.production.kv_namespaces]]
binding = "SESSIONS_KV"
id = "..."  # ID production
```

### 4.2 R2 Buckets (fichiers PDFs, logos, attachments — Epic 5/8)

```bash
wrangler r2 bucket create __PROJECT_SLUG__-files-staging
wrangler r2 bucket create __PROJECT_SLUG__-files-production
```

Ajouter au wrangler.toml :

```toml
[[env.staging.r2_buckets]]
binding = "R2"
bucket_name = "__PROJECT_SLUG__-files-staging"

[[env.production.r2_buckets]]
binding = "R2"
bucket_name = "__PROJECT_SLUG__-files-production"
```

### 4.3 Queues (jobs async — Story 1.13 events + Epic 13 FNE)

```bash
wrangler queues create __PROJECT_SLUG__-events-staging
wrangler queues create __PROJECT_SLUG__-events-production
wrangler queues create __PROJECT_SLUG__-fne-staging
wrangler queues create __PROJECT_SLUG__-fne-production
wrangler queues create __PROJECT_SLUG__-notifications-staging
wrangler queues create __PROJECT_SLUG__-notifications-production
```

Bindings producer + consumer dans wrangler.toml (cf. déjà commenté lignes 35-48).

### 4.4 Cron Triggers (FNE sticker monitor, audit archive — Epic 13/14)

Ajouter dans wrangler.toml :

```toml
[triggers]
crons = [
  "0 6 * * *",   # 06h00 UTC — fne-sticker-monitor (Story 13.5)
  "0 3 * * 0"    # 03h00 UTC dimanche — audit_log archive (Story 13.9)
]
```

## 5. Secrets — set via `wrangler secret put`

**Pour chaque secret**, exécuter 2× (staging + production) :

```bash
cd apps/api

# Database
wrangler secret put DATABASE_URL --env staging
wrangler secret put DATABASE_URL --env production
# → Coller le DATABASE_URL Neon EU Frankfurt (cf. ADR 0001 — à créer manuellement console.neon.tech)

# Better-Auth (Story 3.1)
wrangler secret put BETTER_AUTH_SECRET --env staging
wrangler secret put BETTER_AUTH_SECRET --env production
# → Générer avec `openssl rand -base64 32`

# PSPs (Epic 9)
wrangler secret put WAVE_API_KEY --env staging
wrangler secret put WAVE_API_KEY --env production
wrangler secret put WAVE_WEBHOOK_SECRET --env staging
wrangler secret put WAVE_WEBHOOK_SECRET --env production
wrangler secret put PAYSTACK_SECRET_KEY --env staging
wrangler secret put PAYSTACK_SECRET_KEY --env production
wrangler secret put STRIPE_SECRET_KEY --env staging
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put FLUTTERWAVE_SECRET_KEY --env staging
wrangler secret put FLUTTERWAVE_SECRET_KEY --env production

# Notifications (Epic 5)
wrangler secret put RESEND_API_KEY --env staging
wrangler secret put RESEND_API_KEY --env production
wrangler secret put TWILIO_ACCOUNT_SID --env staging
wrangler secret put TWILIO_ACCOUNT_SID --env production
wrangler secret put TWILIO_AUTH_TOKEN --env staging
wrangler secret put TWILIO_AUTH_TOKEN --env production
wrangler secret put META_WHATSAPP_TOKEN --env staging
wrangler secret put META_WHATSAPP_TOKEN --env production
# → Token Meta WhatsApp obtenu après vérification business (7-14 jours — cf. Story 0.3 chemin critique)
wrangler secret put META_WHATSAPP_BUSINESS_PHONE_ID --env staging
wrangler secret put META_WHATSAPP_BUSINESS_PHONE_ID --env production

# IA (Epic 11, cf. ADR 0005)
wrangler secret put ANTHROPIC_API_KEY --env staging
wrangler secret put ANTHROPIC_API_KEY --env production
wrangler secret put OPENAI_API_KEY --env staging
wrangler secret put OPENAI_API_KEY --env production

# Rate-limit Upstash (Story 1.16, optionnels en dev)
wrangler secret put UPSTASH_REDIS_REST_URL --env staging
wrangler secret put UPSTASH_REDIS_REST_URL --env production
wrangler secret put UPSTASH_REDIS_REST_TOKEN --env staging
wrangler secret put UPSTASH_REDIS_REST_TOKEN --env production

# FNE CI (Epic 13)
# Pas un secret partagé : chaque organization CI a sa propre clé API DGI, stockée
# chiffrée dans la DB (table pme_fne_credentials) avec rotation key
```

## 6. Vérifier les POPs Afrique actifs

Dans `dash.cloudflare.com → Workers & Pages → Settings → Logs`, après quelques requêtes :

- [ ] Confirmer que les requêtes depuis Sénégal/Côte d'Ivoire sont routées via **Lagos**, **Casablanca**, ou **Johannesburg** (colonne "Colo")
- [ ] Pas de routage via US-East / EU-West direct (signe d'un problème de routing Anycast)

Outils utiles :

- <https://www.cloudflarestatus.com/> (status pages POPs)
- <https://radar.cloudflare.com/> (analytics réseau)

## 7. GitHub Actions secrets — configurer les Environments

Dans `github.com/<owner>/<repo> → Settings → Environments` :

### Environment `staging`

- `CLOUDFLARE_API_TOKEN` (scope : `Workers Scripts:Edit` + `Account.Workers Scripts:Edit` sur compte __PROJECT_NAME__)
- `CLOUDFLARE_ACCOUNT_ID`

### Environment `production`

- `CLOUDFLARE_API_TOKEN` (idem, scope production)
- `CLOUDFLARE_ACCOUNT_ID`
- ⚠️ Activer **Required reviewers** sur ce environment (au moins 1 approbation manuelle avant deploy production)

## 8. Tests post-setup

Une fois tout configuré, vérifier :

```bash
# /health staging
curl -sf https://api.staging.__PROJECT_SLUG__.com/health
# → {"status":"ok","service":"__PROJECT_SLUG__-api","version":"...","timestamp":"..."}

# /health/db staging
curl -sf https://api.staging.__PROJECT_SLUG__.com/health/db
# → {"status":"ok","database":"neon-postgres","version":"PostgreSQL 17.x ..."}

# tRPC health.ping staging
curl -sf https://api.staging.__PROJECT_SLUG__.com/trpc/health.ping
# → {"result":{"data":{"pong":true,"timestamp":"..."}}}

# Landing public staging
curl -sf https://staging.__PROJECT_SLUG__.com/ | grep __PROJECT_NAME__
```

## 9. Documenter dans ADR 0002 / archi

- [ ] Ajouter dans `docs/adrs/0002-compute-hono-2-workers.md` les **hostnames effectifs** + **Worker names** déployés
- [ ] Cocher Story 1.4 dans `epics.md` quand tout est vert
- [ ] Cocher Story 1.2 (3 envs wrangler) — passé automatiquement avec Story 1.4

---

## Notes & gotchas

- **Neon EU Frankfurt** : à créer manuellement sur `console.neon.tech` (MCP `create_project` ne supporte pas la région). Récupérer 2 connection strings : staging branch + production branch. Cf. ADR 0001.
- **Meta WhatsApp Business** : vérification 7-14 jours (Story 0.3 chemin critique). Le secret `META_WHATSAPP_TOKEN` n'est utilisable qu'après acceptation.
- **Wave Business API** : agrément non requis (modèle Facilitator, cf. PRD § 4.2). Compte développeur sur Wave Direct API.
- **Cron jobs CI/CD** : `security-scan.yml` tourne à 02h00 UTC (cf. `.github/workflows/`).
- **Cost monitoring** : Cloudflare Workers gratuit < 100K req/jour + paid plan $5/mois pour CPU 30s. R2 = $0.015/GB/mois. Queues = 1M/mois inclus. Total prévu MVP : **~$20-30/mois** infra Cloudflare.

## État au 2026-05-14

- ✅ Compte Cloudflare créé ? **À confirmer**
- ✅ Domaine __PROJECT_SLUG__.com sur Cloudflare ? **À confirmer**
- ⏳ Workers à déployer : 3 × 2 envs = 6 deploys
- ⏳ Bindings : 0/12 (KV staging/prod, R2 staging/prod, Queues events/fne/notifs × 2 envs)
- ⏳ Secrets : 0/~20
- ⏳ Custom Domains : 0/6

Quand tu attaques cette story, biffe les checkboxes au fur et à mesure et ouvre une PR avec ce fichier mis à jour.
