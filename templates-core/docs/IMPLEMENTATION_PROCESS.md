---
title: __PROJECT_NAME__ — Processus d'implémentation (cycle dev avec UI Design)
version: 1.0
date: 2026-05-14
status: active
references:
  - ./DESIGN_SYSTEM.md
  - ./design-system/project/SKILL.md
  - ../_bmad-output/planning-artifacts/architecture.md
---

# __PROJECT_NAME__ — Processus d'implémentation

> ⚠️ **AI agents et contributeurs : lire ce document AVANT toute implémentation d'épic ou de story.** Le cycle __PROJECT_NAME__ étend le cycle BMad standard avec une **étape UI Design Per-Epic** via Claude Code Design (`claude.ai/design`).

## 🔄 Cycle d'implémentation __PROJECT_NAME__

### Vue d'ensemble

```
                         ┌─────────────────────────────────────┐
                         │  EPIC KICKOFF (1 fois par épic)     │
                         │                                      │
                         │  [UD-EPIC] UI Design via             │
                         │   Claude Code Design                  │
                         │   └─ Bundle exporté →                │
                         │      docs/ui-designs/epic-<id>/      │
                         │                                      │
                         │  Output : HTML/CSS/JS prototypes     │
                         │           pour tous écrans majeurs   │
                         │           de l'épic                   │
                         └────────────┬────────────────────────┘
                                       │
                                       ▼
                         ┌─────────────────────────────────────┐
                         │  Pour chaque story de l'épic         │
                         │  (cycle BMad standard 4 étapes)      │
                         │                                      │
                         │  [CS] Create Story  (Bob - SM)       │
                         │       │                              │
                         │       ▼                              │
                         │  [VS] Validate Story (Bob - SM)      │
                         │       │                              │
                         │       ▼                              │
                         │  [DS] Dev Story  (Amelia - Dev)      │
                         │       └─ Implémente contre les       │
                         │          designs de docs/ui-designs/ │
                         │       │                              │
                         │       ▼                              │
                         │  [CR] Code Review                    │
                         │       └─ Vérifie match visuel        │
                         │          avec design exporté         │
                         │       │                              │
                         │       ▼                              │
                         │  Si fix nécessaire → retour DS       │
                         │  Sinon → story suivante              │
                         └─────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────┐
   │ Cas exceptionnel : "story surprise" non prévue au kickoff    │
   │                                                              │
   │ Si une story introduit un écran/pattern NON couvert par      │
   │ le design epic existant → [UD-STORY] ad hoc avant DS          │
   │                                                              │
   │ Output dans : docs/ui-designs/epic-<id>/story-<id>/          │
   └─────────────────────────────────────────────────────────────┘
```

### Critères de déclenchement UI Design (décision 2026-05-14)

| Niveau | Mode | Fréquence MVP |
|---|---|---|
| **Per-Epic** | ✅ **OBLIGATOIRE** au kickoff de chaque épic — design de tous les écrans majeurs en une session | 3-7 sessions / MVP |
| **Per-Story ad hoc** | Uniquement pour stories surprises (non prévues au kickoff) introduisant un écran ou pattern nouveau | Estimation : 5-10 / MVP |
| Per-Story systématique | ❌ Non — overkill pour solo founder + IA dev | — |

### Critères "story surprise" justifiant UI design ad hoc

Une story déclenche UI design ad hoc si elle :
- Introduit un **nouvel écran** non designé au kickoff de l'épic
- Introduit une **nouvelle interaction** (nouveau wizard, modal type inédit, drag-and-drop non couvert)
- Nécessite une **nouvelle primitive UI** absente de `packages/ui/src/primitives/`
- Implique une **refonte visuelle majeure** d'un écran existant

**Skip UI design** pour :
- Bug fix sans impact UX
- Refactoring backend
- Ajout d'un champ simple à un formulaire existant
- Modification de logique métier sans rendu visuel
- Mise à jour de copy (textes) seulement

---

## 📁 Structure des artefacts UI Design

