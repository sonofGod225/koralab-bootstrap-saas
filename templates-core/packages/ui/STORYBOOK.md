# Specimen vs Storybook — `@__SCOPE__/ui`

## Aujourd'hui : la route specimen `/design-preview`

Le design system se consulte via la **route specimen** de `apps/suite` :

```
pnpm --filter @__SCOPE__/suite dev
# puis http://localhost:9100/design-preview
```

`apps/suite/src/routes/design-preview.tsx` rend **toutes les primitives**
`@__SCOPE__/ui` (couleurs, typographie, boutons, formulaires, données,
feedback, navigation, layouts, primitives custom) avec leurs variants et
états, et un **toggle clair/sombre** en tête de page.

La page est **dev-only** : early return `if (import.meta.env.PROD) return null;`
— elle ne fuite jamais en production.

C'est la **source de vérité visuelle** : avant d'intégrer un composant dans un
écran, un agent dev (ou un humain) ouvre `/design-preview` pour voir son rendu
réel — clair et sombre.

## Pourquoi pas (encore) Storybook ?

Storybook officiel est **reporté en Phase 1** (cf. epics.md Story 2.14) — si la
bande passante le permet. La route specimen couvre le besoin immédiat sans le
coût d'installation/maintenance d'un Storybook (build séparé, addons, CI
dédiée).

Quand Storybook sera introduit :

- les `*.stories.tsx` vivront à côté de chaque composant dans `packages/ui` ;
- la route `/design-preview` pourra être conservée comme aperçu intégré rapide,
  ou retirée au profit de Storybook ;
- le gate visual-regression (Playwright/Percy) se branchera sur Storybook.

## Régression visuelle

Le test de régression visuelle (snapshots Playwright des pages specimen) est
**reporté** : il attend la mise en place du framework Playwright (cf. Story
2.14 / epic test-infra). En attendant, le gate a11y `axe-ci.yml` (Story 2.13)
couvre les régressions d'accessibilité.
