---
title: __PROJECT_NAME__ Design System — Point d'entrée
version: 3.0 (Terre et Soleil)
date: 2026-05-14
references:
  - ./design-system/README.md
  - ./design-system/project/README.md
  - ./design-system/project/SKILL.md
  - ./design-system/project/tokens/__PROJECT_SLUG__-tokens.css
  - ../_bmad-output/planning-artifacts/architecture.md#design-system-pattern--__PROJECT_SLUG__-terre-et-soleil-v30
---

# __PROJECT_NAME__ Design System — Point d'entrée

> ⚠️ **AI agents : lire en priorité avant toute implémentation UI** : ce document pointe vers les sources de vérité. **Source de vérité exhaustive** : [`design-system/project/README.md`](./design-system/project/README.md).

## 🎨 Identité

**Terre et Soleil v3.0** — direction moderne et chaleureuse, ancrée dans l'esthétique sahélienne. Inspiration : Linear/Stripe/Pennylane (rigueur) + architecture sahélienne et lumière de Dakar fin d'après-midi (chaleur). Le logo 4 pétales = les 4 modules formant un outil intégré.

## 📁 Structure des sources

```
docs/
├── DESIGN_SYSTEM.md                       # Ce fichier (point d'entrée)
├── assets/                                # Assets racine (copie commodité)
│   ├── __PROJECT_SLUG__-tokens.{css,json}
│   ├── __PROJECT_SLUG__-logo*.svg
│   └── ...
└── design-system/                         # Bundle complet exporté de Claude Design
    ├── README.md                          # Instructions pour AI agents
    ├── chats/                             # Conversation historique (contexte intent)
    └── project/
        ├── README.md                      # 🎯 SPEC EXHAUSTIVE (lire en priorité)
        ├── SKILL.md                       # Manifeste skill + non-négociables résumés
        ├── colors_and_type.css            # Drop-in semantic classes
        ├── tokens/
        │   ├── __PROJECT_SLUG__-tokens.css       # 🔑 Tailwind v4 @theme block
        │   └── __PROJECT_SLUG__-tokens.json      # Mêmes tokens en JSON
        ├── assets/                        # Logos SVG (light/dark/mono/symbol/app-icon/favicons)
        ├── fonts/                         # 🔤 38 fichiers Fraunces TTF variable
        ├── preview/                       # Specimen HTML (couleurs, type, composants)
        └── ui_kits/app/                   # 🎨 UI Kit prototype JSX (référence visuelle)
            ├── README.md
            ├── index.html
            ├── Components.jsx             # Atoms (Button, Badge, KPI, EditorialQuote, PetalSymbol...)
            ├── Sidebar.jsx
            ├── Topbar.jsx
            ├── Dashboard.jsx
            ├── Invoices.jsx
            └── InvoiceDetail.jsx
```

## 🚨 Non-négociables (extraits — voir SKILL.md pour liste complète)

1. **Sentence case partout.** Jamais `ALL CAPS`, jamais `Title Case On Sentences`.
2. **Soleil 400 ≤ 15% de toute surface.** Signature, pas remplissage.
3. **Italic Fraunces en Soleil 600 — max 2 par page.** Voix éditoriale rare.
4. **Pill buttons (radius 100px), card radii 16-20px, input radii 12px.** Jamais sharp corners.
5. **No emoji.** Status via dots colorés + badges + copy.
6. **Pas de corporate jargon.** Bannis : solutions, synergies, disruption, innovant, écosystème...
7. **Langue par défaut : français** (Sénégal / Côte d'Ivoire).
8. **Currency** : `145 000 FCFA` (thin space, jamais `FCFA 145 000`).
9. **Petal accent bottom-right par défaut.**

## 🎯 Comment l'utiliser

### En production (apps Budisuite)

- Importer les tokens via `packages/ui/src/styles/tokens.css` (qui re-exporte `__PROJECT_SLUG__-tokens.css`)
- Self-host fontes Fraunces dans `packages/ui/fonts/`
- Utiliser primitives `@__SCOPE__/ui/*` (Button, Card, KPI, EditorialQuote, PetalSymbol, MoneyDisplay, etc.)
- Référencer `colors_and_type.css` pour classes sémantiques éditoriales ad-hoc

### En prototypage / mocks

- Copier les HTML preview cards de `design-system/project/preview/`
- Utiliser le UI kit JSX de `design-system/project/ui_kits/app/` comme **inspiration visuelle**
- Ne PAS recopier le code JSX en production (c'est un prototype, pas du code battle-tested)

## 🔗 Liens architecturaux

- Architecture technique du Design System : `_bmad-output/planning-artifacts/architecture.md` → section **"Design System Pattern — __PROJECT_NAME__ Terre et Soleil v3.0"**
- Structure `packages/ui` : `_bmad-output/planning-artifacts/architecture.md` → section **"Project Structure & Boundaries"**
- Pattern shadcn monorepo (intégration avec Terre et Soleil) : architecture.md → section **"Shadcn/ui Monorepo Pattern"**

## ⚠️ Caveats du Design System (extraits de la spec)

D'après `design-system/project/README.md` :

- **Pas de codebase ni Figma source** attachés à la spec. Le UI kit JSX est une **interprétation** de la spec, pas une recréation d'un produit existant.
- **Inter et JetBrains Mono** chargés depuis Google Fonts CDN (pas de TTF self-hosted fournis pour ces fontes). Si la team a des variantes self-hosted, les déposer dans `packages/ui/fonts/` et basculer `@import` en local `@font-face`.
- **Lucide icons** choisis comme système d'icônes (via CDN ou via `lucide-react` npm package en production). Si __PROJECT_NAME__ veut un icon set custom, le pointer.
- **Dashboard layout** dans `ui_kits/app/` est un premier cut, peut être affiné selon retours réels d'usage.

## 📝 Historique

- **v3.0 (Mai 2026) — Terre et Soleil** : direction actuelle (sahélienne, modulaire, 4 pétales)
- **v2.0 (Cuivre Sahel)** : *deprecated*
- **v1.0 (Marine + Ambre)** : *deprecated*