```
docs/
├── DESIGN_SYSTEM.md                  # Système de design __PROJECT_NAME__ v3.0 Terre et Soleil
├── design-system/                    # Bundle complet design system (tokens, fontes, primitives)
├── IMPLEMENTATION_PROCESS.md         # CE DOCUMENT
└── ui-designs/                       # 🆕 Designs UI par épic (claude.ai/design exports)
    ├── README.md                     # Index + processus + conventions
    ├── epic-foundations/             # Epic Phase 0 — Foundations (Identity, Tenancy, RBAC, Billing)
    │   ├── README.md                 # Brief, screens listés, décisions clés
    │   ├── chats/                    # Conversation Claude Design (intent)
    │   └── project/                  # HTML/CSS/JS prototypes
    │       ├── screens/
    │       │   ├── signup.html
    │       │   ├── login.html
    │       │   ├── mfa-setup.html
    │       │   └── org-switcher.html
    │       └── ...
    ├── epic-onboarding/              # Epic Phase 0/1 — Onboarding entreprise (8 steps)
    │   ├── README.md
    │   ├── chats/
    │   └── project/
    │       └── screens/
    │           ├── step-1-company.html
    │           ├── step-2-profile.html
    │           ├── step-3-plan.html
    │           ├── step-4-modules.html
    │           ├── step-5-preferences.html
    │           ├── step-6-consent.html
    │           ├── step-7-team-invitation.html
    │           └── step-8-welcome-tour.html
    ├── epic-facturation/             # Epic Phase 1 — Facturation SYSCOHADA
    │   ├── README.md
    │   ├── chats/
    │   └── project/
    │       └── screens/
    │           ├── invoices-list.html
    │           ├── invoice-detail.html
    │           ├── invoice-create.html
    │           ├── invoice-edit.html
    │           ├── invoice-send-whatsapp.html
    │           ├── quote-create.html
    │           └── relance-template-config.html
    ├── epic-encaissements/           # Epic Phase 1 — Encaissements Mobile Money
    │   └── ...
    ├── epic-crm/                     # Epic Phase 1 — CRM light
    │   └── ...
    ├── epic-ai-features/             # Epic Phase 1 — OCR + Assistant relances
    │   └── ...
    ├── epic-fne-ci/                  # Epic Phase 1 — FNE Côte d'Ivoire
    │   └── project/screens/
    │       ├── fne-onboarding.html
    │       ├── fne-settings.html
    │       ├── fne-sticker-monitor.html
    │       └── establishments-management.html
    └── epic-<post-mvp>/              # Epics post-MVP (Comptabilité, Achats, Inventaire, etc.)
```

### Convention de nommage

- **Dossiers d'épic** : `epic-<kebab-case-name>/` (matche les épics issus de `/bmad-create-epics-and-stories`)
- **Fichiers HTML écrans** : `<kebab-case-screen-name>.html` (matche le composant React qui sera implémenté, ex: `invoice-detail.html` → `InvoiceDetail.tsx`)
- **Story-level ad hoc** : `epic-<id>/story-<story-number>-<short-desc>/` (rare, uniquement pour stories surprises)

---

## 🎬 Workflow Per-Epic détaillé

### Étape 1 — Préparation Epic Kickoff

**Owner : Marius (Product) + John (PM si workflow BMad) + Sally (UX si invoqué)**

1. **Lister les stories de l'épic** depuis `_bmad-output/implementation-artifacts/` (output de `/bmad-create-epics-and-stories`)
2. **Identifier les écrans majeurs** à designer :
   - 1 écran = 1 vue principale ou un sous-flow critique
   - Estimer 5-10 écrans pour un gros épic, 3-5 pour un moyen
3. **Préparer le brief** pour Claude Code Design avec :
   - Lien vers `docs/DESIGN_SYSTEM.md` (système Terre et Soleil v3.0)
   - PRD section pertinente (ex: `__PROJECT_NAME__-PRD-v2.0-Africa.md` § 5.4 pour épic Facturation)
   - Architecture section pertinente (`architecture.md`)
   - Liste des écrans à produire avec mini-description chaque
   - Contraintes spécifiques (mobile-first, primitives custom à utiliser : `MoneyDisplay`, `KPI`, etc.)

### Étape 2 — Session Claude Code Design (claude.ai/design)

**Owner : Marius**

1. Démarrer une session `claude.ai/design` avec le brief
2. Itérer sur les écrans (Claude Design propose, Marius affine, etc.)
3. **Respecter les non-négociables** Terre et Soleil v3.0 :
   - Sentence case partout
   - Soleil 400 ≤ 15% surface
   - Italic Fraunces max 2/page
   - Pill buttons 100px, cards 16-20px, inputs 12px
   - No emoji, no corporate jargon
   - FCFA avec thin space : `145 000 FCFA`
