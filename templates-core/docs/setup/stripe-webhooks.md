# Webhooks Stripe — __PROJECT_NAME__

Le Worker `apps/api` consomme les events Stripe dans
`apps/api/src/queue-consumers/billing-events.ts` et les reçoit sur
`/webhooks/stripe`. Ce guide explique comment câbler Stripe en local et en
staging/prod.

Les 6 events gérés (et donc à activer côté Stripe) :

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

> Même **sans** la CLI Stripe en local, le plan se réconcilie au retour du
> checkout : la page `/settings/billing` appelle `billing.reconcileSubscription`
> quand l'URL contient `?checkout=success` (interroge Stripe directement, sans
> dépendre du webhook). Le webhook reste le filet de sécurité (renouvellements,
> échecs de paiement, annulations).

## Dev local

1. Se connecter à la CLI Stripe :

   ```bash
   stripe login
   ```

2. Forwarder les events vers le Worker local :

   ```bash
   stripe listen --forward-to http://localhost:9187/webhooks/stripe
   ```

3. Copier le `whsec_…` affiché par `stripe listen` dans `apps/api/.dev.vars` :

   ```dotenv
   STRIPE_SECRET_KEY=sk_test_…
   STRIPE_WEBHOOK_SECRET=whsec_…
   ```

4. Générer le catalogue de prix (renseigne `STRIPE_PRICE_IDS_JSON`) :

   ```bash
   pnpm --filter @__SCOPE__/payments seed:stripe-prices
   ```

   Copier la ligne `STRIPE_PRICE_IDS_JSON=…` affichée dans `apps/api/.dev.vars`.

5. Redémarrer `wrangler dev` pour recharger les variables.

6. Tester :

   ```bash
   stripe trigger customer.subscription.updated
   ```

## Staging / Production

1. Enregistrer (ou resynchroniser) l'endpoint Stripe — idempotent par URL :

   ```bash
   pnpm --filter @__SCOPE__/payments register:stripe-webhook -- <https url>
   # ex. staging (défaut si aucune URL) :
   pnpm --filter @__SCOPE__/payments register:stripe-webhook -- https://api.staging.__PROJECT_SLUG__.com/webhooks/stripe
   # ex. prod :
   pnpm --filter @__SCOPE__/payments register:stripe-webhook -- https://api.__PROJECT_SLUG__.com/webhooks/stripe
   ```

2. Poser le signing secret affiché :

   ```bash
   wrangler secret put STRIPE_WEBHOOK_SECRET --env staging
   # ou --env production
   ```

> Si l'endpoint existait déjà, le script met seulement à jour ses
> `enabled_events` : Stripe **ne renvoie pas** le `whsec_…` sur un update. Pour
> un secret frais, supprime puis recrée l'endpoint, ou lis-le dans le Dashboard
> Stripe (Developers → Webhooks → Reveal signing secret).
