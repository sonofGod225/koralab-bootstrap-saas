# Changelog — `@__SCOPE__/ui`

Toutes les évolutions notables du design system __PROJECT_NAME__ « Base & Brand ».

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ·
Versionnage : [SemVer](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- **Epic 2 — Design system** : initialisation du package `@__SCOPE__/ui`.
- **Tokens** Base & Brand v3.0 (`src/styles/tokens.css`, `@theme` Tailwind v4)
  et fontes Fraunces self-hosted (`fonts/`).
- **6 primitives custom** : `MoneyDisplay`, `KPI`, `EditorialQuote`,
  `PetalSymbol`, `StatusDot`, `VersionBadge`.
- **Story 2.5 — 47 primitives shadcn** thémées Base & Brand :
  - _Atoms_ : Avatar, Separator, Skeleton, Progress, Tooltip, Kbd, Spinner,
    Alert, Textarea, Button, Badge, Card, Input, Label.
  - _Forms_ : Checkbox, RadioGroup, Switch, Slider, Toggle, ToggleGroup,
    InputOTP, Combobox, Form, Select.
  - _Navigation_ : Tabs, Breadcrumb, Pagination, NavigationMenu, Menubar.
  - _Overlays_ : Dialog, Sheet, Drawer, AlertDialog, Popover, HoverCard,
    DropdownMenu, ContextMenu, Toaster (sonner).
  - _Données_ : Table, Accordion, Collapsible, Calendar, Command, Carousel,
    AspectRatio, ScrollArea, Resizable.
- **Story 2.15 — i18n des primitives** : module `@__SCOPE__/ui/i18n`
  (`useUIMessages()`, `<UILocaleProvider>`, `translateUI()`) + bundles
  `messages/{fr-fr,fr-af,en,wo}.json` (26 clés, couverture 100% testée).
- **Story 2.16 — documentation** : `README.md`, ce changelog,
  [ADR 0010](../../docs/adrs/0010-design-system-__PROJECT_SLUG__-ui.md), audit
  `pnpm ui:check`.
- **Story 2.1 — build** : pipeline `tsup` (`pnpm build`) produisant `dist/`
  (ESM + `.d.ts` par composant). Les `exports` restent sur la source `.tsx`
  (pattern Just-in-Time du monorepo) ; `dist/` = validation CI / publication.
- **Story 2.2 — tokens Tailwind v4** : palette par défaut purgée
  (`--color-*: initial` — seules base/brand/success/danger/warning existent),
  radii sémantiques `rounded-card`/`rounded-input`/`rounded-tile`, utilitaire
  `border-hairline` (0.5px @ 6%), token `--ring-focus` ; test anti-fuite de la
  palette par défaut.
- **Story 2.3 — self-host Fraunces** : conversion WOFF2 sous-défini latin via
  `subset-font` (script `pnpm fonts:build`), axe `opsz` figé à 40, `wght`
  variable — ~85 KB Roman + ~100 KB Italic. Preconnect Google Fonts dans le
  `<head>` des apps ; `font-feature-settings: ss01, ss02` sur `font-display`.
- **Story 2.4 — dark mode** : couche de tokens sémantiques (`background`,
  `foreground`, `card`, `popover`, `muted`, `subtle`, `primary`, `accent`,
  `destructive`, `border`…) en clair + sombre — bascule auto via
  `prefers-color-scheme` et forçable par la classe `.dark`/`.light`. Les 53
  composants retrofités pour consommer ces tokens. `globals.css` (agrégateur :
  tokens + `tw-animate-css` + éditorial) et `editorial.css` (classes `.t-hero`,
  `.t-h2`, `.t-mono`, `.t-editorial`…). Les apps importent `globals.css`.
- **Story 2.8 — formulaires** : `<Form>` câble react-hook-form + résolveur zod
  (validation au blur, focus + scroll auto vers le 1er champ en erreur) ;
  `<FormField>` (Controller), `<FormItem>`/`<FormLabel>`/`<FormControl>`/
  `<FormDescription>`/`<FormMessage>` accessibles (aria-invalid / describedby /
  required, astérisque), alias `<FieldError>`, `<FormSection>`. Test de
  validation zod inclus.
- **Story 2.7 — layouts** : primitives `packages/ui/src/layouts/` d'après le
  bundle design `story-2.7-layouts` — `AppShell` (grille 4 zones, content seul
  scrollable), `SidebarRail` + `NavIcon`, `Sidebar` + `SidebarHeader` /
  `SidebarSection` / `SidebarItem`, `Topbar` (slots start/center/end),
  `PageHeader`, `Section`, `Container`.
- **Story 2.9 — data display** : `DataTable` (TanStack Table + virtualisation
  auto > 100 lignes, tri/filtre/pagination/sélection contrôlés, server-side
  ready, colonnes monétaires via `MoneyDisplay`), `StatCard` (+ variante
  `hero`), `Trend`, `EmptyState`, skeletons préfabriqués (`TableSkeleton`,
  `CardSkeleton`, `ListSkeleton`).
- **Story 2.10 — feedback** : `LoadingButton` (spinner + anti-double-submit),
  `ConfirmDialog` (variante destructive Danger + double confirmation par
  phrase à retaper), hook `useConnectionStatusToast` (toast réseau non
  bloquant, UX-DR12). Toaster / Dialog / Drawer / Sheet / AlertDialog déjà
  livrés en Story 2.5.
- **Story 2.11 — navigation** : `CommandPalette` (palette ⌘K / Ctrl+K globale,
  recherche plein-texte, commandes groupées par module), `Stepper` (étapes
  `pending`/`current`/`done`/`error`, orientation horizontale ou verticale).
  Tabs / Breadcrumb / Pagination déjà livrés en Story 2.5.
- **Story 2.12 — inputs métier** : `MoneyInput` (saisie → `bigint`, XOF/XAF
  0 décimale, groupage espace fine), `DateInput` (champ + calendrier popover,
  locale fr), `DateRangePicker` (presets 7/30/90 j + plage), `PhoneInput`
  (`libphonenumber-js`, formatage live, sortie E.164), `CountrySelect`
  (combobox recherchable, pays prioritaires Afrique de l'Ouest/Centrale ;
  code ISO2 en puce mono — pas de drapeau emoji).
- **Story 2.13 — accessibilité** : tests `axe-core` (`jest-axe`) sur un
  échantillon de 15 primitives — 0 violation WCAG 2.1 AA ; contrat de
  contraste vérifié (Base 900/Ivoire ≥ 7:1, Brand 400/Base 900 ≥ 4.5:1,
  Danger 600/Ivoire ≥ 4.5:1) ; workflow GitHub Actions `axe-ci.yml` (gate sur
  les PR touchant `packages/ui/**`).
- **Story 2.14 — specimen** : route dev-only `/design-preview` (`apps/suite`)
  présentant toutes les primitives (10 sections) avec variants/états + toggle
  clair/sombre ; `STORYBOOK.md` (specimen vs Storybook — Storybook reporté
  Phase 1).

### Notes

- **Wolof (`wo`)** : couverture i18n MVP best-effort — révision par un
  linguiste wolof à prévoir avant le lancement public (Epic 15).
- **Animations** : `tw-animate-css` est câblé via `globals.css` — les
  transitions d'entrée/sortie des overlays shadcn sont actives (Story 2.4).
- **Consommation** : les apps consomment la **source** `.tsx` via Vite
  (`exports` → `src/`) ; le `dist/` produit par `pnpm build` n'est pas (encore)
  le chemin importé — cf. ADR 0010.
- **Budget fonts** : le seuil ≤ 50 KB (UX-DR1 / NFR57) n'est pas atteignable
  pour Fraunces self-hosté (~185 KB WOFF2 même `opsz` figé + subset latin).
  Fraunces étant display-only avec `font-display: swap`, il ne bloque pas le
  premier rendu — le chemin critique reste Inter.
- **Story 2.3** — volets reportés (infra absente) : gate budget Lighthouse
  (Story 2.13) et test visual-regression Playwright (Story 2.14).