4. **Inclure les états** : empty state, loading skeleton, error, success, edge cases (montant 0, listes vides, longs textes)
5. Une fois validé, **exporter le bundle** depuis Claude Design

### Étape 3 — Commit du bundle UI Design dans le repo

**Owner : Marius**

1. Extraire le bundle Claude Design dans `docs/ui-designs/epic-<id>/`
2. Le bundle contient :
   - `README.md` (instructions Claude Design pour AI agents implémentation)
   - `chats/` (conversation Claude Design — contexte intent)
   - `project/` (HTML/CSS/JS prototypes + assets + README brand)
3. Renommer si nécessaire pour matcher les conventions
4. Commit : `feat(ui-design): add design bundle for epic-<id>`
5. Update `docs/ui-designs/README.md` avec entrée pour ce nouvel épic

### Étape 4 — Référence dans les stories

**Owner : Bob (SM)** (ou Marius en mode solo)

Lors de la création de chaque story (`/bmad-create-story`) liée à l'épic :
- Ajouter dans la story une référence au design correspondant
- Format dans la story : `**UI Design Reference** : docs/ui-designs/epic-<id>/project/screens/<screen>.html`
- Inclure dans les Acceptance Criteria une AC du type : "Visual match avec `<screen>.html` à pixel près sur viewport mobile 360px et tablet 768px"

### Étape 5 — Implémentation (Amelia / Dev Story)

**Owner : Amelia (Dev) / AI agent dev**

Lors du `[DS]` Dev Story :
1. **Lire les designs** de `docs/ui-designs/epic-<id>/project/screens/<screen>.html` AVANT d'écrire le code
2. **NE PAS render le HTML dans un browser** sauf demande explicite — lire le source HTML/CSS directement (recommandation Claude Design)
3. **Implémenter en React/TypeScript** avec :
   - Composants depuis `@__SCOPE__/ui/<component>` (shadcn + primitives __PROJECT_NAME__)
   - Tokens Tailwind depuis le design system Terre/Soleil
   - Pattern code __PROJECT_NAME__ (cf. architecture step 5 patterns)
4. **Match visuel pixel-perfect** : recreer le rendu exact, pas la structure interne du prototype HTML
5. **Réutiliser** tous les composants existants de `packages/ui` (shadcn + primitives Terre et Soleil)
6. **Si nouvelle primitive nécessaire** (jamais vue dans `packages/ui/src/primitives/`) :
   - Créer une story Phase 0 dédiée "add primitive X to packages/ui"
   - Sinon ajouter à `packages/ui/src/primitives/` dans la même story avec ADR justifiant

### Étape 6 — Code Review (CR)

**Owner : Reviewer (humain ou IA)**

Vérifications spécifiques au visuel :
- Comparaison side-by-side avec le HTML de `docs/ui-designs/epic-<id>/project/screens/<screen>.html`
- Vérification que les tokens design system sont utilisés (pas de couleurs hardcoded)
- Vérification que les classes Tailwind respectent les non-négociables (pill, radii, sentence case)
- Vérification responsive (mobile 360px, tablet 768px, desktop 1280px)
- Vérification dark mode si applicable

---

## 🚨 Cas exceptionnel : Story surprise

