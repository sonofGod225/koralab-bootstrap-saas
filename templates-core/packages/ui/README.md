# `@__SCOPE__/ui`

> Design system **Base & Brand v3.0** de __PROJECT_NAME__ — source de vérité unique
> des tokens, fontes, primitives shadcn thémées et primitives custom, partagée
> par `apps/suite` et `apps/admin`.

Décisions de référence : [ADR 0007](../../docs/adrs/0007-shadcn-monorepo-mode.md)
(monorepo) · [ADR 0010](../../docs/adrs/0010-design-system-__PROJECT_SLUG__-ui.md)
(contrat de consommation).

---

## Règles d'or

1. **Importer, jamais ré-implémenter.** Toute UI d'app vient de `@__SCOPE__/ui`.
   `pnpm ui:check` audite les apps contre les duplications.
2. **Imports per-component** pour le tree-shaking :
   `import { Button } from '@__SCOPE__/ui/button'`. Le barrel `@__SCOPE__/ui`
   est réservé aux tests / specimen.
3. **JAMAIS de dossier `apps/*/src/components/ui/`** — les primitives vivent ici.
4. **JAMAIS modifier un composant shadcn copié sans ADR.** Pour étendre, créer
   un wrapper dans `src/primitives/`.
5. **Brand 400 ≤ 15 % de surface** · pill buttons (radius 100px) · sentence
   case · pas d'emoji · italique Fraunces éditoriale max 2/page.

---

## Consommation

```tsx
// Apps — imports per-component (tree-shaking optimal)
import { Button } from '@__SCOPE__/ui/button';
import { MoneyDisplay } from '@__SCOPE__/ui/money-display';
import { DropdownMenu, DropdownMenuItem } from '@__SCOPE__/ui/dropdown-menu';
```

```css
/* styles.css de l'app — une seule fois, après Tailwind */
@import 'tailwindcss';
@import '@__SCOPE__/ui/styles/globals.css'; /* tokens light+dark + animations + éditorial */
```

i18n des primitives :

```tsx
import { UILocaleProvider, useUIMessages } from '@__SCOPE__/ui/i18n';

// Racine de l'app — la locale est pilotée par apps/suite/src/lib/i18n.ts
<UILocaleProvider locale={locale}>{children}</UILocaleProvider>;

// Dans une primitive / un écran
const { t, formatNumber, formatDate } = useUIMessages();
t('form.amountMin', { min: formatNumber(1000) }); // « Le montant doit être au moins 1 000 »
```

---

## Tokens

Source : `src/styles/tokens.css` (Tailwind v4 `@theme`). Exposés comme classes
utilitaires (`bg-base-900`, `rounded-pill`, `shadow-md`, `font-display`…).

**Dark mode** — les composants consomment des tokens **sémantiques**
(`bg-background`, `text-foreground`, `bg-card`, `bg-muted`, `border-border`,
`bg-primary`…) qui basculent automatiquement via `prefers-color-scheme`, ou
manuellement via la classe `.dark` / `.light` sur `<html>`.

### Palette

| Famille       | Rôle                                                      | Échelle                     |
| ------------- | --------------------------------------------------------- | --------------------------- |
| **Brand**    | Couleur signature (≤ 15 % surface) — `brand-400 #E89B5A` | 50 → 900                    |
| **Base**     | Texte, fonds, CTA primaire                                | 25 → 950                    |
| **Success** | Succès / payé                                             | 50, 200, 400, 600, 800, 900 |
| **Danger**    | Danger / retard                                           | 50, 200, 400, 600, 800, 900 |
| **Warning**       | Avertissement                                             | 50, 200, 400, 600           |

### Radii · Typo · Ombres

| Radii                                                                                             | Typographie                                                                                             | Ombres                                                                            |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `sm 8` · `md 12` (inputs) · `lg 16` · `xl 20` (cards) · `2xl 24` · `3xl 32` · `pill 100` · `full` | `font-display` Fraunces · `font-sans` Inter · `font-mono` JetBrains Mono · échelle `text-xs`→`text-6xl` | `shadow-xs`/`sm`/`md`/`lg` (warm, jamais noir pur) · `shadow-focus` (ring Brand) |

---

## Inventaire des primitives

### Primitives custom __PROJECT_NAME__ (`src/primitives/`)

