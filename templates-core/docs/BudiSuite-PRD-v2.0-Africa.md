---
classification:
  domain: fintech
  projectType: saas_b2b
title: __PROJECT_NAME__ — Product Requirements Document
subtitle: Suite SaaS modulaire pour TPE et PME d'Afrique francophone
markets: [Sénégal, Côte d'Ivoire]
version: 2.3
date: 2026-05-14
author: Marius
status: draft
inputDocuments: []
relatedDocuments:
  - architecture: ./__PROJECT_NAME__-Architecture-v2.0-extracted.md
  - validationReport: ./__PROJECT_NAME__-PRD-v2.0-Africa-validation-report.md
---

# __PROJECT_NAME__ — PRD v2.3

**Business Digital Suite for Africa**
**Suite complète de gestion d'entreprise** native Afrique francophone (10 modules en roadmap).
Marchés pilotes : Sénégal et Côte d'Ivoire — expansion UEMOA puis CEMAC.

> ✅ **Note de validation BMad (PRD v2.3 — 2026-05-14)** : ce PRD a été audité (rapport complet dans `__PROJECT_NAME__-PRD-v2.0-Africa-validation-report.md`), entièrement reconditionné, et étendu.
>
> **Lot 3 (restructuration BMad) + Lot 1 complet (5 décisions produit) + révisions v2.1/v2.2/v2.3** appliqués :
> - **#1.1** Facilitator pur (commission V1.5+)
> - **#1.2** KYC auto-déclaratif léger MVP (schéma swappable)
> - **#1.3** ~~Merge 3-way + LWW pour résolution conflits offline~~ — **RETIRÉE 2026-05-14** : MVP online-only (voir § 6.2 Résilience réseau)
> - **#1.4** IA in-product léger (OCR factures fournisseurs + assistant relances WhatsApp)
> - **#1.5** Persona Fatou en cible secondaire V1.5+ (focus MVP sur Aïssatou + Kouassi)
>
> **Extension vision v2.1 (2026-05-13)** : repositionnement de "trio commercial intégré" à "**suite complète de gestion d'entreprise native Afrique**". Roadmap modules étendue à **10 modules natifs** (3 MVP + 7 post-MVP) : Comptabilité, Achats, Inventaire, RH+Paie, POS mobile, Helpdesk, Immobilisations.
>
> **Révisions v2.2 (2026-05-14)** :
> 1. **Retrait offline-first MVP** : décision Lot 1 #1.3 invalidée, online-only confirmé. Économie scope ~10-15 jours dev. POS mobile Phase 4 nécessitera ré-introduction couche offline.
> 2. **Ajout onboarding entreprise § 5.1.2** : flow post-signup 8 étapes (incluant invitation équipes skippable).
> 3. **KPI § 12.1 enrichis** : onboarding completion rate, time, module adoption.
> 4. **Design System "Base et Brand" v3.0 intégré** : bundle complet dans `docs/design-system/`.
>
> **Révisions v2.3 (2026-05-14) — Intégration FNE Côte d'Ivoire (Loi de finances 2025)** :
> 1. **Nouveau § 5.10 Module FNE Côte d'Ivoire** : 10 capabilities (certification auto, multi-établissement, monitoring stickers, retry async, audit 10 ans). Compliance obligatoire DGI CI dès lancement en Côte d'Ivoire.
> 2. **Multi-établissement / multi-point de vente** ajouté au modèle de données (1 org → N establishments → N points_of_sale).
> 3. **Architecture** : nouveau `packages/fne` dédié + schemas Drizzle + queue consumer asynchrone Workers Queue + cron monitoring stickers + routes UI settings.
> 4. **§ 5.4 et § 6.4 enrichis** avec mentions FNE. Glossaire complété (FNE, RNE, TERNE, NCC, B2B/B2C/B2G/B2F, codes TVA DGI).
>
> **MVP scope inchangé** — les révisions touchent vision long terme, roadmap, onboarding, stratégie réseau, et compliance régionale CI.
>
> Voir [Décisions tranchées Lot 1](#décisions-tranchées-lot-1). **Le PRD v2.3 est prêt pour `bmad-create-epics-and-stories`** (phase 3 BMad — Solutioning suite).

---

## 1. Résumé exécutif

### 1.1 Vision produit

**__PROJECT_NAME__ est la suite complète de gestion d'entreprise pour TPE et PME d'Afrique francophone.** Plateforme SaaS modulaire, mobile-first et performante en zones urbaines (4G/5G stables), conçue pour adresser progressivement l'ensemble des besoins de gestion d'une PME africaine : commercial, financier, logistique, ressources humaines, et opérationnel.

Cible prioritaire : Sénégal et Côte d'Ivoire au lancement, expansion UEMOA puis CEMAC.

**Stratégie modulaire en deux temps :**

- **MVP (mois 1-12)** : trio commercial intégré CRM + Facturation SYSCOHADA + Encaissements Mobile Money — adresse la douleur n°1 des PME africaines : **être effectivement payé**.
- **Post-MVP (mois 13-30)** : extension de la suite avec 7 modules supplémentaires (Comptabilité SYSCOHADA, Achats, Inventaire, RH+Paie, POS mobile, Helpdesk, Immobilisations) pour couvrir l'intégralité du cycle de gestion d'entreprise.

**Différenciation cumulative face à Sage Business Cloud, Odoo Online, SmartERP Webgram, Pennylane** : suites existantes positionnées comme généralistes desktop-first, faiblement adaptées au contexte africain (paiements mobile money natifs, faible bancarisation, connectivité 3G variable, conformité SYSCOHADA, WhatsApp Business comme canal B2B dominant, tarification FCFA).

### 1.2 Proposition de valeur

**Première suite complète de gestion d'entreprise native Afrique.** Au MVP, le trio commercial (CRM + Facturation SYSCOHADA + Encaissements Mobile Money) répond à la douleur n°1 des PME africaines — **être effectivement payé** — et constitue la première danger d'une suite modulaire qui s'étendra progressivement à 10 modules au total.

- **Modularité** : chaque PME active uniquement les modules utilisés.
- **Encaissements natifs mobile money** : Wave, Orange Money, Free Money, cartes locales via Paystack et Flutterwave.
- **Conformité SYSCOHADA** : facturation normalisée SN et CI, plan comptable OHADA, mentions légales obligatoires.
- **Mobile-first** : interface optimisée smartphones, design responsive natif, performance soignée pour les réseaux africains (bundle léger, P95 API < 300 ms).
- **WhatsApp Business intégré** : envoi de devis, factures et reçus via le canal B2B dominant en Afrique francophone.
- **IA in-product utile** : OCR factures fournisseurs (photo papier → digital en 10 sec) + assistant rédaction relances WhatsApp en français d'Afrique. Voir § 5.8.
- **Tarification entrée 5 000 FCFA/mois (7,60 €)** : abonnement annuel avec remise, paiement mobile money accepté.

### 1.3 Marché cible et ambition

Cible adressable : 1,8 million de TPE/PME en Côte d'Ivoire et au Sénégal, dont ~380 000 partiellement digitalisées (marché immédiat).

Segments adressés simultanément avec pricing par paliers :

- **TPE 1 à 5 personnes** (commerce, services, indépendants) : 60% du marché, prix d'entrée bas, acquisition par viralité Wave et bouche-à-oreille.
- **PME en croissance 5 à 30 personnes** : 30% du marché, cœur de cible, acquisition par content marketing et partenariats experts-comptables.
- **PME structurées 30 à 50 personnes** : 10% du marché, ticket moyen élevé, acquisition par sales B2B traditionnel.

### 1.4 Modèle économique

Abonnement SaaS mensuel ou annuel en FCFA, 5 paliers :

| Palier | Prix | Utilisateurs | Cible |
|---|---|---|---|
| Free | 0 FCFA | 1 user, 50 contacts, 10 factures/mois | Acquisition virale |
| Starter | 5 000 FCFA/mois | 3 users | TPE |
| Business | 15 000 FCFA/mois | 10 users | PME en croissance |
| Pro | 35 000 FCFA/mois | 25 users | PME structurées |
| Enterprise | 75 000 FCFA/mois | 50 users | Comptes premium |

**Deuxième source de revenus (V1.5+)** : commission sur les encaissements traités via la plateforme — **reportée post-MVP**. Voir [Décision Lot 1 #1.1](#décisions-tranchées-lot-1) : MVP en mode facilitator pur, sans détention de fonds ni commission, pour éviter les procédures d'agrément BCEAO et simplifier le lancement. Réintroduction à partir de M14+ après validation PMF.

> **Hypothèse revenu cible année 2 (M18)** : 150 clients PME × panier moyen 22 000 FCFA = **3,3M FCFA MRR (5 000 €)**. La commission encaissements (anciennement projetée à 2M FCFA additionnels à M18) est reportée à V1.5+ et chiffrée séparément lors de son introduction.

### 1.5 Différenciation concurrentielle

Cinq atouts cumulatifs :

1. **Suite complète de gestion d'entreprise native Afrique** — vs Sage Business Cloud et Odoo Online qui proposent des suites généralistes inadaptées (pas de mobile money natif, pas de SYSCOHADA natif, desktop-first, FCFA absent ou mal géré). __PROJECT_NAME__ démarre par le trio commercial intégré (combo inédit en 2026 sur Wave + OHADA + WhatsApp), puis étend la suite à 10 modules natifs Afrique (voir roadmap § 5.9 et § 7).
2. **Stack edge-first** (TanStack Start, Cloudflare Workers, POPs Afrique) pour latence Dakar/Abidjan < 300 ms P95, vs stacks 2005-2015 des concurrents (PHP, .NET).
3. **Mobile-first authentique** : interface conçue smartphone en priorité (bundle léger, gestures touch, formulaires optimisés) vs versions mobiles tardives des concurrents desktop-first.
4. **Tarification transparente en FCFA** vs grilles EUR/USD des solutions importées.
5. **IA in-product pragmatique** : OCR factures fournisseurs (photo → digital, gain ~30 min/jour pour un PME qui traite 5-10 factures fournisseurs papier par jour) + assistant rédaction relances WhatsApp localisé (français d'Afrique). Pas d'AI-washing — 2 features mesurables qui résolvent des problèmes concrets.
6. **Vélocité produit solo founder + IA dev** : itération 3-5× plus rapide qu'une équipe full-stack équivalente (Claude Code, Codex, GitHub Copilot pour le build — voir § 8).

---

## 2. Contexte et marché

### 2.1 Marché des PME en Afrique francophone

L'Afrique francophone compte plus de 7 millions de TPE et PME, dont 90% dans le secteur informel. Trois tendances de fond accélèrent la transformation digitale :

1. **Explosion du mobile money** : 709M comptes actifs en Afrique subsaharienne, 1 000+ milliards USD de transactions annuelles. Wave, Orange Money, Free Money, MTN MoMo et Airtel Money structurent les flux économiques quotidiens.
2. **Démocratisation des cartes hybrides** : Wave Card, Orange Bank Africa, Free Money Card, cartes virtuelles wallet — l'acceptation paiement par carte se redéfinit pour les commerces.
3. **Urbanisation et jeunes entrepreneurs hyper-connectés** : Dakar, Abidjan, Lagos, Nairobi, Casablanca concentrent une démographie 25-40 ans nativement digitale, pilotant des entreprises modernes avec outils technologiques en retard de 10 à 15 ans vs standards mondiaux.

### 2.2 Focus sur les marchés pilotes

#### Sénégal

- Population : 17,7 M habitants, 50% urbains
- PIB : 31 Md USD, croissance estimée 8% en 2026 (hydrocarbures)
- TPE/PME : ~450 000 entreprises formelles, dont 60 000 PME structurées
- Pénétration mobile money : 78% des adultes (Wave 8M actifs, Orange Money 4M, Free Money 2M)
- Conformité : SYSCOHADA OHADA, facture normalisée DGI depuis 2018, e-facturation en préparation
- Langue : français (écrits professionnels), wolof
- Hub tech : Dakar — Wave HQ, Orange Digital Center, CTIC, Jokkolabs

#### Côte d'Ivoire

- Population : 28 M habitants, croissance démographique soutenue
- PIB : 79 Md USD, une des économies les plus dynamiques d'Afrique de l'Ouest
- TPE/PME : ~1,4 M entreprises, dont 320 000 dans le secteur formel
- Pénétration mobile money : 72% des adultes (Wave depuis 2021, MTN MoMo, Orange Money, Moov Money)
- Conformité : SYSCOHADA OHADA, e-facturation en cours de déploiement obligatoire (DGI CI)
- Langue : français (sphère professionnelle), dialectes locaux
- Hub tech : Abidjan-Plateau et Zone 4 — Flutterwave, Paystack, Wave

### 2.3 Concurrence et positionnement

| Concurrent | Force | Faiblesse | Prix mensuel |
|---|---|---|---|
| SmartERP Webgram | Présent 17 pays, OHADA natif | UX datée, mobile faible, pas d'encaissements | 25 000 à 80 000 FCFA |
| Sage Business Cloud | Réputation, experts-comptables | Cher, complexe, non mobile-first | 30 000 à 120 000 FCFA |
| Pennylane | Compta moderne, FR récent | Focus compta, peu adapté Afrique, EUR | À partir de 19 000 FCFA |
| Odoo Online | Modulaire, open source | Pas de mobile money natif, complexité config | À partir de 15 000 FCFA |
| ERPNext | Gratuit self-hosted, FR francisé | Pas SaaS managé, support limité | 0 à 25 000 FCFA hébergé |
| Wave Business | Mobile money excellent | Pas de CRM, pas de facturation complète | Gratuit + commissions |
| **__PROJECT_NAME__** | **Trio intégré, mobile-first, OHADA** | **À construire, marque inconnue** | **5 000 à 75 000 FCFA** |

**Insight stratégique** : aucun acteur ne propose en 2026 une **suite complète de gestion d'entreprise native Afrique francophone** combinant trio commercial intégré (CRM + Facturation + Encaissements Mobile Money + SYSCOHADA + WhatsApp Business) ET une roadmap modules back-office et opérationnels (Comptabilité, Achats, Inventaire, RH+Paie, POS mobile, Helpdesk, Immobilisations). Sage et Odoo offrent des suites complètes mais inadaptées. SmartERP et Pennylane couvrent partiellement le commercial sans la vision suite complète Afrique. **Espace produit non occupé sur la dimension "suite native Afrique francophone".**

### 2.4 Tendances et opportunités

- Obligation progressive facture électronique SN et CI d'ici 2027 → demande massive de solutions conformes.
- AfCFTA (Zone de libre-échange continentale africaine) facilite l'expansion régionale SaaS panafricaine.
- Wave a démocratisé le mobile money payant → ouverture aux services à valeur ajoutée.
- Génération 25-40 ans urbaine nativement digitale exige des outils modernes.
- Experts-comptables locaux cherchent activement des outils SaaS pour moderniser leur offre PME.

---

## 3. Personas et cas d'usage

### 3.1 Personas principaux

> **Note de scope MVP (décision Lot 1 #1.5, 2026-05-13)** : 2 personas en cibles principales MVP (Aïssatou + Kouassi). Fatou est conservée comme **cible secondaire V1.5+** — son parcours détaillé reste documenté (§ 3.4) pour préserver la vision long terme, mais l'acquisition marketing MVP se concentre sur les TPE et PME locales SN+CI.

#### Aïssatou — Gérante salon de coiffure, Dakar Plateau *(cible principale MVP, ~60% acquisition)*

- 32 ans, 3 employés, 50 clients réguliers, CA mensuel 1,2 MFCFA
- **Besoins** : encaisser facilement via Wave, suivre paiements en attente, envoyer factures simples par WhatsApp
- **Plan** : Starter 5 000 FCFA/mois, paiement mensuel via Wave depuis son téléphone
- **Acquisition** : recommandation par sa coopérative de coiffeuses, démo en présentiel à Dakar

#### Kouassi — Dirigeant PME distribution alimentaire, Abidjan Yopougon *(cible principale MVP, ~30% acquisition)*

- 45 ans, 12 employés, CA mensuel 35 MFCFA, multi-points de vente
- **Besoins** : centraliser contacts clients, émettre factures conformes SYSCOHADA, suivre paiements de 200 clients réguliers, exporter pour son expert-comptable
- **Plan** : Business 15 000 FCFA/mois, abonnement annuel avec remise 20% (144 000 FCFA), payé par carte Visa
- **Acquisition** : recommandé par son expert-comptable partenaire __PROJECT_NAME__, démo en visioconférence puis onboarding accompagné

#### Fatou — Fondatrice agence digitale, Dakar Almadies *(cible secondaire V1.5+, ~10% acquisition cible long terme)*

- 29 ans, 8 collaborateurs, CA annuel 80 MFCFA, clients au Sénégal et en France
- **Besoins** : pipeline commercial de 30 prospects actifs, devis et factures professionnels en FCFA et EUR, encaissement clients africains en Wave et clients européens en carte Stripe
- **Plan** : Pro 35 000 FCFA/mois, paiement par carte hybride Wave
- **Acquisition** : découverte via LinkedIn et content marketing, inscription self-service
- **Statut MVP** : capacités techniques nécessaires (multi-devise FCFA/EUR/USD § 5.4, intégration Stripe § 5.5) **conservées dans le MVP** car utiles à tout client Pro/Enterprise ayant des activités export. Le **focus marketing/acquisition** vers ce segment est en revanche reporté à V1.5+ (canal LinkedIn diaspora + content marketing tech) pour préserver le focus MVP sur Aïssatou + Kouassi.

### 3.2 Parcours utilisateur — Aïssatou (journée type)

- **8h** : consulte __PROJECT_NAME__ sur smartphone. Tableau de bord : 3 clientes attendues aujourd'hui, 2 factures impayées > 7 jours, 285 000 FCFA encaissés cette semaine.
- **10h** : nouvelle cliente pour un soin. Crée le contact en 30 secondes (nom, téléphone). Soin coûte 25 000 FCFA. Génère lien de paiement Wave envoyé par WhatsApp à la cliente.
- **10h05** : cliente paie via Wave en 20 secondes. Facture passe automatiquement en statut payé. Aïssatou reçoit notification push (latence < 5 secondes après webhook Wave). Reçu PDF envoyé automatiquement par WhatsApp à la cliente.
- **18h** : consulte rapport quotidien. Détail des paiements reçus, totaux jour/semaine.
- **Samedi** : relance ses 2 clientes en retard en 1 clic. Message WhatsApp pré-rempli avec nom de la cliente et montant dû.

### 3.3 Parcours utilisateur — Kouassi (journée type)

- **9h** : réunion équipe commerciale. __PROJECT_NAME__ affiche pipeline en mode kanban : 30 prospects actifs, 8 en phase finale de négociation pour un CA potentiel de 25 MFCFA.
- **11h** : commande importante de 4,5 MFCFA signée. Son commercial Yao convertit l'opportunité en devis en 1 clic, puis devis accepté → facture SYSCOHADA conforme également en 1 clic (workflow opportunité → devis → facture totalisant 2 clics). Facture envoyée par email et WhatsApp au client. Lien de paiement multi-méthodes inclus.
- **15h** : client paie 2,5 MFCFA par virement bancaire (acompte). __PROJECT_NAME__ enregistre le paiement partiel et met à jour la facture. Solde de 2 MFCFA marqué à recevoir avec échéance dans 30 jours.
- **Fin de mois** : Kouassi exporte ses données vers son expert-comptable au format SYSCOHADA. Pas de re-saisie, pas d'erreur. Son expert valide en 2 heures ce qui prenait 2 jours auparavant.

### 3.4 Parcours utilisateur — Fatou (multi-devise, mois 1 et mois 6) — *cible V1.5+*

> **Note de positionnement** : ce parcours documente la cible secondaire diaspora/agence digitale, dont l'acquisition marketing est reportée à V1.5+ (décision Lot 1 #1.5). Conservé ici pour préserver la vision produit long terme et permettre les arbitrages futurs sans rework. Les capacités techniques requises (multi-devise EUR/FCFA/USD, intégration Stripe) sont déjà couvertes par le MVP § 5.4 et § 5.5.

#### Mois 1 — Onboarding et premier devis multi-devise

- Inscription self-service après lecture article LinkedIn. Sélection pays Sénégal, ajout 8 collaborateurs.
- Crée pipeline kanban avec 30 prospects (15 SN en FCFA, 15 FR en EUR).
- Émet premier devis EUR à client français : 4 500 €. Devis converti en facture EUR conforme, envoyée par email. Lien de paiement Stripe (carte internationale) inclus.
- Émet premier devis FCFA à client sénégalais : 2 800 000 FCFA. Lien de paiement multi-méthodes (Wave + carte locale) inclus.

#### Mois 6 — Rétention, expansion modulaire (couvre churn/LTV/NPS)

- Tableau de bord 6 mois : 23 factures émises (12 EUR, 11 FCFA), encaissements 18,5 MFCFA + 14 200 €. Taux d'encaissement < 30 jours : 87%.
- Active le module Comptabilité (Phase 2) en self-service depuis page Billing — bascule du plan Pro au plan Pro + Comptabilité (passage à Enterprise considéré au mois 12).
- Renouvelle abonnement annuel (remise 20% sur 12 mois × 35 000 = 336 000 FCFA).
- Recommande __PROJECT_NAME__ à 2 autres agences digitales dakaroises via le programme de parrainage (1 mois gratuit par parrainage activé).
- Répond au questionnaire NPS in-app au 6e mois (note 9/10, raison : "le seul outil qui gère FCFA + EUR sans bricoler").

---

## 4. Contraintes architecturales business-driven

> **Note BMad** : la pile technique détaillée, les décisions architecturales et l'architecture paiements multi-providers sont documentées dans [`__PROJECT_NAME__-Architecture-v2.0-extracted.md`](./__PROJECT_NAME__-Architecture-v2.0-extracted.md). Cette section conserve uniquement les **contraintes architecturales dérivées du métier**, qui appartiennent au PRD.

### 4.0 Surfaces produit

__PROJECT_NAME__ expose **3 surfaces distinctes**, chacune avec une audience, un domaine et un cycle de release autonome. La séparation est dictée par la divergence des audiences (clients TPE/PME vs équipe interne) et des contraintes (frontend SEO-friendly vs backend API stateless).

| Surface | Audience | Domaine | Stack | Périmètre |
|---|---|---|---|---|
| **`apps/suite`** | Propriétaires TPE/PME + leurs équipes au Sénégal et en Côte d'Ivoire | `app.__PROJECT_SLUG__.com` + pages publiques sur `__PROJECT_SLUG__.com` | TanStack Start v1 (SSR) sur Cloudflare Workers (POPs Lagos, Nairobi, Cape Town, Casablanca, Johannesburg) | Pages publiques (landing, pricing, blog SEO francophone), onboarding 8 étapes, dashboards par module (Facturation, Encaissements, CRM), liens de paiement publics, FNE pour les orgs CI |
| **`apps/admin`** | Équipe __PROJECT_NAME__ (support, ops, fondateur) | `admin.__PROJECT_SLUG__.com` (auth séparée, IP whitelisting envisagé) | Identique à `apps/suite` (TanStack Start sur Cloudflare Workers) | Gestion des organisations clientes, monitoring opérationnel, support, modération KYC, gestion des incidents FNE |
| **`apps/api`** | Consommé exclusivement par `apps/suite` et `apps/admin` (puis V1.5+ : API publique tierce) | `api.__PROJECT_SLUG__.com` | Hono + tRPC (`@__SCOPE__/rpc`) + Drizzle ORM + Cloudflare Workers | Toutes les procedures tRPC, webhooks PSP, queues FNE / notifications / events, cron jobs, healthchecks |

**Source unique du design system** : `packages/ui` ("Base & Brand v3.0") — tokens CSS, fontes Fraunces self-hosted, composants shadcn thémés, primitives custom __PROJECT_NAME__ (`KPI`, `EditorialQuote`, `PetalSymbol`, `MoneyDisplay`, `StatusDot`). **Consommé par** `apps/suite` et `apps/admin` (jamais inline). Référence détaillée : `docs/design-system/project/SKILL.md` + ADR 0007.

> Pour le détail de la pile technique (compute, hosting, drivers DB, providers), voir l'architecture (`_bmad-output/planning-artifacts/architecture.md`) et les ADRs (`docs/adrs/0001` à `0009`).

### 4.1 Contraintes infrastructures dérivées du marché

- **Latence Dakar/Abidjan** : hébergement avec POPs en Afrique de l'Ouest obligatoire (Lagos, Nairobi, Cape Town, Casablanca, Johannesburg) — sinon P95 API > 600 ms inacceptable pour mobile-first.
- **Connectivité variable** : MVP online-only, mais performance soignée pour réseaux 4G/5G stables des zones urbaines SN/CI. Retry exponentiel TanStack Query + brouillon localStorage de courtoisie pour formulaires longs. Offline-first reporté V2+ si besoin (POS mobile Phase 4 pourrait nécessiter un re-design partiel).
- **Hébergement données** : possible co-localisation avec POPs Afrique selon évaluation latence vs coût (à arbitrer en phase Architecture).

### 4.2 Contraintes intégrations dérivées de la value-prop

Intégrations PSP UEMOA natives obligatoires (sans dépendance à un agrégateur tiers pour le PSP dominant Wave) :

- **Wave Business API directe** (Sénégal + Côte d'Ivoire) — value-prop différenciateur, PSP de référence
- **Orange Money** via agrégateur (Flutterwave acceptable)
- **Free Money** via agrégateur (Flutterwave acceptable)
- **Cartes locales** (Wave Card, Orange Bank, Free Money Card) via Paystack
- **Cartes internationales** (Visa, Mastercard, Amex) via Stripe pour clients export

### 4.3 Architecture paiements — deux flux distincts (vue produit)

> Détails techniques : voir [Architecture v2.0](./__PROJECT_NAME__-Architecture-v2.0-extracted.md#architecture-paiements).

#### Flux 1 — Subscription billing (__PROJECT_NAME__ encaisse ses clients PME)

- TPE et indépendants : Wave Direct Pay pour SN+CI (commissions minimes)
- PME mid-market : cartes locales via Paystack (Wave Card, Orange Bank, Free Money Card)
- Comptes export : Stripe pour cartes internationales
- Abonnement annuel : virement bancaire avec validation manuelle

#### Flux 2 — Encaissements clients finaux (les PME utilisatrices encaissent leurs propres clients)

**Modèle MVP : facilitator pur** — __PROJECT_NAME__ ne détient jamais les fonds. Les PSP partenaires (Wave Business, Paystack, Flutterwave, Stripe) conservent les fonds et reversent directement au compte du PME.

- Génération de liens de paiement multi-méthodes (le client final choisit son moyen)
- Wave Business API pour transferts directs Wave (reversement direct au compte Wave du PME)
- Flutterwave et Paystack comme PSP agrégateurs pour les autres méthodes
- Virement bancaire accepté comme moyen d'encaissement (avec validation manuelle ou rapprochement OCR — voir FR § 5.5)
- Webhooks de réconciliation automatique vers factures émises (__PROJECT_NAME__ reçoit l'événement de paiement, met à jour le statut facture, mais n'a jamais transité les fonds)
- **Aucune commission encaissements au MVP** — la commission 1% (annoncée § 1.4) est reportée à V1.5+ et nécessitera un arbitrage technique séparé (split-payment via PSP vs facturation mensuelle séparée).

> ✅ **Décision Lot 1 #1.1 actée (2026-05-13)** : modèle facilitator pur retenu pour le MVP. Élimine la nécessité d'un agrément BCEAO PSP, raccourcit le time-to-market de 6-18 mois. Voir [Décisions tranchées](#décisions-tranchées-lot-1).

---

## 5. Spécifications fonctionnelles

### 5.1 Core — Identity et Tenancy

#### 5.1.1 Inscription (signup)

- Inscription par email/mot de passe avec vérification email obligatoire
- Inscription par numéro de téléphone avec OTP SMS (essentiel pour cible TPE non email-natif)
- Inscription OAuth Google et Microsoft
- MFA TOTP optionnelle pour users, obligatoire pour owners
- Création d'organisation associée au signup (saisie minimale : nom entreprise + pays au signup, le reste profilé en § 5.1.2 onboarding)
- Switch entre organisations (un utilisateur peut être membre de plusieurs PME)
- Gestion des sessions actives avec révocation (1 session par device, max 5 sessions actives par utilisateur)
- Reset de mot de passe avec lien sécurisé (expiration 1 heure)
- Invitation utilisateurs supplémentaires : géré pendant § 5.1.2 onboarding Step 7 OU ad hoc depuis § 5.2 RBAC Settings (par email Resend ou WhatsApp Business, lien activation TTL 7 jours)

#### 5.1.2 Onboarding entreprise (post-inscription, 8 étapes)

**Déclenchement** : automatique après création du compte utilisateur, **bloquant l'accès à l'app** tant que les étapes obligatoires ne sont pas validées. Stocké dans `onboarding_progress` (resumable si interruption). Cible KPI § 12.1 "Activation rate 70% (≥ 3 factures émises dans 14 jours)".

**Step 1 — Profil entreprise** *(obligatoire)*

- Raison sociale + sigle (auto-suggestion depuis bases publiques RCCM SN/CI si disponible)
- NINEA (Sénégal) ou RCCM (Côte d'Ivoire) — saisie libre (KYC auto-déclaratif décision Lot 1 #1.2)
- Secteur d'activité (liste contrôlée : commerce, services, BTP, agriculture, distribution, restauration, beauté/coiffure, agence digitale, autre)
- Taille déclarée (TPE 1-5 / PME 5-30 / PME structurée 30-50)
- Adresse + ville (autocomplete villes principales SN/CI)
- Numéro fiscal/identification fiscale (optionnel au MVP, requis pour Pro/Enterprise)
- Pays de l'entreprise (Sénégal / Côte d'Ivoire au lancement — sélection au signup mais re-confirmation ici)

**Step 2 — Profil utilisateur (owner)** *(obligatoire)*

- Nom + prénom
- Téléphone (OTP vérification si pas déjà fait au signup)
- Rôle dans l'entreprise (gérant / dirigeant / comptable / commercial / autre)
- Langue préférée (FR-FR / FR-AF / EN / WO — défaut FR-AF si pays = SN/CI)

**Step 3 — Choix plan** *(obligatoire)*

- Free (par défaut sélectionné, limites affichées : 1 user, 50 contacts, 10 factures/mois)
- Starter / Business / Pro / Enterprise (avec essai 14 jours sur plans payants)
- Choix mensuel vs annuel (annuel = remise 20%)
- Moyens de paiement disponibles selon plan : Wave (mensuel), Wave/Paystack/Stripe (Business+), virement bancaire (annuel uniquement)

**Step 4 — Modules initiaux** *(recommandé, pré-cochés)*

- Trio MVP pré-coché par défaut : CRM light + Facturation SYSCOHADA + Encaissements Mobile Money
- Possibilité de désactiver Encaissements (si l'utilisateur n'a pas besoin de paiements digitaux)
- Possibilité d'activer Comptabilité SYSCOHADA dès qu'elle sera GA (Phase 3, M13-M15)
- Activation/désactivation modifiable à tout moment depuis § 5.3 Billing après onboarding

**Step 5 — Préférences** *(rapide)*

- Devise par défaut : FCFA (si pays = SN/CI), EUR (si activité export), USD (rare)
- Canaux notifications préférés (toggles) : email (on défaut), WhatsApp (on défaut), SMS (off défaut, on pour OTP uniquement), push web (on si autorisé navigateur)
- Heure préférée rapport quotidien : matin 8h / soir 18h / désactivé (défaut : matin 8h)
- Format date : long ("12 mai 2026") ou court ("12/05/2026") — défaut long

**Step 6 — Consentement KYC + CGU** *(obligatoire, traçabilité légale)*

- Acceptation CGU OHADA (lien vers PDF, checkbox obligatoire)
- Reconnaissance clause KYC rétroactif (décision Lot 1 #1.2) — disclaimer explicite que __PROJECT_NAME__ peut demander documents KYC à tout moment et suspendre le compte sous 30 jours en cas de refus
- Consentement traitement données personnelles (déclaration CDP Sénégal / ARTCI Côte d'Ivoire)
- Disclaimer IA in-product : information que photos de factures fournisseurs (OCR § 5.8.1) et contextes clients (assistant relances § 5.8.2) sont envoyés à Anthropic + OpenAI (engagement zero data retention contractuel)
- Tout consentement enregistré dans `consent_log` avec horodatage + IP + user_agent (traçabilité 10 ans OHADA)

**Step 7 — Invitation des équipes** *(skippable, lié au plan)*

- Adapté aux limites du plan choisi (Step 3) : Free 1 user (étape sautée auto), Starter 3 users (jusqu'à 2 invitations), Business 10 users (jusqu'à 9), Pro 25 users (jusqu'à 24), Enterprise 50 users (jusqu'à 49)
- Saisie email OU téléphone WhatsApp par invité (multi-canal selon contact disponible)
- Attribution rôle RBAC par invité (owner / admin / member / guest)
- Optionnel : assignation de modules spécifiques à l'invité (ex : comptable interne → accès Comptabilité + Facturation read-only)
- Message d'invitation personnalisable (template par défaut en FR avec mention de l'entreprise)
- Envoi via canal choisi (email Resend OU WhatsApp Business OU SMS Twilio)
- L'invité reçoit un lien d'activation (TTL 7 jours) avec son propre flow d'onboarding minimal (Steps 2 + 5 + 6, pas 1/3/4/7/8 qui sont owner-only)
- Bouton **"Passer cette étape"** disponible (skippable) — l'invitation est faisable à tout moment depuis § 5.2 RBAC Settings

**Step 8 — Tour guidé** *(skippable)*

- Écran de bienvenue : "Bienvenue sur __PROJECT_NAME__, {prénom} ! Votre suite est prête."
- CTA principal : "Créer ma première facture →" (déclenche onboarding module Facturation)
- CTA secondaire : "Faire le tour produit en 3 min" (overlay guide interactif Shepherd.js ou équivalent)
- CTA tertiaire : "Passer et explorer" (skip total, dashboard direct)
- L'utilisateur peut relancer le tour à tout moment depuis le menu profil

**Réversibilité onboarding** : tous les paramètres saisis pendant l'onboarding sont modifiables ultérieurement depuis les settings respectifs. L'onboarding ne se relance pas (sauf reset manuel par owner).

#### 5.1.3 Onboarding par module (distinct de 5.1.2)

**Déclenchement** : à chaque activation d'un module (initial via Step 4 onboarding entreprise, ou ultérieur via § 5.3 Billing). Chaque module a son propre tour de setup spécifique. **Non bloquant** pour l'accès au module — l'utilisateur peut sauter et y revenir plus tard. Tracking dans `module_onboarding_progress`.

**Module Facturation SYSCOHADA — onboarding**

1. Upload logo entreprise (recommandé) + saisie mentions légales obligatoires (NINEA/RCCM, régime fiscal, adresse complète)
2. Configurer template facture par défaut (couleur d'accent depuis design system Base/Brand ; sélection style classique vs moderne)
3. Configurer TVA par défaut (18% SN ou 18%/9% CI selon pays Step 1)
4. Configurer relances automatiques (J+7 / J+15 / J+30 par défaut, modifiable)
5. Configurer numérotation initiale (suffixe année par défaut : `FAC-2026-0001`)
6. Créer ta première facture (formulaire guidé en 3 sous-étapes : client → lignes → envoi)
7. Marquer onboarding Facturation = ✅ complété → +1 vers KPI activation

**Module Encaissements Mobile Money — onboarding**

1. Connecter Wave Business (OAuth ou clé API selon disponibilité Wave Direct API)
2. Optionnel : connecter Paystack (cartes locales + multi-MM via Flutterwave)
3. Optionnel : connecter Stripe (cartes internationales / clients export)
4. Configurer compte de réversement (RIB ou compte Wave Business du PME — KYC sub-merchant si requis par PSP)
5. Tester un paiement test 100 FCFA via sandbox PSP (preuve de bout-en-bout fonctionnelle)
6. Configurer notifications post-paiement (canaux selon préférences Step 5)
7. Marquer onboarding Encaissements = ✅ complété

**Module CRM light — onboarding**

1. Import contacts existants (CSV upload optionnel, mapping colonnes guidé) OU saisie de 5 contacts initiaux
2. Configurer pipeline kanban : 5 étapes par défaut (Prospect → Devis envoyé → Négo → Signé → Perdu) — modifiables (jusqu'à 5 étapes plan Pro/Enterprise)
3. Créer ta première opportunité guidée (lier à un contact, montant FCFA, échéance)
4. Configurer tags et segments (suggestions selon secteur d'activité Step 1)
5. Marquer onboarding CRM = ✅ complété

**Modules post-MVP** : chaque module post-MVP (Comptabilité, Achats, Inventaire, RH+Paie, POS, Helpdesk, Immobilisations) aura son propre onboarding documenté lors de sa release. Pattern commun : (a) connexion services externes éventuels, (b) templates par défaut, (c) premier objet créé, (d) marquage complétion.

### 5.2 Core — RBAC

- Quatre rôles prédéfinis : owner, admin, member, guest
- Permissions granulaires au format `module:resource:action`
- Rôles custom configurables (plans Pro et Enterprise)
- Audit log de toutes les modifications de permissions

### 5.3 Core — Billing et Subscription

- Inscription gratuite avec accès Free immédiat
- Upgrade vers plan payant via Stripe, Paystack ou Wave selon préférence client
- Paiement mensuel ou annuel (remise 20% sur annuel)
- **Gestion d'un portefeuille de moyens de paiement** : jusqu'à 5 moyens de paiement actifs simultanément (cartes, Wave, Orange Money, Free Money, virement enregistré), avec sélection d'un par défaut
- Activation/désactivation de modules en self-service
- Facturation au prorata des changements en cours de période
- Page billing : historique, factures téléchargeables, méthodes de paiement
- Webhooks Stripe/Paystack/Wave pour synchronisation des activations
- Période d'essai 14 jours sur tous les plans payants
- Notifications de renouvellement à J-7 et J-1
- Gestion des paiements échoués avec retry automatique (3 tentatives sur 7 jours)

### 5.4 Module Facturation SYSCOHADA

- Création de devis avec lignes produits/services depuis catalogue ou ad hoc
- Personnalisation : logo, mentions légales, conditions de paiement
- Envoi de devis par email, WhatsApp ou SMS (lien public sécurisé)
- Acceptation client en ligne (signature digitale simple par OTP SMS)
- Conversion automatique devis accepté en facture en 1 clic
- Factures conformes SYSCOHADA : numérotation continue, mentions obligatoires (NINEA, RCCM, régime fiscal)
- Support TVA multi-taux et exonérations spécifiques (18% normal SN, 18% normal CI, 9% réduit CI, exonérations première nécessité)
- Multi-devises : FCFA, EUR, USD avec conversion automatique (taux BCEAO + Banque de France pour EUR)
- Relances automatiques configurables : J+7, J+15, J+30
- Relances par WhatsApp avec template pré-rempli (nom client + montant + lien paiement)
- Génération de reçus PDF automatiques à la réception de paiement
- **Envoi automatique des reçus PDF par WhatsApp** (ou email si client sans WhatsApp) — confirmé sous 1 minute après confirmation paiement
- Export comptable SYSCOHADA (format CSV ou export direct vers logiciels expert-comptable partenaires)
- Génération automatique du lien de paiement multi-méthodes sur chaque facture
- **Certification FNE Côte d'Ivoire automatique** (organisations CI uniquement) : à l'émission d'une facture, certification asynchrone via API DGI FNE → ajout QR code + visuel FNE + référence DGI (`9606123E25000000019`) sur le PDF. Mode dégradé si API DGI down (retry exponentiel). Détails dans § 5.10 Module FNE.

### 5.5 Module Encaissements Mobile Money

- Création de liens de paiement standalone (sans facture liée)
- Liens de paiement multi-méthodes : Wave, Orange Money, Free Money, cartes, virement
- Le client final choisit son moyen de paiement préféré sur la page de paiement
- QR code généré pour paiement en présentiel
- Intégration Wave Business API directe (Sénégal et Côte d'Ivoire)
- Intégration Orange Money via Flutterwave
- Intégration Free Money via Flutterwave
- Intégration cartes locales (Wave Card, Orange Bank, Free Money Card) via Paystack
- Intégration cartes internationales (Visa, Mastercard, Amex) via Stripe
- **Acceptation virement bancaire** comme moyen d'encaissement client final (rapprochement manuel ou via import relevé bancaire CSV — automatisation OCR en V1.5)
- Webhooks de confirmation automatique avec mise à jour facture
- Réconciliation auto : matching entre paiement reçu et facture émise (clé : montant + référence)
- Gestion des paiements partiels (acomptes, soldes, échéanciers)
- **Notifications post-paiement** : dispatch < 5 secondes après confirmation webhook PSP, sur 3 canaux (push, email, WhatsApp). Délai mesuré entre `webhook.received_at` et `notification.dispatched_at`
- **Tableau de bord encaissements** : flux 24h glissantes, totaux jour/semaine/mois, top 5 clients du mois. Rafraîchissement automatique toutes les 10 secondes (polling) ou push instantané via SSE sur événement webhook
- Export des transactions pour réconciliation bancaire (CSV + format FEC SYSCOHADA)
- **Commission encaissements : aucune au MVP** (facilitator pur). Réintroduction V1.5+ après validation PMF — mécanique technique à arbitrer (split-payment vs facturation mensuelle).

### 5.6 Module CRM light

- Gestion des contacts personnes : nom, prénom, téléphone, email, WhatsApp
- Gestion des contacts entreprises : raison sociale, NINEA/RCCM, secteur d'activité
- Tags et segments pour catégoriser les contacts
- Pipeline d'opportunités en mode kanban (jusqu'à 5 étapes configurables)
- Création d'opportunités liées à un contact, montant FCFA, probabilité, échéance
- Conversion opportunité → devis en 1 clic
- Historique des interactions par contact (devis, factures, paiements, messages)
- Recherche full-text sur contacts et opportunités
- Import CSV de contacts existants
- Export CSV pour sauvegarde ou analyse externe
- Vue 360° du client : toutes les interactions et transactions sur une seule page

> **Note scope MVP** : le CRM light du MVP n'inclut pas les fonctionnalités avancées (activités planifiées, scoring automatique, segmentation marketing complexe, intégration email marketing). Ajout en V1.5 selon retours bêta.

### 5.7 Services partagés (cross-modules)

- **Notifications multi-canal** : email (Resend), WhatsApp Business API, SMS (Twilio Africa) — interface unifiée appelable depuis tous les modules
- **WhatsApp Business** : envoi templates et messages depuis Facturation, CRM, Encaissements (canal B2B principal)
- **Files** : stockage objet avec POPs Afrique, upload optimisé pour faibles débits
- **Catalogue produits** : produits/services unifiés, conformes exigences fiscales locales
- **Carnet contacts central** : partagé entre Facturation, CRM, Encaissements

### 5.8 Capacités IA in-product (décision Lot 1 #1.4)

**Périmètre MVP** : 2 features IA ciblées, intégrées aux modules existants, à fort ROI utilisateur et faible coût opérationnel (~20-40 €/mois pour 50 clients à M14).

#### 5.8.1 OCR factures fournisseurs (intégration § 5.4)

**Capability** : transformer une photo de facture fournisseur papier en facture fournisseur structurée dans __PROJECT_NAME__, en moins de 10 secondes de validation utilisateur.

- L'utilisateur prend une photo de la facture fournisseur depuis son smartphone (web app + permission caméra § 6.9)
- Upload vers __PROJECT_NAME__, déclenchement OCR via API Vision (Claude Sonnet vision ou GPT-4o-mini vision, à arbitrer en phase Architecture sur ratio précision/coût)
- Extraction automatique : fournisseur (nom + NINEA/RCCM si présent), date facture, numéro facture, montant HT, TVA (taux + montant), montant TTC, lignes principales (jusqu'à 10)
- Création d'un brouillon "facture fournisseur en attente" dans __PROJECT_NAME__
- Utilisateur valide ou corrige les champs en 10 secondes max
- Une fois validé : la facture fournisseur entre dans le module Comptabilité (Phase 2) pour rapprochement automatique
- **Taux de précision cible** : > 90% sur factures bien éclairées, > 75% sur factures dégradées (papier froissé, photo floue, écriture manuscrite partielle)
- **Latence cible** : OCR + extraction < 5 secondes en P95
- **Fallback** : si confiance OCR < 50%, le brouillon est créé mais marqué "vérification recommandée" en rouge — l'utilisateur saisit manuellement
- **Limites MVP** : 1 facture par photo (pas de multi-pages), max 50 OCR/mois/client en Free, 200/mois en Starter, illimité Business+
- **Use case Afrique** : 90% des factures fournisseurs des PME africaines sont sur papier (transporteurs, fournisseurs informels, marchés). Cette feature économise ~30 min/jour à un PME qui traite 5-10 factures fournisseurs par jour.

#### 5.8.2 Assistant rédaction relances WhatsApp (intégration § 5.4)

**Capability** : générer automatiquement un message WhatsApp de relance personnalisé selon le contexte de la facture impayée, dans le ton et la langue choisis.

- Déclenchement : utilisateur clique "Relancer par WhatsApp" sur une facture impayée (échue ou échéance proche)
- Contexte fourni à l'IA : nom client, montant dû, jours de retard, historique de paiement (à temps / en retard / litigieux), langue préférée du client (si renseignée), ton choisi (3 options : amical / neutre / ferme)
- Modèle utilisé : Claude Haiku ou GPT-4o-mini (text), prompt template optimisé pour brièveté et professionnalisme
- Langues supportées MVP : français de France, français d'Afrique (vocabulaire commercial local), wolof basique (SN). Anglais V1.5+.
- Sortie : message WhatsApp prêt à envoyer (< 350 caractères pour passer en 1 bulle), avec emojis sobres adaptés au ton, lien de paiement multi-méthodes inclus automatiquement
- L'utilisateur peut **éditer** le message avant envoi ou **le régénérer** (variation de ton)
- **Latence cible** : génération < 2 secondes en P95
- **Limites MVP** : 30 générations/mois/client en Free, 200/mois en Starter, illimité Business+
- **Pas de fine-tuning custom au MVP** — prompts template avec contexte client suffisent. Fine-tuning envisageable V2 si volume justifie.

#### 5.8.3 Dépendance externe et architecture (rappel § 6.x et Architecture § 9)

- Dépendance critique : disponibilité API Anthropic / OpenAI. SLA cible : > 99,5% (les deux providers sont historiquement au-dessus).
- **Stratégie multi-provider** : abstraction `AIProvider` permettant de basculer Anthropic ↔ OpenAI sans changer le code applicatif. Choix par défaut MVP : Anthropic (Claude Sonnet vision + Haiku text).
- **Fallback dégradé** : si API IA indisponible > 30s, désactivation temporaire des features IA avec message utilisateur "IA temporairement indisponible, saisie manuelle" — pas d'erreur bloquante.
- **Privacy** : les factures fournisseurs photographiées contiennent des données sensibles (RIB éventuels, mentions confidentielles). Engagement contractuel data-processing avec Anthropic/OpenAI (zero data retention, pas d'usage pour entraînement).

#### 5.8.4 Roadmap features IA (post-MVP)

| Feature IA | Phase | Description |
|---|---|---|
| OCR factures fournisseurs | MVP (P1, M5-M9) | Voir § 5.8.1 |
| Assistant rédaction relances | MVP (P1, M5-M9) | Voir § 5.8.2 |
| Catégorisation auto SYSCOHADA | V1.5 / Phase 2 Comptabilité (M11-M14) | Suggestion compte SYSCOHADA depuis libellé facture |
| Prédiction churn client | V2 (M18+) | Score risque client (vert/orange/rouge) avec alertes proactives |
| Assistant pré-remplissage devis | V2 (M18+) | Suggestion lignes devis depuis historique + contexte client |
| Détection paiements suspects | V2 (M18+) | Boost § 6.3 fraud prevention via ML sur patterns transactionnels |

### 5.9 Modules post-MVP — Roadmap fonctionnelle de la suite complète

**Vision long terme** : __PROJECT_NAME__ couvre l'intégralité du cycle de gestion d'une PME africaine via **10 modules natifs** (3 MVP + 7 post-MVP). Les modules sont **activables/désactivables en self-service** depuis la page Billing (§ 5.3), chaque module ayant son propre pricing additionnel ou inclus dans les paliers Business+.

**Séquencement post-MVP :**

| # | Module | Phase | Période | Logique d'enchaînement |
|---|---|---|---|---|
| 1 | Comptabilité SYSCOHADA | Phase 3 | M13-M15 | Automatise la comptabilité depuis Facturation + Encaissements MVP |
| 2 | Achats et fournisseurs | Phase 3 | M15-M17 | Alimente Comptabilité, exploite l'OCR factures fournisseurs § 5.8.1 déjà dispo MVP |
| 3 | Inventaire et stocks | Phase 3 | M16-M18 | Lié au Catalogue produits Tier 2 + à Achats (flux entrée stock) |
| 4 | RH simplifié + Paie | Phase 4 | M19-M21 | Indépendant des modules commerciaux, ajoute volet personnel |
| 5 | POS mobile (Point de Vente) | Phase 4 | M22-M24 | Lié à Inventaire et Encaissements MM, ouvre cible commerce de détail |
| 6 | Helpdesk / SAV | Phase 4 | M25-M27 | Lié au CRM, ouvre cible services après-vente |
| 7 | Gestion d'immobilisations | Phase 4 | M28-M30 | Complète Comptabilité (amortissements OHADA, gestion actifs) |

---

#### Module Comptabilité SYSCOHADA (Phase 3, M13-M15)

- Génération automatique des écritures comptables depuis factures et encaissements
- Plan comptable SYSCOHADA Révisé complet
- Saisie manuelle d'écritures
- Journaux : ventes, achats, banque, OD
- Balance générale et balance auxiliaire, grand livre
- États financiers : bilan, compte de résultat, TAFIRE
- Déclarations TVA mensuelles ou trimestrielles
- Export FEC SYSCOHADA pour expertise comptable externe
- **Catégorisation auto SYSCOHADA via IA** (suggestion compte depuis libellé facture — feature IA roadmap § 5.8.4)

#### Module Achats et fournisseurs (Phase 3, M15-M17) — NOUVEAU

- Carnet de contacts fournisseurs (réutilise § 5.7 Contacts central)
- Création de bons de commande fournisseurs avec lignes produits/services
- Workflow d'approbation interne configurable (selon rôle RBAC)
- Suivi des livraisons et réception partielle
- **Réception de facture fournisseur** : intégration directe OCR factures fournisseurs (§ 5.8.1) + rapprochement automatique avec bon de commande
- Suivi des paiements fournisseurs sortants (échéances, relances reverses)
- Export comptable des écritures fournisseurs vers module Comptabilité
- Tableau de bord achats : top fournisseurs, délais paiement moyens, en-cours

#### Module Inventaire et stocks (Phase 3, M16-M18)

- Catalogue produits avec variantes et SKU (extension du Catalogue Tier 2 § 5.7)
- Multi-entrepôts
- Mouvements de stock : entrée (depuis Achats), sortie (depuis Facturation et POS), transfert, ajustement
- Valorisation FIFO et coût moyen pondéré
- Alertes de stock bas configurables (notifications push + email + WhatsApp)
- Inventaire physique avec écarts
- Codes-barres et QR codes par produit (préparation pour POS mobile)

#### Module RH simplifié + Paie (Phase 4, M19-M21)

- Annuaire des employés (réutilise Identity § 5.1 pour comptes utilisateur __PROJECT_NAME__ si applicable)
- Gestion des contrats (CDI, CDD, prestation, stage)
- Suivi des congés et absences (workflow d'approbation manager)
- Notes de frais avec OCR justificatifs (réutilise pipeline IA § 5.8)
- **Bulletins de paie automatiques** selon législation locale SN et CI (cotisations IPRES SN, CNPS CI, IR, TVA cumul taux SN/CI)
- Déclarations sociales (DTS Sénégal, DISA Côte d'Ivoire)
- Export paie vers Comptabilité (écritures de paie automatiques)

#### Module POS mobile (Point de Vente, Phase 4, M22-M24) — NOUVEAU

- Application web dédiée caisse mobile pour smartphone et tablette
- Scan codes-barres produits via caméra (réutilise permissions § 6.9)
- Panier multi-lignes avec calcul TVA en temps réel
- Encaissement immédiat : mobile money (Wave, Orange Money, Free Money), carte (Paystack), espèces avec calcul de monnaie
- Génération automatique de ticket de caisse PDF + envoi WhatsApp / SMS au client
- Synchronisation temps réel avec Inventaire (déstockage auto) et Facturation
- ⚠️ **Phase 4 — Mode offline pour marchés sans connexion** : nécessitera réintroduction d'une couche offline (Service Worker + IndexedDB + sync). À ce stade, choix architectural à reprendre (LWW simple vs Merge 3-way) selon retours bêta MVP. Coût : ~10-15 j dev en Phase 4.
- Multi-caisses par point de vente
- Rapports caisse fin de journée (Z) et synthèses par caissier
- **Cible** : commerce de détail, restaurants, marchés, services (salons de coiffure, ateliers)

#### Module Helpdesk / SAV (Phase 4, M25-M27)

- Tickets de support avec catégorisation et priorisation
- SLA configurables par catégorie ou client
- Base de connaissances publique et privée
- Intégration WhatsApp pour réception tickets (canal B2C dominant)
- Affectation tickets à utilisateurs RBAC
- Satisfaction client post-résolution (NPS automatique)

#### Module Gestion d'immobilisations (Phase 4, M28-M30) — NOUVEAU

- Registre des immobilisations corporelles et incorporelles
- Plan d'amortissements conforme OHADA (linéaire, dégressif, accéléré selon catégorie)
- Calcul automatique des dotations mensuelles aux amortissements → écritures comptables
- Suivi des cessions, mises au rebut, transferts inter-établissements
- Inventaire physique des immobilisations avec écarts
- Étiquetage QR codes pour gestion physique
- Export pour audit fiscal et états financiers (TAFIRE notamment)
- Cible : PME structurées Pro/Enterprise avec parc d'actifs significatif

### 5.10 Module FNE Côte d'Ivoire (Compliance fiscale obligatoire)

**Contexte légal** : la Loi de finances pour la gestion 2025 (Côte d'Ivoire) institue l'obligation de la **Facture Normalisée Électronique (FNE)** et du **Reçu Normalisé Électronique (RNE)** — articles 384, 385 et suivants du Code Général des Impôts + articles 144 et suivants du Livre de Procédures Fiscales. **Toute entreprise opérant en CI doit certifier ses factures via la plateforme FNE de la DGI**, soit par leur module web, soit par l'app mobile DGI, soit par interfaçage API avec leur propre logiciel de facturation (notre cas __PROJECT_NAME__).

**Cible __PROJECT_NAME__** : toute organisation enregistrée avec `country = CI` dans __PROJECT_NAME__ (Phase 1 MVP) — auto-activé à l'onboarding entreprise Step 1 si pays = Côte d'Ivoire.

**Disponibilité** : MVP (Phase 1, mois 5-9, en parallèle du module Facturation SYSCOHADA). Sans la FNE, le module Facturation reste utilisable au Sénégal mais devient non-conforme légalement en CI à partir de l'entrée en vigueur de la loi.

#### 5.10.1 Capabilities offertes au PME (transparentes)

1. **Certification automatique à l'émission** — quand le PME émet une facture (`status = issued`), __PROJECT_NAME__ déclenche en arrière-plan la certification via API DGI. Aucune action manuelle requise. Le QR code FNE + visuel + référence DGI sont ajoutés au PDF de la facture une fois certifiée (typiquement 1-3 secondes après émission).
2. **Configuration FNE en onboarding module Facturation** (CI uniquement) — saisie unique : clé API FNE (récupérée depuis l'espace FNE de l'entreprise sur portail DGI), choix de l'établissement et du point de vente, test de connexion automatique avec affichage du balance sticker initial.
3. **Détection automatique du template DGI** selon le client :
   - Client __PROJECT_NAME__ avec NCC renseigné → **B2B**
   - Client international (devise étrangère EUR/USD) → **B2F** + foreignCurrency + foreignCurrencyRate auto-rempli depuis taux du jour
   - Client tagué institution publique → **B2G**
   - Client particulier (pas de NCC ni d'entreprise) → **B2C**
4. **Mapping automatique TVA __PROJECT_NAME__ → codes DGI** :
   - 18% normal → `TVA`
   - 9% réduit (CI uniquement) → `TVAB`
   - 0% exonération conventionnelle → `TVAC`
   - 0% exonération légale (TEE et RME) → `TVAD`
5. **Mapping automatique méthodes de paiement __PROJECT_NAME__ → codes DGI** : `mobile_money` → `mobile-money` ; Wave/OM/FM → `mobile-money` ; carte → `card` ; espèces → `cash` ; virement → `transfer` ; chèque → `check` ; paiement différé → `deferred`
6. **Monitoring stickers FNE en temps réel** — dashboard permanent "Balance stickers FNE : 178 restants" visible depuis le module Facturation. Alertes proactives :
   - Warning à 50 stickers restants
   - Critical à 10 stickers restants
   - Prédiction "À ce rythme, vous serez à court dans 12 jours" basée sur conso 7 derniers jours
   - Email + WhatsApp + push notification J-7 avant épuisement projeté
   - Lien deeplink vers espace FNE DGI pour recharger
7. **Mode dégradé robuste** — si l'API FNE est indisponible (timeout, 500, panne DGI) :
   - La facture est émise en interne avec statut `fne_status = pending_certification`
   - Workers Queue retry exponentiel (5 tentatives sur ~15 min cumulés)
   - Notification utilisateur quand certifiée
   - Aucun blocage métier : le PME peut continuer à émettre des factures, elles seront certifiées dès que l'API DGI revient
   - Après 5 échecs (DLQ) : alerte équipe __PROJECT_NAME__ + badge "Certification FNE échouée" + workflow re-certification manuelle disponible
8. **Workflow avoirs (refund)** — sur une facture déjà certifiée FNE, action "Faire un avoir" disponible. Sélection des items à rembourser → appel API #2 `/external/invoices/{id}/refund` → génération facture d'avoir certifiée liée à la facture parent.
9. **Workflow bordereau d'achat agricole** (B2B purchase) — pour coopératives ou entreprises agricoles, type `purchase` → certification via API #3 (même endpoint, type=purchase). Différent : c'est l'acheteur qui émet et certifie le bordereau, pas le vendeur.
10. **Audit trail complet 10 ans** — chaque appel API FNE (request + response + status code) logué dans `fne_audit_log` table, conservé 10 ans conformément aux obligations OHADA. Re-vérification publique de chaque facture certifiée possible à tout moment via l'URL token DGI.

#### 5.10.2 Multi-établissement et multi-point de vente

Une PME ivoirienne peut avoir plusieurs **établissements** (boutiques physiques, agences) et chaque établissement plusieurs **points de vente** (caisses, terminaux). La FNE oblige à déclarer `establishment` et `pointOfSale` sur chaque facture.

- Setup en onboarding ou settings : owner déclare 1..N établissements (nom + adresse) et 1..N points de vente par établissement (id + nom)
- Chaque utilisateur peut être rattaché à 1..N points de vente (RBAC granulaire)
- Au moment de l'émission d'une facture, __PROJECT_NAME__ préselectionne le point de vente par défaut de l'utilisateur (configurable)
- Une PME mono-établissement (cas commun TPE Aïssatou) a 1 établissement + 1 point de vente par défaut, transparent

#### 5.10.3 Limites MVP et roadmap

**Inclus MVP** :
- ✅ Certification facture de vente (API #1) — B2B / B2C / B2G / B2F
- ✅ Certification facture d'avoir/refund (API #2)
- ✅ Monitoring stickers + alertes
- ✅ Multi-établissement / multi-point de vente
- ✅ Audit trail 10 ans

**Reporté V1.5+** :
- ⏳ Certification bordereau d'achat agricole (API #3) — utile pour coopératives, attendre demande client
- ⏳ Connexion automatique RNE (Reçus Normalisés Électroniques) — pour caisses physiques avec TERNE — pas MVP, attendre module POS Phase 4
- ⏳ Recharge stickers automatique via prélèvement Wave (si DGI ouvre cette API) — dépend du planning DGI

**Hors scope** :
- ❌ Module web FNE direct (DGI a déjà le sien)
- ❌ App mobile DGI (idem)
- ❌ TERNE hardware (terminaux physiques, hors scope SaaS)

---

## 6. Exigences non fonctionnelles

### 6.1 Performance et expérience mobile

- **Temps de chargement initial** : < 2 secondes en P95 sur 3G Slow (400 kbps, 400 ms RTT), mesuré via Lighthouse CI mensuel
- **Bundle code client initial** : < 200 KB compressé (gzip ou brotli), mesuré au build
- **Lazy loading par module** : chargement à la demande des fonctionnalités utilisées (objectif : payload première interaction utile < 100 KB)
- **Temps de réponse API** : < 300 ms en P95 depuis Dakar et Abidjan, mesuré via APM (Sentry / Axiom) en continu
- **Capacité par organisation** : 5 000 contacts et 10 000 factures par organisation avec maintien du P95 API < 300 ms et P95 chargement listing < 1 s
- **Optimisation images** : compression automatique, formats WebP et AVIF, fallback JPEG progressif
- **Add to Home Screen** sur smartphone (manifest web app léger pour raccourci écran d'accueil, sans Service Worker complet)
- **Matrice navigateurs supportés** : Chrome 100+, Safari iOS 14+, Samsung Internet 18+, Firefox 100+ (90% du parc SN/CI couvert)
- **Résilience réseau** : retry automatique exponentiel TanStack Query (3 retries) sur erreurs réseau ; UI optimistic updates pour actions non-critiques (kanban CRM, marquage envoi facture) ; timeout 30 s par requête

### 6.2 Résilience réseau (online-only MVP)

**Décision v2.2 (2026-05-14)** : __PROJECT_NAME__ est online-only au MVP — pas d'offline-first ni sync engine. Le contexte africain 2026 (couverture 4G/5G en zones urbaines stables) et la priorité de simplification MVP justifient ce choix. **Décision Lot 1 #1.3 retirée.** Réintroduction d'un volet offline possible en V2+ si retours bêta démontrent friction (POS mobile Phase 4 pourrait nécessiter un re-design partiel).

- **Retry automatique** : TanStack Query effectue 3 retries avec backoff exponentiel sur erreurs réseau (timeout, 5xx) ; 1 retry sur mutations
- **Timeout par requête** : 30 secondes par défaut (limite Workers paid plan), 10 secondes pour notifications synchrones
- **Optimistic updates** : pour actions non-critiques (déplacer carte kanban, marquer facture envoyée, ajouter ligne facture) — rollback automatique en cas d'échec serveur
- **Pas d'optimistic update** pour : confirmation paiement, validation comptable, modification facture émise (toutes actions impactant flux financiers ou audit OHADA)
- **Indicateur connexion** : si l'utilisateur perd le réseau, toast non-bloquant "Connexion perdue. Vos actions reprendront automatiquement au retour réseau." + désactivation des CTA principaux
- **Brouillon local léger** (formulaires) : `localStorage` simple pour conserver un brouillon de facture / devis / opportunité en cours de saisie si l'onglet est fermé brutalement. Pas de queue de synchronisation différée — c'est juste une "sauvegarde de courtoisie".
- **Verrou statuts terminaux** : facture `status=issued`/`paid`/`cancelled`, paiement `confirmed`/`refunded`, devis `accepted`/`rejected`, écriture comptable `validated` — modifications impossibles côté serveur, UI désactive les CTA correspondants

### 6.3 Sécurité

- Chiffrement TLS 1.3 obligatoire pour toutes les communications
- Mots de passe hashés avec algorithme adaptive memory-hard (Argon2id par défaut, conforme recommandations OWASP 2024)
- **Chiffrement at-rest** des données sensibles (transactions, identités KYC, mentions légales personnelles) via chiffrement applicatif ou colonne (à finaliser en phase Architecture)
- Protection OWASP Top 10 (XSS, CSRF, SQL injection, SSRF, etc.)
- **Rate limiting** : 1 000 req/min/utilisateur authentifié, 100 req/min/IP anonyme, 10 000 req/min global
- Audit log immuable de toutes les actions sensibles (création/modification/suppression contacts, factures, paiements, permissions, sessions admin)
- Isolation cross-tenant garantie par triple couche (middleware applicatif, ORM, row-level security base de données)
- **PCI-DSS scope SAQ A** : aucune donnée carte stockée, tokenization déléguée à Stripe et Paystack exclusivement
- **Prévention de fraude (capabilities)** *[À DÉTAILLER LOT 1]* :
  - Limites de transaction par défaut (10M FCFA/jour par compte PME, configurables)
  - Détection de vélocité anormale (alerte si > 20 transactions/heure depuis même compte)
  - Intégration anti-fraud Stripe Radar et Paystack équivalent (scores transactionnels)
  - Workflow de dispute et chargeback handling
- Audit sécurité externe avant lancement public
- Plan de réponse aux incidents documenté (RACI, runbook, escalade < 1h pour incidents Sev1)

### 6.4 Conformité réglementaire

#### Comptabilité et facturation
- OHADA / SYSCOHADA pour la comptabilité et la facturation
- Facture normalisée DGI Sénégal (timbre fiscal électronique)
- **Facture Normalisée Électronique (FNE) Côte d'Ivoire** : conformité obligatoire **Loi de finances 2025** (articles 384, 385+ CGI ; 144+ LPF). Interfaçage API direct avec plateforme FNE DGI (`http://54.247.95.108/ws` test, URL prod après validation). Authentification Bearer Token JWT. 3 endpoints REST : certification facture de vente, certification avoir, certification bordereau achat. Voir § 5.10 Module FNE pour détails.
- Reçu Normalisé Électronique (RNE) : roadmap Phase 4 avec module POS mobile
- Conditions Générales d'Utilisation conformes au droit OHADA

#### Protection des données personnelles
- Loi 2008-12 du Sénégal sur la protection des données personnelles
- Loi 2013-450 de Côte d'Ivoire sur la protection des données
- Déclaration CDP (Commission de protection des données personnelles) au Sénégal
- Déclaration ARTCI (Autorité de régulation des télécommunications) en Côte d'Ivoire
- Mentions légales spécifiques par pays sur les factures

#### Droits des personnes
- Accès aux données personnelles (export complet sous 30 jours)
- Rectification des données inexactes
- Effacement (droit à l'oubli) sous 30 jours après résiliation, sauf obligations de conservation
- Portabilité (export structuré CSV/JSON)

#### Rétention légale
- **Conservation 10 ans** des documents comptables et factures conformément aux articles 24 et suivants de l'Acte Uniforme OHADA SYSCOHADA Révisé
- Conservation 3 ans des journaux de connexion (loi 2008-12 SN, art. similaire CI)
- Politique de suppression différée à la résiliation : 30 jours grâce → archivage cold storage 10 ans → suppression irréversible

#### KYC et statut juridique

**Statut __PROJECT_NAME__ : Facilitator pur** (décision Lot 1 #1.1, 2026-05-13).
**Niveau KYC MVP : Auto-déclaratif léger** (décision Lot 1 #1.2, 2026-05-13).

- __PROJECT_NAME__ est éditeur SaaS, **jamais dépositaire de fonds**. Wave, Paystack, Flutterwave et Stripe restent les seuls détenteurs des flux financiers.
- Aucun agrément BCEAO PSP requis pour le MVP. À reconsidérer si la commission 1% sur encaissements est réintroduite en V1.5+ (modèle split-payment via PSP préserve le statut facilitator ; modèle settlement nécessiterait l'agrément).
- **KYC transactionnel délégué** aux PSP partenaires (Wave/Paystack/Stripe assument leur propre conformité KYC/AML sur les transactions qu'ils traitent).

##### KYC PME utilisatrice — modèle MVP

| Plan | Champs collectés | Validation MVP | Validation V1.5+ |
|---|---|---|---|
| Free, Starter | email + téléphone + nom entreprise (libre) | Aucune | Auto-déclaratif maintenu |
| Business | + NINEA SN ou RCCM CI (saisie libre) + secteur d'activité (liste contrôlée) | Aucune | Validation automatique base RCCM/DGI |
| Pro, Enterprise | idem Business + numéro fiscal + IBAN si applicable | Aucune au MVP | Upload extrait RCCM (< 3 mois) + validation |

##### Triggers de revue manuelle (MVP)

Une revue manuelle par l'équipe __PROJECT_NAME__ est déclenchée si **l'un des signaux suivants** apparaît :

- Encaissements cumulés > **10M FCFA/mois** pour un compte PME
- Premier chargeback ou dispute remonté par un PSP
- Plainte client transmise par le canal support
- Secteur d'activité figurant sur la liste des secteurs sensibles (jeux, crypto, ITM, défense, services adultes — alignement CGV Stripe/Paystack)
- Demande explicite d'un PSP partenaire (audit Stripe Connect, contrôle Paystack)

Action de revue : vérification manuelle NINEA/RCCM via bases publiques (DGI SN et CCI CI consultables gratuitement), demande de documents complémentaires au PME via email, suspension du compte si refus de coopérer (sous 30 jours).

##### Architecture KYC swappable (cf. doc Architecture § Évolution KYC)

Tables `pme_kyc_status` et `pme_kyc_events` créées dès le MVP — désactivées en validation auto-déclarative. Permet de basculer vers KYC API tierce (Smile Identity / Veriff / IDnow) en V1.5+ par migration de données, sans refonte du modèle.

##### Monitoring AML basique

Seuils de transaction internes (notification équipe __PROJECT_NAME__ au-delà de 50M FCFA cumulés/mois pour un compte PME) — déclenche revue manuelle. Pas de blocage automatique au MVP.

##### Conformité contractuelle PSP

Respect des CGV Wave Business, Paystack Connect, Flutterwave, Stripe Connect (interdictions sectorielles, obligations reporting). Audit annuel.

##### CGU — clause KYC explicite

Les Conditions Générales d'Utilisation __PROJECT_NAME__ incluent une clause permettant à __PROJECT_NAME__ de **demander à tout moment** des justificatifs KYC complémentaires au PME utilisateur et de **suspendre le compte sous 30 jours** en cas de refus de coopérer. Protection juridique pour gérer les cas de demande PSP rétroactive.

### 6.5 Disponibilité

- **SLA cible** : 99,5% au lancement, 99,9% en phase de maturité, **mensuel**, mesuré hors fenêtres de maintenance planifiées, via cloud provider SLA + status page interne
- Sauvegardes automatiques quotidiennes avec rétention 30 jours
- Point-in-Time Recovery sur 7 jours
- Plan de continuité : RTO 4 heures, RPO 1 heure
- Status page publique avec historique des incidents (12 mois glissants)
- **Préavis maintenance** : ≥ 48 h pour maintenance planifiée, ≥ 5 min pour maintenance d'urgence (par email + status page + push in-app)

### 6.6 Évolutivité

- Architecture conçue pour scaler de 10 à 10 000 organisations
- Système modulaire ouvert : marketplace de modules tiers en phase 4
- API publique versionnée pour intégrations clients (semver, dépréciation annoncée 12 mois avant breaking change)

### 6.7 Accessibilité et internationalisation

- Conformité WCAG 2.1 niveau AA
- Français de France et français d'Afrique (vocabulaire commercial local : "facture conforme", "encaissement", "NINEA", "RCCM")
- Anglais pour expansion future (Phase 4)
- Formats de date, nombre et devise localisés (FCFA avec séparateur de milliers)
- Support multi-devise pour transactions internationales
- **Polices Web Fonts** : sous-ensembles latin + français d'Afrique, format WOFF2, total ≤ 50 KB

### 6.8 SEO et acquisition organique

- Pages publiques (landing, blog, pricing, cas clients) optimisées SEO : meta tags par pays, données structurées Schema.org, sitemap XML
- Mots-clés cibles prioritaires : "facturation Sénégal", "logiciel gestion PME Côte d'Ivoire", "facture SYSCOHADA", "encaissement mobile money entreprise"
- Performance pages publiques : Core Web Vitals "Good" sur LCP, FID, CLS
- Multilingue : FR par défaut, EN en fallback

### 6.9 Permissions web app et stratégie push

- **Manifest web app** : `manifest.webmanifest` léger pour permettre "Add to Home Screen" (raccourci écran d'accueil Android/iOS) sans Service Worker complet
- **Permissions demandées** : caméra (pour QR codes paiement § 5.5 et OCR factures fournisseurs § 5.8), notifications push web (online uniquement au MVP). **Pas** de géolocalisation au MVP, **pas** de stockage local persistant complexe (juste localStorage léger pour brouillons formulaires)
- **Stratégie push notifications** : Web Push API standard avec serveur push managé. Notifications déclenchées sur événements : nouveau paiement reçu, facture impayée échéance, devis accepté, renouvellement abonnement. Push n'est délivré que si l'utilisateur a son navigateur ouvert ou Service Worker actif côté navigateur (pas de push offline natif sans SW complet — limitation acceptée MVP)
- **Format notifications** : titre + corps + deeplink + icône __PROJECT_NAME__. Action button "Voir" pour navigation directe.

---

## 7. Roadmap de développement

Développement planifié sur 14 mois jusqu'au lancement public payant, modèle solo founder + assistants IA (Claude Code, Codex, GitHub Copilot — voir § 8).

### 7.1 Phase 0 — Fondations (mois 1 à 4)

**Objectif** : plateforme techniquement solide capable d'accueillir le trio MVP.

- Semaines 1-2 : setup monorepo, infrastructure base, configuration multi-environnements
- Semaines 3-6 : Tier 0 — Identity (Better-Auth, email + OTP SMS), Tenancy multi-org, RBAC
- Semaines 7-10 : Billing — intégration Stripe + Paystack + Wave, système d'activation modules
- Semaines 11-14 : Tier 1 — Notifications (email + WhatsApp + SMS), Files, Events bus, Jobs queue
- Semaines 15-16 : Tier 2 — Contacts central et Catalogue produits

### 7.2 Phase 1 — Trio MVP (mois 5 à 9)

**Objectif** : livrer Facturation + CRM light + Encaissements pour les premiers clients bêta.

- Semaines 17-22 : Module Facturation SYSCOHADA complet (devis, factures, relances)
- Semaines 23-28 : Module Encaissements (Wave, Orange Money, Free Money, Paystack, Stripe, réconciliation)
- Semaines 29-32 : Module CRM light (contacts, pipeline kanban, opportunités)
- Semaines 33-36 : intégrations finales WhatsApp Business, finalisation UX, tests intensifs

### 7.3 Phase 2 — Bêta et lancement (mois 10 à 12)

**Objectif** : valider le produit avec 20-30 clients pilotes puis lancer publiquement.

- Mois 10 : bêta privée avec 5-10 clients à Dakar et Abidjan, onboarding accompagné
- Mois 11 : itérations rapides sur retours bêta, recrutement 20-30 bêta-testeurs
- Mois 12 : lancement public payant, content marketing intensif

### 7.4 Phase 3 — Croissance et back-office complet (mois 13 à 18)

**Objectif** : passer de 50 à 150 clients payants tout en complétant la couverture **back-office** (Comptabilité, Achats, Inventaire).

- Mois 13-14 : acquisition 50 premiers clients payants + recrutement 1 dev fullstack si MRR > 5M FCFA
- Mois 13-15 : développement et release Module **Comptabilité SYSCOHADA** (~12 semaines)
- Mois 15-17 : Module **Achats et fournisseurs** (~8 semaines, exploite OCR factures fournisseurs déjà dispo MVP)
- Mois 16-18 : Module **Inventaire et stocks** (~10 semaines, prépare le terrain pour POS mobile)

### 7.5 Phase 4 — Suite complète + maturité + expansion régionale (mois 19 à 30+)

**Objectif** : atteindre la couverture complète de 10 modules natifs + ouvrir l'expansion régionale + structurer l'équipe.

- Mois 19-21 : Module **RH simplifié + Paie** (cotisations sociales SN/CI, bulletins automatiques)
- Mois 22-24 : Module **POS mobile** (point de vente, ouvre cible commerce de détail)
- Mois 25-27 : Module **Helpdesk / SAV** (lié au CRM, services après-vente)
- Mois 28-30 : Module **Gestion d'immobilisations** (complète Comptabilité, audit fiscal facilité)
- Mois 19+ (en parallèle) : expansion régionale Cameroun → Bénin → Togo → Mali (zone OHADA)
- Mois 24+ : API publique versionnée pour intégrations clients (banques, ERP entreprise)
- Mois 30+ : Marketplace de modules tiers (community contributions)
- Recrutement progressif : +1 customer success M18, +1 sales B2B M24, CTO M30

### 7.6 Visualisation roadmap modules (vision suite complète)

```
M1  M2  M3  M4  M5  M6  M7  M8  M9 M10 M11 M12 M13 M14 M15 M16 M17 M18 M19 M20 M21 M22 M23 M24 M25 M26 M27 M28 M29 M30+
│   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
├─FOUNDATIONS (Identity, Tenancy, RBAC, Billing, Services partagés)
├──────TIER 2 (Contacts central, Catalogue)
├──────────────────TRIO MVP (CRM + Facturation + Encaissements + IA OCR/Relances)
├─────────────────────BÊTA──┤
├────────────────────────────LANCEMENT PUBLIC
                                 ├───────────50 clients payants
                                 ├───────────────────────150 clients
                                                                              ├───500 clients
                            ┌────────────COMPTABILITÉ──────┤
                                            ├────────ACHATS────────┤
                                                    ├────────INVENTAIRE────────┤
                                                                ├──────RH+PAIE──────┤
                                                                            ├──────POS────────┤
                                                                                        ├──HELPDESK──┤
                                                                                                ├──IMMO──┤
                                                                ├──Expansion régionale (Cameroun, Bénin, Togo, Mali)
                                                                                    ├──API publique──┤
                                                                                                ├──Marketplace
```

### 7.7 Jalons et indicateurs

| Jalon | Échéance | Critères de succès | Modules en production |
|---|---|---|---|
| Bêta privée | Fin mois 10 | 10 clients pilotes (5 SN + 5 CI), 3 modules actifs | Trio MVP (CRM, Facturation, Encaissements) |
| Lancement public | Fin mois 12 | Inscription self-service, paiements opérationnels | Trio MVP + Foundations |
| 50 clients payants | Fin mois 14 | MRR > 1,5M FCFA (2 280 €), churn < 8% | Trio MVP |
| Comptabilité GA | Fin mois 15 | Module Comptabilité SYSCOHADA released, 30% adoption clients existants | Trio MVP + Comptabilité |
| 150 clients + back-office complet | Fin mois 18 | MRR > 5M FCFA (7 600 €), recrutement 1 dev, expansion 3e pays | Trio + Comptabilité + Achats + Inventaire (6 modules) |
| 500 clients | Fin mois 24 | MRR > 18M FCFA (27 400 €), suite étendue RH + POS | Trio + Comptabilité + Achats + Inventaire + RH + POS (8 modules) |
| Suite complète + 1000 clients | Fin mois 30 | MRR > 30M FCFA (45 700 €), 10 modules natifs disponibles | Suite complète (10 modules) |

---

## 8. Modèle solo founder + IA assistants

> Note BMad : cette section est conservée dans le PRD car elle conditionne le plan d'exécution, le budget et les risques. Une partie pourra migrer en `architecture.md` ou `operations.md` en phase d'évolution du document.

### 8.1 Setup de développement

__PROJECT_NAME__ est développé selon un modèle solo founder augmenté par des assistants IA spécialisés. Modèle viable pour un SaaS B2B compte tenu de la maturité des outils IA en 2026.

**Outils IA utilisés** :
- Claude Code : architecte technique, code review, design patterns, décisions structurelles
- OpenAI Codex : implémentation rapide, génération code répétitif
- GitHub Copilot : assistance quotidienne dans VS Code
- Claude.ai Pro : PRD, documentation, content marketing

**Coûts associés** : ~50-60 €/mois total outils IA.

### 8.2 Avantages du modèle

- Vélocité de prototypage 3-5× supérieure vs équipe full-stack 2-3 devs équivalente
- Coût de développement marginal (~60 €/mois vs 5 000 €+/mois pour un dev senior)
- Cohérence du code et des patterns architecturaux
- Documentation continue générée automatiquement
- Tests unitaires générés en parallèle du code

### 8.3 Risques et mitigations

> **Risque majeur — Solo founder = SPOF** : si Marius tombe malade, voyage longue durée, ou pivote, le projet s'arrête. **Mitigation** : documentation exhaustive de l'architecture, code propre et auto-documenté, backups Github privé quotidiens, contrats freelance prêts à activer (3 prestataires identifiés, NDA signés en mois 8).

- Pas de challenge technique externe interne → revues d'architecture mensuelles avec mentors techniques ou communautés open source
- Limitations IA sur APIs locales (Wave Business API, Orange Money) → buffer ×2 sur estimations d'intégration paiement, documentation manuelle approfondie
- Support client unique sur Marius → automatisation maximale via base de connaissances, chatbot, FAQ vidéo
- Crédibilité B2B perçue (solo founder vs ESN) → témoignages clients précoces, partenariats institutionnels (ONECCA, OECCI), présence physique aux évènements

### 8.4 Plan de scale équipe

- Mois 1-8 : solo founder uniquement
- Mois 9-12 : +1 freelance design UX (sprints ponctuels, 5 000-10 000 € total)
- Mois 14 si MRR > 5M FCFA : recrutement 1 dev fullstack TypeScript en CDD/CDI
- Mois 18 si > 100 clients : +1 customer success / support
- Mois 24 si > 500 clients : +1 sales B2B Afrique

---

## 9. Budget et ressources

### 9.1 Coûts de développement (an 1, solo founder + IA)

| Poste | Estimation EUR/an |
|---|---|
| Abonnements IA assistants | 600 € |
| Design UX/UI (freelance, sprints ponctuels) | 5 000 à 10 000 € |
| Audit sécurité externe avant lancement | 5 000 à 8 000 € |
| Marketing pré-lancement (content, ads, events) | 5 000 à 15 000 € |
| Juridique (CGU, RGPD-AF, contrats) | 3 000 à 5 000 € |
| Incorporation et frais légaux SN/CI | 2 000 à 3 000 € |
| Déplacements Dakar/Abidjan (bêta, prospection) | 3 000 à 5 000 € |
| **Total estimé an 1** | **24 000 à 46 000 €** |

### 9.2 Coûts opérationnels mensuels (0-100 clients)

| Service | Coût mensuel |
|---|---|
| Base de données managée | 70 à 150 € |
| Edge compute + storage + CDN | 10 à 30 € |
| Redis managé | 10 à 30 € |
| Email transactionnel | 20 à 100 € |
| WhatsApp Business API | 30 à 100 € (selon volume) |
| SMS Afrique | 20 à 80 € |
| Commissions PSP (Stripe / Paystack / Wave) | 1,5% à 2,5% du MRR |
| Outils IA dev (Claude Code, Codex, Copilot) | 50 à 60 € |
| **API IA in-product (Claude Sonnet vision + Haiku text)** | **20 à 40 € (50 clients) ; 100 à 200 € (500 clients)** |
| Observabilité (Sentry, Axiom, PostHog) | 40 à 100 € |
| Auth managée + divers SaaS | 20 à 50 € |
| **Total infrastructure** | **270 à 700 € / mois** |

### 9.3 Projections financières

Hypothèses basées sur benchmarks SaaS B2B Afrique (Wave, Paystack, Flutterwave) ajustées au profil PME :

| Mois | Clients | Panier moyen FCFA | MRR FCFA | MRR EUR |
|---|---|---|---|---|
| M12 | 20 | 12 000 | 240 000 | 365 € |
| M18 | 150 | 18 000 | 2 700 000 | 4 100 € |
| M24 | 500 | 22 000 | 11 000 000 | 16 750 € |
| M36 | 1 500 | 25 000 | 37 500 000 | 57 100 € |

---

## 10. Stratégie Go-to-Market

### 10.1 Approche segmentée par canal

> **Focus MVP (décision Lot 1 #1.5)** : acquisition concentrée sur 2 segments principaux (TPE Aïssatou + PME structurées Kouassi). Segment agence digitale / diaspora (Fatou) reporté à V1.5+.

#### TPE (Starter 5 000 FCFA) — cible Aïssatou, ~60% du budget MVP
- Viralité Wave : commission sur transactions visibles aux clients finaux
- Programme de parrainage : 1 mois gratuit par parrainage actif
- Réseaux Facebook et WhatsApp d'entrepreneurs locaux
- Démos courtes en présentiel dans les marchés (Plateau Dakar, Marcory Abidjan)

#### PME en croissance (Business 15 000 FCFA) — cible Kouassi, ~30% du budget MVP
- Content marketing en français d'Afrique : blog, YouTube, LinkedIn organique, Twitter
- SEO local : "facturation Sénégal", "logiciel gestion PME Côte d'Ivoire"
- Webinaires mensuels gratuits sur la conformité SYSCOHADA
- Partenariats experts-comptables : 20% de commission récurrente sur les abonnements

#### PME structurées (Pro 35 000 FCFA et Enterprise 75 000 FCFA) — ~10% du budget MVP
- Sales B2B traditionnel : démos personnalisées, négociation, contrats annuels
- Participation aux évènements clés : CGECI Foundation, CGES, salons CCI
- Programme de partenaires-revendeurs (ESN locales, cabinets conseil)
- Études de cas et témoignages clients en vidéo

#### Agences digitales et diaspora export (Fatou) — V1.5+ uniquement
Acquisition désactivée au MVP pour préserver le focus. Capacités produit (multi-devise EUR/FCFA, intégration Stripe pour cartes internationales) restent disponibles à tout client Pro/Enterprise self-service. Réactivation V1.5+ :
- Canal LinkedIn diaspora (ciblage agences digitales SN/CI/FR)
- Content marketing tech (architecture moderne, multi-currency, IA pratique)
- Présence aux évènements tech (Dakar Startup Week tech track, GITEX Africa tech)
- Partenariats incubateurs (CTIC, Orange Digital Center, Jokkolabs, Seedstars)

### 10.2 Plan de lancement par pays

#### Sénégal (Dakar)
- Mois 9 : recrutement 5 bêta-testeurs par cooptation (CTIC, Jokkolabs, réseaux personnels)
- Mois 11 : élargissement à 15-20 bêta-testeurs
- Mois 12 : lancement public, présence à Dakar Startup Week
- Mois 13-14 : programme de partenariat avec ONECCA-Sénégal (Ordre des experts-comptables)

#### Côte d'Ivoire (Abidjan)
- Mois 9 : recrutement 5 bêta-testeurs (réseau Orange Digital Center, Akwaba, Seedstars)
- Mois 11 : élargissement à 15-20 bêta-testeurs
- Mois 12 : lancement public, présence à GITEX Africa
- Mois 13-14 : partenariat avec OECCI (Ordre des experts-comptables CI)

### 10.3 Métriques d'acquisition

- CAC cible TPE : 5 000 FCFA (8 €) — payback en 1 mois
- CAC cible PME croissance : 25 000 FCFA (38 €) — payback en 2 mois
- CAC cible PME structurée : 100 000 FCFA (152 €) — payback en 3 mois
- Conversion bêta → payant cible : > 60%
- Net Revenue Retention cible : > 100% (upsell modules)

---

## 11. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Solo founder = SPOF | Élevée | Critique | Documentation exhaustive, code propre, backup, contacts freelance prêts |
| Phase 0 plus longue que prévue | Élevée | Moyen | Time-boxing strict, MVP minimaliste, focus strict nécessaire |
| Intégration Wave API instable | Moyenne | Élevé | Fallback Flutterwave/Paystack, tests intensifs, monitoring webhooks |
| Difficulté d'acquisition clients | Élevée | Élevé | Réseau personnel SN/CI, partenariats experts-comptables, présence physique régulière |
| Concurrence locale agressive | Moyenne | Moyen | Différenciation forte sur suite complète native Afrique + mobile-first, vélocité produit supérieure |
| Scope creep / dispersion sur trop de modules | Moyenne | Élevé | Roadmap modules séquencée et timeboxée (§ 7.4, § 7.5). Discipline "1 module = 8-12 semaines max", aucun module entamé avant le précédent en production. Réévaluation trimestrielle de la priorisation modules selon retours clients. |
| Changement réglementaire (e-facturation) | Moyenne | Élevé | Veille active DGI SN et CI, partenariat éventuel avec PDP agréée |
| Manque de fonds pour scaler | Moyenne | Moyen | Bootstrapping initial, levée seed possible au mois 12-15 selon traction |
| Burn-out founder | Moyenne | Critique | Scope discipliné, 1 jour de repos par semaine strict, vacances obligatoires trimestrielles |
| Limitations IA sur APIs locales | Élevée | Moyen | Buffer ×2 sur estimations intégration paiement, documentation manuelle approfondie |
| Risque réglementaire BCEAO | Faible (MVP facilitator) | Élevé (à V1.5+) | MVP en facilitator pur (décision Lot 1 #1.1, voir § 6.4). Risque réémerge si commission 1% réintroduite en V1.5+ avec modèle settlement — préférer split-payment via PSP qui préserve facilitator. |
| Sinistre KYC/AML insuffisant | Faible | Élevé | KYC transactionnel délégué aux PSP. KYC PME auto-déclaratif au MVP (décision Lot 1 #1.2). Monitoring AML interne sur seuils 50M FCFA/mois. Triggers de revue manuelle sur > 10M FCFA/mois, dispute, secteur sensible. |
| Audit rétroactif PSP (Stripe Connect, Paystack) demandant KYC sub-merchant non fourni | Faible (M0-M12) à Moyenne (M12+) | Élevé | KYC swappable techniquement (tables pré-câblées MVP). Disclaimer CGU permet demande rétroactive sans avenant. Plan de bascule vers KYC API tierce (~5-8 j) activable si demande PSP. Mitigation v1.5 : intégration Smile Identity ou Veriff avant M18. |
| Non-respect CGV PSP partenaires | Faible | Élevé | Veille active CGV Wave/Paystack/Stripe/Flutterwave. Audit contractuel annuel. Documentation interdictions sectorielles intégrée à l'inscription PME. |
| Indisponibilité API IA (Anthropic/OpenAI) | Faible | Moyen | Abstraction `AIProvider` multi-provider (Anthropic + OpenAI). Fallback dégradé "saisie manuelle" automatique après 30s. Pas de feature critique bloquée sans IA (OCR et assistant relances ont des alternatives manuelles). |
| Dérive coût API IA avec scale | Moyenne | Moyen | Quotas par plan (50/200/illimité OCR + 30/200/illimité relances IA). Monitoring coût par client mensuel. Modèles haiku/mini par défaut (~10× moins chers que Sonnet/4o). Réévaluation budgétaire trimestrielle. |

---

## 12. Métriques de succès

### 12.1 KPI produit

- **Time to first invoice** : < 15 minutes entre inscription et 1ère facture émise (onboarding § 5.1.2 + onboarding module Facturation § 5.1.3 conçus pour cet objectif)
- **Onboarding completion rate** : > 85% des nouveaux comptes complètent les 6 étapes obligatoires (1-6) de l'onboarding entreprise § 5.1.2. Steps 7 (invitation équipes) et 8 (tour guidé) sont skippables et trackés séparément.
- **Onboarding time** : médiane < 8 minutes pour les 6 étapes obligatoires (mesurée entre signup et complétion Step 6)
- **Module onboarding adoption** : > 70% des comptes finalisent l'onboarding du module Facturation dans les 7 jours (1ère facture créée)
- **Activation rate** : 70% des nouveaux comptes émettent au moins 3 factures dans les 14 jours
- **Time to first payment** : < 24h entre 1ère facture émise et 1er encaissement
- **Module adoption** : moyenne de 2,5 modules actifs par client (trio MVP complet)
- **Net Promoter Score** : ≥ 35 en bêta, ≥ 50 à 12 mois
- **Usage WhatsApp** : ≥ 60% des factures envoyées via WhatsApp à M12, ≥ 80% à M24 (mesure de l'adoption du canal différenciateur)

### 12.2 KPI business

- **MRR** : 240k FCFA M12, 2,7M M18, 11M M24, 37,5M M36
- **Encaissements traités** (volume passant par __PROJECT_NAME__, sans détention) : 50M FCFA M12, 500M M18, 2 milliards M24 — indicateur d'adoption, pas de revenu direct au MVP
- **Revenu commission encaissements** : 0 au MVP (facilitator pur). Réintroduction V1.5+ projetée : 0 / 0 / 0 / 5M FCFA M24 (chiffrage indicatif, à recalculer lors de l'arbitrage technique split-payment vs facturation séparée)
- **Churn mensuel** : < 8% en année 1, < 5% à maturité
- **CAC moyen** : < 25 000 FCFA (38 €) pour PME croissance
- **LTV moyen** : > 250 000 FCFA (380 €) à 24 mois
- **Ratio LTV/CAC** : > 5 à maturité

### 12.3 KPI techniques

- **Uptime** : ≥ 99,5% mensuel
- **P95 latence API** : < 300 ms depuis Dakar et Abidjan
- **Bug critique** : 0 incident de sécurité, < 1 incident majeur par trimestre
- **Taux de réussite paiement mobile money** : > 95%
- **Vélocité dev** : 80% des sprints livrés conformes
- **0 facture non-conforme SYSCOHADA** détectée par audit fiscal client

### 12.4 Seuils de pivot ou continue

#### Décision mois 12

- Si < 20 clients payants ou < 200 000 FCFA MRR : reconsidérer positionnement, pricing ou marché
- Si 20-50 clients : continuer avec ajustements
- Si > 50 clients : accélérer

#### Décision mois 18

- Si < 80 clients ou MRR < 2M FCFA : pivot majeur nécessaire (segment, géographie, modèle)
- Si 80-200 clients : recrutement et expansion
- Si > 200 clients : levée de fonds

---

## 13. Annexes et références

### 13.1 Glossaire

- **SYSCOHADA** : Système Comptable Harmonisé des Entreprises de l'OHADA, applicable dans 17 pays africains
- **OHADA** : Organisation pour l'Harmonisation en Afrique du Droit des Affaires
- **UEMOA** : Union Économique et Monétaire Ouest-Africaine, 8 pays partageant le FCFA
- **CEMAC** : Communauté Économique et Monétaire de l'Afrique Centrale, 6 pays
- **FCFA** : Franc de la Communauté Financière Africaine, devise UEMOA et CEMAC (1 EUR = 655,957 FCFA)
- **NINEA** : Numéro d'Identification Nationale des Entreprises et Associations (Sénégal)
- **RCCM** : Registre du Commerce et du Crédit Mobilier (OHADA)
- **DGI** : Direction Générale des Impôts (DGI Sénégal, DGI CI)
- **PSP** : Payment Service Provider
- **MM** : Mobile Money — paiement via téléphone mobile (Wave, Orange Money, Free Money, MTN MoMo)
- **PDP** : Plateforme de Dématérialisation Partenaire, agréée pour la facturation électronique
- **MRR / ARR** : Monthly / Annual Recurring Revenue
- **BCEAO** : Banque Centrale des États de l'Afrique de l'Ouest
- **CDP** : Commission de protection des données personnelles (Sénégal)
- **ARTCI** : Autorité de régulation des télécommunications de Côte d'Ivoire
- **FEC** : Fichier des Écritures Comptables (format export SYSCOHADA)
- **POS** : Point of Sale, point de vente — terminal d'encaissement caisse (souvent sur tablette ou smartphone)
- **FNE** : Facture Normalisée Électronique — obligation DGI Côte d'Ivoire (Loi de finances 2025)
- **RNE** : Reçu Normalisé Électronique — obligation DGI Côte d'Ivoire pour caisses physiques (Loi de finances 2025)
- **TERNE** : Terminal d'Émission de Reçus Normalisés Électroniques (hardware physique pour caisses)
- **NCC** : Numéro de Compte Contribuable — identifiant fiscal DGI Côte d'Ivoire
- **Sticker FNE** : unité numérique pré-achetée auprès DGI consommée à chaque certification de facture
- **B2B / B2C / B2G / B2F** : templates de facturation FNE selon nature client (entreprise / particulier / gouvernement / international)
- **TVA / TVAB / TVAC / TVAD** : codes TVA DGI Côte d'Ivoire (18% normal / 9% réduit / 0% exonéré conv / 0% exonéré légal)
- **TAFIRE** : Tableau Financier des Ressources et Emplois — état financier OHADA obligatoire
- **IPRES** : Institution de Prévoyance Retraite du Sénégal
- **CNPS** : Caisse Nationale de Prévoyance Sociale (Côte d'Ivoire)
- **DTS / DISA** : Déclarations sociales obligatoires (DTS Sénégal, DISA Côte d'Ivoire)
- **SKU** : Stock Keeping Unit — référence produit unique pour gestion d'inventaire

### 13.2 Documents associés à produire

- Document d'architecture technique détaillée → [`__PROJECT_NAME__-Architecture-v2.0-extracted.md`](./__PROJECT_NAME__-Architecture-v2.0-extracted.md)
- Spécifications fonctionnelles détaillées par module (post-PRD, en phase épics & stories)
- Design system et guidelines UI mobile-first (à produire en phase UX)
- Plan de tests et stratégie QA (à produire en phase TEA — Test Architecture Enterprise)
- Politique de sécurité et plan de réponse aux incidents
- Plan d'expansion régionale (Cameroun, Bénin, Togo)
- Manuel d'onboarding client et formation
- Conditions Générales de Vente et d'Utilisation conformes OHADA

### 13.3 Historique des versions

| Version | Date | Auteur | Modifications |
|---|---|---|---|
| 1.0 | Mai 2026 | Marius | PRD initial pour marché européen |
| 2.0 | Mai 2026 | Marius | Repositionnement Afrique UEMOA, Sénégal+CI, trio MVP, solo+IA |
| 2.0-md | 2026-05-13 | Marius + audit BMad (Lot 3) | Conversion Markdown, densification narrative, corrections SMART (FRs Billing/MM), reformulation NFRs (percentiles, fenêtres SLA, rate limit chiffré), ajouts § 5.7 services partagés, § 6.8 SEO, § 6.9 PWA push, parcours Fatou § 3.4, contraintes business archi § 4 (détails techniques migrés vers `architecture.md`). Lot 1 (BCEAO/AML/offline) en attente. |
| 2.1 | 2026-05-13 | Marius + audit BMad (Lot 1 + extension vision) | Lot 1 complet : 5 décisions produit actées (#1.1 Facilitator pur, #1.2 KYC léger, #1.3 Merge 3-way+LWW, #1.4 IA in-product léger, #1.5 Fatou en V1.5+). **Extension vision** : repositionnement de "trio commercial intégré" à "suite complète de gestion d'entreprise native Afrique". Ajout de 3 nouveaux modules dans la roadmap post-MVP (Achats, POS mobile, Immobilisations). Total 10 modules natifs prévus (3 MVP + 7 post-MVP). Réorganisation § 7 roadmap en Phase 3 (back-office) et Phase 4 (suite complète + maturité). |
| **2.2** | **2026-05-14** | **Marius + audit BMad** | **Retrait offline-first MVP** : décision Lot 1 #1.3 retirée (MVP online-only, couverture 4G/5G urbaine SN/CI suffisante + simplification scope). § 6.2 refondue "Résilience réseau". § 1.1 / 1.2 / 1.5 / 4.1 reformulés sans offline. § 5.9 POS mobile noté reconstruction offline Phase 4. § 6.9 reformulée web app léger (manifest sans SW complet). **Ajout onboarding entreprise** : nouvelle section § 5.1.2 dédiée au flow post-inscription (8 étapes : profil entreprise, profil user, plan, modules, préférences, consentement KYC+CGU, invitation équipes skippable, tour guidé skippable). Distinction onboarding entreprise (base) vs onboarding par module. Schémas Drizzle, tRPC routers et routes UI documentés en architecture. KPI § 12.1 activation rate adressé. |
| **2.3** | **2026-05-14** | **Marius + audit BMad** | **Intégration FNE Côte d'Ivoire** (Loi de finances 2025 — obligation légale). Nouveau § 5.10 Module FNE Côte d'Ivoire avec 10 capabilities (certification auto à l'émission, configuration FNE en onboarding, détection auto template B2B/B2C/B2G/B2F, mapping TVA/paiements, monitoring stickers, mode dégradé Workers Queue retry exp, avoirs, audit 10 ans). Notion multi-établissement / multi-point de vente ajoutée. § 5.4 enrichi mention FNE auto. § 6.4 ajout référence Loi 2025 + endpoints DGI. Glossaire enrichi (FNE, RNE, TERNE, NCC, sticker, templates DGI, codes TVA). Architecture étendue : nouveau `packages/fne` dédié + schemas Drizzle FNE + queue consumer asynchrone + routes UI settings. |

---

## Décisions tranchées (Lot 1)

> **Lot 1 BMad** — décisions produit conditionnant la phase Architecture.

| # | Décision | Choix retenu | Date | Sections impactées |
|---|---|---|---|---|
| **1.1** | **Statut BCEAO** | **✅ Facilitator pur — pas d'agrément requis. Commission encaissements reportée V1.5+** | **2026-05-13** | **§ 1.2, § 1.4, § 4.3, § 5.5, § 6.4, § 11, § 12.2** |
| **1.2** | **Niveau KYC clients PME** | **✅ Auto-déclaratif léger MVP. Saisie libre NINEA/RCCM Business+. Triggers de revue manuelle (> 10M FCFA/mois, dispute, secteur sensible, demande PSP). Schéma KYC swappable pré-câblé pour V1.5+.** | **2026-05-13** | **§ 5.1, § 6.4, § 11, CGU** |
| **1.3** | ~~Stratégie offline résolution conflits~~ | 🚫 **RETIRÉE 2026-05-14** : MVP online-only confirmé. La couverture 4G/5G en zones urbaines SN/CI + priorité simplification MVP justifient le retrait. ~~Merge 3-way + LWW~~ remplacé par retry exponentiel TanStack Query + brouillons localStorage. POS mobile Phase 4 nécessitera ré-introduction d'une couche offline (re-design à reprendre). | 2026-05-13 (décision) puis **2026-05-14 (retrait)** | § 6.2 (refondue "Résilience réseau") |
| **1.4** | **IA in-product** | **✅ IA léger MVP : 2 features (OCR factures fournisseurs + assistant rédaction relances WhatsApp). Positionnement "IA pragmatique" en § 1.5. Stratégie multi-provider Anthropic + OpenAI avec fallback dégradé. Budget API ~20-40 €/mois MVP.** | **2026-05-13** | **§ 1.2, § 1.5, § 5.8 (nouveau), § 9.2, § 11, Architecture § 9** |
| **1.5** | **Persona Fatou** | **✅ Cible secondaire V1.5+. Parcours § 3.4 conservé pour vision long terme, focus marketing MVP recentré sur Aïssatou (60%) + Kouassi (30%) + PME structurées génériques (10%). Capacités techniques multi-devise EUR/FCFA + Stripe conservées dans le MVP (utiles Pro/Enterprise). Acquisition diaspora LinkedIn reportée V1.5+.** | **2026-05-13** | **§ 3.1, § 3.4, § 10.1** |

> **Lot 2 BMad** — Rédaction technique post-Lot 1 (½ jour estimé). Sections à compléter après arbitrages restants : § 6.4 KYC framework détaillé, § 6.3 prévention fraude approfondie. *(§ 6.2 offline strategy supprimée du Lot 2 suite au retrait de la décision #1.3.)*

**Fin du document.**