Si une story du backlog (créée après le kickoff de l'épic) introduit un écran ou pattern NON couvert par le design existant :

1. **Avant `[DS] Dev Story`** : déclencher `[UD-STORY]` ad hoc
2. Session Claude Design ciblée sur cette story uniquement
3. Output dans `docs/ui-designs/epic-<id>/story-<story-number>-<short-desc>/`
4. Commit dans la branche de la story
5. Reprise du cycle BMad normal `[DS] → [CR]`

**Décision sur "surprise" doit être prise au moment de `[VS] Validate Story`** par le SM (Bob) ou Marius :
- Si la story fait référence à un design existant dans `docs/ui-designs/epic-<id>/` → pas de UD-STORY, on passe direct à DS
- Si la story introduit du nouveau → flag "needs UI design" sur la story + UD-STORY ad hoc

---

## 🤖 Instructions pour AI agents

### Pour le dev (Amelia / Dev Story)

1. **TOUJOURS lire `docs/ui-designs/epic-<current-id>/project/screens/<screen>.html`** avant d'implémenter un écran
2. **TOUJOURS consulter `docs/DESIGN_SYSTEM.md` et `docs/design-system/project/README.md`** pour les non-négociables
3. **TOUJOURS utiliser** `@__SCOPE__/ui/<component>` plutôt que recoder un composant
4. **JAMAIS modifier** un composant shadcn généré sans ADR documentée
5. **JAMAIS render** le HTML prototype dans un browser pour screenshot — lire le source
6. **TOUJOURS recreer le visuel** pixel-perfect mais ne pas copier la structure HTML/CSS interne du prototype
7. **TOUJOURS implémenter les états manquants** : empty, loading skeleton (Terre 100), error boundary, success toast (Palmeraie)

### Pour le reviewer (Code Review)

1. **TOUJOURS comparer** le rendu implémenté avec le HTML de `docs/ui-designs/epic-<id>/project/screens/<screen>.html`
2. **TOUJOURS vérifier** les non-négociables Terre et Soleil (sentence case, Soleil ≤ 15%, pill buttons, radii organiques)
3. **TOUJOURS vérifier** que les tokens design system sont utilisés (pas de couleurs hardcoded type `#FF0000`)
4. **TOUJOURS vérifier** responsive mobile-first (360px → 768px → 1280px)
5. **TOUJOURS vérifier** l'accessibilité (WCAG 2.1 AA — labels forms, contraste, focus visible)

### Pour le SM (Bob / Create Story)

1. **TOUJOURS inclure** une référence au design dans chaque story qui touche l'UI :
   ```markdown
   ## UI Design Reference

   - Écran principal : `docs/ui-designs/epic-<id>/project/screens/<screen>.html`
   - États additionnels : empty, loading, error, success
   - Responsive : mobile 360px, tablet 768px, desktop 1280px
   ```
2. **Si la story introduit du nouveau** non couvert par le design existant → ajouter étiquette `needs-ui-design` + déclencher UD-STORY ad hoc

---

## 📊 Estimation effort UI Design MVP

Pour le MVP __PROJECT_NAME__ (Phase 0 + Phase 1, mois 1-9) :

| Epic | Écrans à designer | Effort session UI Design |
|---|---|---|
| Foundations (Identity + Tenancy + RBAC + Billing) | ~8-10 écrans | 3-4h |
| Onboarding entreprise (8 steps + module onboarding) | ~12-15 écrans | 4-5h |
| Facturation SYSCOHADA | ~7-10 écrans | 3-4h |
| Encaissements Mobile Money | ~6-8 écrans | 2-3h |
| CRM light | ~5-7 écrans | 2-3h |
| Capacités IA (OCR + Assistant) | ~3-4 écrans | 1-2h |
| FNE Côte d'Ivoire | ~4-5 écrans (settings, monitoring, onboarding FNE) | 2h |
| **Total MVP** | **~50-60 écrans** | **17-23h cumulées** sur ~9 mois |
| Stories surprises (estimation) | ~10 écrans ad hoc | 5h cumulées |
| **GRAND TOTAL MVP** | **~60-70 écrans** | **~25h** |

**Comparaison sans étape UI Design** : risque élevé de re-travail visuel + design system gaps découverts tard + incohérences entre écrans → coût estimé 2-3× plus élevé en dette technique.

---

## 🎯 Pourquoi ce processus est différenciateur

1. **Solo founder + IA** peut produire une UI de qualité agency-level grâce à Claude Design + design system Terre et Soleil
2. **Cohérence visuelle parfaite** dans chaque épic (1 session = N écrans coordonnés)
3. **Découverte design system gaps tôt** : nouvelles primitives identifiées au design, ajoutées proprement à `packages/ui`
4. **Documentation visuelle exhaustive** dans le repo (re-référençable à tout moment)
5. **AI agents implémentation** ont un référent visuel clair (pas d'invention)
6. **Tracabilité audit** : chaque écran a son design source dans `docs/ui-designs/`

---

## 🔗 Liens

- Design System __PROJECT_NAME__ : [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)
- Spec design exhaustive : [`design-system/project/README.md`](./design-system/project/README.md)
- Architecture technique : [`_bmad-output/planning-artifacts/architecture.md`](../_bmad-output/planning-artifacts/architecture.md)
- PRD : [`__PROJECT_NAME__-PRD-v2.0-Africa.md`](./__PROJECT_NAME__-PRD-v2.0-Africa.md)
- Claude Code Design : `claude.ai/design`