| Composant        | Import                          | Usage                                              |
| ---------------- | ------------------------------- | -------------------------------------------------- |
| `MoneyDisplay`   | `@__SCOPE__/ui/money-display`   | Montants `145 000 FCFA` (thin space, tabular-nums) |
| `KPI`            | `@__SCOPE__/ui/kpi`             | Carte indicateur dashboard                         |
| `EditorialQuote` | `@__SCOPE__/ui/editorial-quote` | Citation Fraunces italique cuivre                  |
| `PetalSymbol`    | `@__SCOPE__/ui/petal-symbol`    | Symbole 4 pétales brand                            |
| `StatusDot`      | `@__SCOPE__/ui/status-dot`      | Point de statut coloré                             |
| `VersionBadge`   | `@__SCOPE__/ui/version-badge`   | Badge de version applicative                       |

### Primitives shadcn thémées (`src/components/ui/`)

| Famille         | Composants                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Atoms**       | `button` · `badge` · `card` · `input` · `label` · `textarea` · `avatar` · `separator` · `skeleton` · `progress` · `tooltip` · `kbd` · `spinner` · `alert` |
| **Formulaires** | `form` · `select` · `checkbox` · `radio-group` · `switch` · `slider` · `toggle` · `toggle-group` · `input-otp` · `combobox`                               |
| **Navigation**  | `tabs` · `breadcrumb` · `pagination` · `navigation-menu` · `menubar`                                                                                      |
| **Overlays**    | `dialog` · `sheet` · `drawer` · `alert-dialog` · `popover` · `hover-card` · `dropdown-menu` · `context-menu` · `sonner`                                   |
| **Données**     | `table` · `accordion` · `collapsible` · `calendar` · `command` · `carousel` · `aspect-ratio` · `scroll-area` · `resizable`                                |

Chaque entrée correspond à un sous-chemin `exports` (`@__SCOPE__/ui/<nom>`).

### Layouts (`src/layouts/`)

`app-shell` (grille 4 zones) · `sidebar` (`SidebarRail`, `NavIcon`, `Sidebar`,
`SidebarHeader`, `SidebarSection`, `SidebarItem`) · `topbar` · `page-header` ·
`section` · `container`.

---

## i18n (`@__SCOPE__/ui/i18n`)

4 locales __PROJECT_NAME__ : `fr-fr`, `fr-af`, `en`, `wo`. Bundles dans
`messages/{locale}.json` (26 clés — `common.*`, `form.*`, `field.*`, `nav.*`).

| Export                             | Rôle                                                  |
| ---------------------------------- | ----------------------------------------------------- |
| `<UILocaleProvider locale>`        | Injecte la locale active (une fois, en racine)        |
| `useUIMessages()`                  | `{ t, formatNumber, formatDate, locale, intlLocale }` |
| `translateUI(key, locale, params)` | Resolver pur (hors React)                             |

Couverture des 4 locales testée à 100 % (`src/__tests__/i18n.test.ts`).
Wolof : couverture MVP best-effort, révision linguiste à venir.

---

## Scripts

| Commande                                | Effet                                        |
| --------------------------------------- | -------------------------------------------- |
| `pnpm --filter @__SCOPE__/ui build`     | tsup → `dist/` (ESM + `.d.ts` par composant) |
| `pnpm --filter @__SCOPE__/ui typecheck` | `tsc --noEmit`                               |
| `pnpm --filter @__SCOPE__/ui lint`      | ESLint (`--max-warnings=0`)                  |
| `pnpm --filter @__SCOPE__/ui test`      | Vitest                                       |
| `pnpm ui:check`                         | Audit anti-duplication des apps (racine)     |

> **Build & consommation** : `pnpm build` (tsup) produit `dist/` — ESM +
> `.d.ts` par composant, en miroir de `src/`. Les `exports` pointent
> volontairement sur la **source** `.tsx` (comme `db`/`rpc`/`types` : pattern
> Just-in-Time du monorepo, transpilée par Vite côté apps). `dist/` sert de
> cible de validation CI et de publication future. Voir ADR 0010.

---

## Liens

- [`docs/DESIGN_SYSTEM.md`](../../docs/DESIGN_SYSTEM.md) — point d'entrée design
- [`docs/design-system/project/SKILL.md`](../../docs/design-system/project/SKILL.md) — non-négociables
- [`docs/ui-designs/epic-design-system/`](../../docs/ui-designs/epic-design-system/) — bundle UI Design Epic 2
- [`CHANGELOG.md`](./CHANGELOG.md)
