#!/usr/bin/env bash
# __PROJECT_NAME__ — orchestrateur déploiement Cloudflare Workers
# Usage : ./scripts/deploy.sh <staging|production>
#
# Prérequis :
# - wrangler login (OAuth local) OU CLOUDFLARE_API_TOKEN exporté
# - Secrets DATABASE_URL set via `wrangler secret put` pour chaque env
# - Custom domains configurés dans Cloudflare dashboard
#
# Note: @cloudflare/vite-plugin aplatit le wrangler.jsonc et perd les
# `env.*` overrides. Solution : utiliser --name + --var explicites + Vite mode.
#
# Référence : architecture.md step 9 + Story 1.4 + Story 1.5 (CI/CD)

set -euo pipefail

ENV="${1:-}"

if [[ -z "$ENV" ]]; then
  echo "❌ Usage : $0 <staging|production>"
  exit 1
fi

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "❌ Environnement '$ENV' invalide. Utiliser staging ou production."
  exit 1
fi

# Confirmation pour production (gate manuelle)
if [[ "$ENV" == "production" ]]; then
  read -rp "⚠️  Déploiement PRODUCTION. Es-tu sûr ? (yes/no) " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "Annulé."
    exit 0
  fi
fi

# URLs cibles par env
if [[ "$ENV" == "staging" ]]; then
  API_URL="https://api.staging.__PROJECT_SLUG__.com"
  SUITE_URL="https://staging.__PROJECT_SLUG__.com"
  ADMIN_URL="https://admin.staging.__PROJECT_SLUG__.com"
else
  API_URL="https://api.__PROJECT_SLUG__.com"
  SUITE_URL="https://__PROJECT_SLUG__.com"
  ADMIN_URL="https://admin.__PROJECT_SLUG__.com"
fi

# Noms des Workers Cloudflare
API_NAME="__PROJECT_SLUG__-api-${ENV}"
SUITE_NAME="__PROJECT_SLUG__-suite-${ENV}"
ADMIN_NAME="__PROJECT_SLUG__-admin-${ENV}"

echo ""
echo "🚀 __PROJECT_NAME__ — Déploiement $ENV"
echo "=============================="

# === 1. Validation pré-deploy ===
echo ""
echo "📋 1/6 — Validation (typecheck + lint + format + test)"
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
echo "  ✅ Validation OK"

# === 2. Build frontends avec mode Vite ===
echo ""
echo "🔨 2/6 — Build apps/suite + apps/admin (mode=$ENV)"
pnpm --filter @__SCOPE__/suite exec vite build --mode "$ENV"
pnpm --filter @__SCOPE__/admin exec vite build --mode "$ENV"
echo "  ✅ Builds OK"

# === 3. Deploy apps/api ===
echo ""
echo "📦 3/6 — Deploy $API_NAME"
# apps/api utilise wrangler.toml avec env.* qui marche (pas de plugin Vite)
pnpm --filter @__SCOPE__/api exec wrangler deploy --env "$ENV"
echo "  ✅ $API_NAME déployé"

# === 4. Smoke test API ===
echo ""
echo "🩺 4/6 — Smoke test /health"
sleep 5
# Note : avant Custom Domain on hit *.workers.dev — after dashboard setup, swap pour les vrais hostnames
curl -sf "$API_URL/health" | grep -q '"status":"ok"' && echo "  ✅ $API_URL/health OK" || \
  echo "  ⚠️  $API_URL/health KO (vérifier Custom Domain)"

# === 5. Deploy frontends ===
echo ""
echo "📦 5/6 — Deploy $SUITE_NAME + $ADMIN_NAME"
# Workaround Cloudflare Vite plugin : --name explicite + --var pour les vars runtime
pnpm --filter @__SCOPE__/suite exec wrangler deploy \
  --name "$SUITE_NAME" \
  --var "ENVIRONMENT:$ENV" \
  --var "VITE_API_URL:$API_URL"
echo "  ✅ $SUITE_NAME déployé"
pnpm --filter @__SCOPE__/admin exec wrangler deploy \
  --name "$ADMIN_NAME" \
  --var "ENVIRONMENT:$ENV" \
  --var "VITE_API_URL:$API_URL"
echo "  ✅ $ADMIN_NAME déployé"

# === 6. Smoke tests frontends ===
echo ""
echo "🩺 6/6 — Smoke tests landings"
sleep 5
curl -sf "$SUITE_URL/" | grep -q '__PROJECT_NAME__' && echo "  ✅ $SUITE_URL serves landing" || \
  echo "  ⚠️  $SUITE_URL KO (vérifier Custom Domain)"
curl -sf "$ADMIN_URL/" | grep -q '__PROJECT_NAME__' && echo "  ✅ $ADMIN_URL serves landing" || \
  echo "  ⚠️  $ADMIN_URL KO (vérifier Custom Domain)"

echo ""
echo "✨ Déploiement $ENV terminé."
echo "  • API     : $API_URL  (worker: $API_NAME)"
echo "  • Suite   : $SUITE_URL  (worker: $SUITE_NAME)"
echo "  • Admin   : $ADMIN_URL  (worker: $ADMIN_NAME)"
echo ""
echo "Custom Domains à configurer (1 seule fois) via :"
echo "  https://dash.cloudflare.com/?to=/:account/workers/services/view/$SUITE_NAME"
