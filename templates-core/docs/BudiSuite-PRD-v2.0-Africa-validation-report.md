---
validationTarget: 'docs/__PROJECT_NAME__-PRD-v2.0-Africa.pdf'
validationDate: '2026-05-12'
inputDocuments:
  - 'docs/__PROJECT_NAME__-PRD-v2.0-Africa.pdf'
validationStepsCompleted: ['step-v-01-discovery', 'step-v-02-format-detection', 'step-v-03-density-validation', 'step-v-04-brief-coverage-validation', 'step-v-05-measurability-validation', 'step-v-06-traceability-validation', 'step-v-07-implementation-leakage-validation', 'step-v-08-domain-compliance-validation', 'step-v-09-project-type-validation', 'step-v-10-smart-validation', 'step-v-11-holistic-quality-validation', 'step-v-12-completeness-validation']
domain: 'fintech / regtech / b2b-saas-comptable'
domainComplexity: 'high'
projectType: 'saas_b2b (mobile-first PWA, mobile_app hybride)'
validationStatus: COMPLETE
formatClassification: 'BMAD Standard'
coreSectionsPresent: 6
holisticQualityRating: '4/5 - Good'
overallStatus: 'Warning (avec 1 axe Critical : conformité fintech AML/BCEAO/fraude)'
lot3Applied: true
lot3AppliedDate: '2026-05-13'
lot3Artifacts:
  - 'docs/__PROJECT_NAME__-PRD-v2.0-Africa.md'
  - 'docs/__PROJECT_NAME__-Architecture-v2.0-extracted.md'
lot1Decisions:
  - decision: '1.1 — Statut BCEAO : Facilitator pur, commission encaissements reportée V1.5+'
    date: '2026-05-13'
    impactedSections: ['§ 1.2', '§ 1.4', '§ 4.3', '§ 5.5', '§ 6.4', '§ 11', '§ 12.2']
  - decision: '1.2 — KYC clients PME : auto-déclaratif léger MVP, schéma swappable pour V1.5+'
    date: '2026-05-13'
    impactedSections: ['§ 5.1', '§ 6.4', '§ 11', 'CGU', 'Architecture § 6']
    safeguards: ['Tables pme_kyc_status + pme_kyc_events pré-câblées', 'Triggers revue manuelle > 10M FCFA/mois + dispute + secteur sensible', 'Clause CGU demande KYC rétroactive']
  - decision: '1.3 — Stratégie offline résolution conflits : Merge 3-way listes + LWW scalaires'
    date: '2026-05-13'
    status: 'RETIRÉE 2026-05-14 (Marius confirme online-only MVP)'
    retirementReason: 'Couverture 4G/5G zones urbaines SN/CI suffisante MVP, simplification scope priorité. POS mobile Phase 4 nécessitera ré-introduction d''une couche offline si retours bêta démontrent friction.'
    replacedBy: 'PRD § 6.2 Résilience réseau : TanStack Query retry exponentiel + optimistic updates + verrou statuts terminaux serveur + brouillon localStorage formulaires'
    impactedSections: ['§ 6.2 refondue Résilience réseau', 'Architecture § Sync Engine RETIRÉ']
    safeguards: ['Verrou serveur sur statuts terminaux conservé (facture issued/paid, paiement confirmed)', 'Brouillon localStorage pour formulaires en cours de saisie']
  - decision: '1.4 — IA in-product léger MVP : OCR factures fournisseurs + Assistant rédaction relances WhatsApp'
    date: '2026-05-13'
    impactedSections: ['§ 1.2', '§ 1.5', '§ 5.8 (nouveau)', '§ 9.2', '§ 11', 'Architecture § 8']
    safeguards: ['Abstraction AIProvider multi-provider (Anthropic + OpenAI)', 'Fallback dégradé saisie manuelle sur indisponibilité', 'Quotas par plan (Free 50/30, Starter 200/200, Business+ illimité)', 'Engagement contractuel zero data retention avec Anthropic + OpenAI', 'Monitoring coût + alerte 2x projection']
  - decision: '1.5 — Persona Fatou : cible secondaire V1.5+, focus MVP recentré sur Aïssatou + Kouassi'
    date: '2026-05-13'
    impactedSections: ['§ 3.1', '§ 3.4', '§ 10.1']
    safeguards: ['Parcours § 3.4 conservé pour vision long terme', 'Capacités techniques multi-devise FCFA/EUR/USD + Stripe conservées dans le MVP', 'Réactivation acquisition diaspora documentée pour V1.5+ (LinkedIn, content tech, incubateurs)']
lot1Pending: []
lot1Complete: true
readyForBmadCreateArchitecture: true
lot2Pending: true
visionExtensionV2_1:
  date: '2026-05-13'
  trigger: 'Marius — élargissement vision suite complète de gestion d''entreprise'
  changes:
    - 'Repositionnement § 1.1, § 1.2, § 1.5, § 2.3 : trio commercial → suite complète native Afrique'
    - 'Ajout de 3 nouveaux modules post-MVP : Achats et fournisseurs, POS mobile, Gestion d''immobilisations'
    - 'Total modules natifs : 10 (3 MVP + 7 post-MVP)'
    - 'Réorganisation § 7 Roadmap : Phase 3 = back-office complet (M13-M18), Phase 4 = suite complète + maturité (M19-M30)'
    - 'Ajout § 7.6 Visualisation roadmap modules (timeline ASCII)'
    - 'Ajout § 7.7 Jalons étendus avec colonne Modules en production'
    - 'Ajout risque "Scope creep / dispersion modules" en § 11'
    - 'Ajout glossaire : POS, TAFIRE, IPRES, CNPS, DTS, DISA, SKU'
  mvpScope: 'INCHANGÉ — trio CRM + Facturation + Encaissements + foundations'
  prdVersion: '2.1'

visionRevisionV2_2:
  date: '2026-05-14'
  trigger: 'Marius — simplification scope MVP + comblement gap onboarding'
  changes:
    - 'RETRAIT offline-first MVP : décision Lot 1 #1.3 invalidée (online-only confirmé)'
    - '§ 6.2 refondue "Résilience réseau" : TanStack Query retry exponentiel + optimistic updates + verrou statuts terminaux + brouillon localStorage'
    - 'AJOUT § 5.1.2 Onboarding entreprise (8 étapes : profil entreprise, profil user, plan, modules, préférences, consentement KYC+CGU, invitation équipes skippable, tour guidé skippable)'
    - 'AJOUT § 5.1.3 Onboarding par module (distinct de l''onboarding entreprise)'
    - 'AJOUT KPI § 12.1 : Onboarding completion rate, Onboarding time, Module onboarding adoption'
    - 'Architecture : pattern Onboarding State Machine ajouté en step 5, packages/onboarding ajouté en step 6, schemas onboarding (onboarding_progress, module_onboarding_progress, consent_log) en packages/db'
    - 'Architecture : sync engine section retirée (step 4 + step 5), packages/sync supprimé, apps/suite/src/service-worker/ supprimé, schemas sync (entity_versions/sync_queue_client/conflict_log) supprimés'
    - 'POS mobile Phase 4 : note ajoutée que reconstruction couche offline sera nécessaire'
  mvpScope: 'INCHANGÉ — trio CRM + Facturation + Encaissements + foundations + onboarding'
  prdVersion: '2.2'
  designSystemIntegrated: '__PROJECT_NAME__ Base et Brand v3.0 — docs/design-system/'

visionRevisionV2_3:
  date: '2026-05-14'
  trigger: 'Marius — analyse FNE Côte d''Ivoire (Loi de finances 2025, document DGI FNE-procedureapi.pdf 27 pages)'
  changes:
    - 'AJOUT § 5.10 Module FNE Côte d''Ivoire : compliance obligatoire Loi de finances 2025 (articles 384, 385+ CGI). 10 capabilities (certification auto à l''émission, configuration FNE en onboarding, détection auto template B2B/B2C/B2G/B2F, mapping TVA et payment method, monitoring stickers temps réel, mode dégradé Workers Queue retry exp 5x, workflow avoirs/refund, workflow bordereau achat agricole V1.5+, audit 10 ans, multi-établissement)'
    - 'AJOUT notion multi-établissement / multi-point de vente : 1 organization → N establishments → N points_of_sale (obligation FNE de déclarer establishment + pointOfSale sur chaque facture)'
    - '§ 5.4 Facturation SYSCOHADA enrichi avec mention FNE auto pour orgs CI'
    - '§ 6.4 Conformité réglementaire enrichi : référence Loi 2025 + URL endpoints DGI'
    - 'Glossaire enrichi : FNE, RNE, TERNE, NCC, sticker, templates DGI (B2B/B2C/B2G/B2F), codes TVA (TVA/TVAB/TVAC/TVAD)'
    - 'Architecture step 4 : nouvelle section "Compliance régionale FNE CI" (10 décisions techniques : packages/fne dédié, asynchrone Workers Queue, retry exp 5x + DLQ, idempotency, chiffrement clé API, monitoring stickers, audit 10 ans). Mention multi-établissement dans Authentication & Security.'
    - 'Architecture step 5 : nouvelle section "FNE Certification Pattern Côte d''Ivoire" avec schemas Drizzle complets, code TypeScript du flow async, mapping __PROJECT_NAME__ → FNE payload, monitoring stickers cron, patterns UI FNE-specific, configuration plan-aware (Free désactivé, Starter 1+1, Business 3+5, Pro 10+20, Enterprise illimité)'
    - 'Architecture step 6 : ajout packages/fne (10 fichiers : provider, mapper, certification.service, refund.service, sticker-monitor.service, qr-generator, pdf-renderer, crypto, errors), schemas fne.ts + establishments.ts, router tRPC fne + establishments, queue consumer fne-consumer.ts, cron fne-sticker-monitor.ts, routes UI settings/fne.tsx + settings/establishments.tsx'
    - 'Frontière 2 import rules : packages/fne ajouté'
    - 'Frontière 3 services : FneProvider abstraction ajoutée'
    - 'Frontière 4 data boundaries : establishments + fne ajoutés'
  mvpScope: 'INCHANGÉ — trio CRM + Facturation + Encaissements + foundations + onboarding + FNE (CI)'
  prdVersion: '2.3'
  fneDocAnalyzed: 'docs/FNE-procedureapi.pdf — DGI Côte d''Ivoire Mai 2025, 27 pages, procédure API officielle'
  fneEndpoints: ['POST /external/invoices/sign (vente)', 'POST /external/invoices/{id}/refund (avoir)', 'POST /external/invoices/sign type=purchase (bordereau agricole, V1.5+)']
---

# Rapport de validation du PRD

**PRD validé :** `docs/__PROJECT_NAME__-PRD-v2.0-Africa.pdf`
**Date de validation :** 2026-05-12
**Auteur du PRD :** Marius
**Version :** 2.0 — Repositionnement Afrique UEMOA
**Statut au moment de la validation :** Draft

## Synthèse exécutive

**Statut global : ⚠️ Warning** — Le PRD __PROJECT_NAME__ v2.0 est un draft **largement au-dessus de la moyenne**, prêt à 80% pour la phase Architecture BMad. **Un axe Critical** doit cependant être adressé avant lancement public : la couverture **conformité fintech** (statut BCEAO, AML/KYC, prévention fraude, PCI-DSS, chiffrement at-rest).

### Tableau récapitulatif

| Étape | Statut | Détail |
|---|---|---|
| 02 — Détection de format | ✅ BMAD Standard | 6/6 sections cœur présentes |
| 03 — Densité d'information | ⚠️ Warning | 13 violations (concentré sur § 1-2-4-8 narratifs) |
| 04 — Couverture Brief | ⏭️ N/A | Aucun brief antécédent fourni |
| 05 — Mesurabilité | ⚠️ Warning fort | 14 violations (FRs : 3 / NFRs : 11) |
| 06 — Traçabilité | ⚠️ Warning | 8 gaps fins, 0 orphan FR |
| 07 — Fuite d'implémentation | ⚠️ Warning | 3-6 dans FRs/NFRs + § 4 entier en archi |
| 08 — Conformité domaine fintech | 🔴 **Critical** | 5 gaps critiques : BCEAO, AML/KYC, fraude, PCI-DSS, chiffrement at-rest |
| 09 — Conformité type projet | ⚠️ Warning | saas_b2b excellent (4.5/5), gaps PWA mineurs |
| 10 — SMART | ✅ Pass | 96% FRs ≥ 3, moyenne 4.7/5, § 5.4 parfait à 5.0/5 |
| 11 — Qualité holistique | 🟢 **4/5 — Good** | Solide avec améliorations mineures |
| 12 — Complétude | ✅ Pass (avec notes) | 13/13 sections présentes, parcours Fatou manquant |

### 🔴 Issue Critical (1 axe, 6 sous-points)

**Volet fintech sécurité/conformité sous-traité** :

- Statut BCEAO non tranché (commission 1% sur encaissements UEMOA → PSP réglementé ou facilitator ?)
- KYC clients PME absent
- Prévention fraude paiement absente
- PCI-DSS scoping implicite
- Chiffrement at-rest non mentionné
- Rétention 10 ans OHADA + droits RGPD-AF non couverts

### ⚠️ Warnings principaux (7)

1. NFRs § 6.2 Offline-first sous-spécifié (LWW vs CRDT non tranché → 3-6 mois de dette technique potentielle)
2. NFRs § 6.1 manque de percentiles / outils de mesure
3. NFRs § 6.5 SLA disponibilité sans fenêtre temporelle
4. Sections § 4 et § 13.1 architecturales par nature (~21% du PRD) — à déplacer en `architecture.md`
5. Densité narrative sur § 1-2-4.1-4.3-8 (gain 25-30% de longueur récupérable)
6. Parcours utilisateur "rétention mois 6" manquant (couvrirait churn/LTV/NPS)
7. Persona Fatou présentée mais sans parcours dédié (multi-devise EUR/FCFA)

### 🟢 Forces majeures

1. **§ 5.4 Facturation SYSCOHADA = 5.0/5 parfait** sur tous critères SMART — exemplaire
2. **Maîtrise réglementaire OHADA / SYSCOHADA / lois SN-CI exceptionnelle** pour un draft v2.0
3. **Personas et parcours ancrés dans la réalité africaine** (montants FCFA crédibles, géographies, métiers)
4. **Roadmap timeboxée avec jalons quantifiés** (M10/M12/M14/M18/M24) et seuils pivot lucides
5. **Tableau concurrentiel chiffré § 2.3** + insight Blue Ocean défendable
6. **Modèle économique transparent** (5 paliers FCFA + commission 1%)
7. **Risques mappés systématiquement** (probabilité × impact × mitigation)
8. **0 FR orphelin** — colonne vertébrale traçabilité saine
9. **96% des FRs au-dessus du seuil SMART** — passage en épics/stories sera fluide
10. **Vision claire et différenciée** — trio intégré positionné comme Blue Ocean UEMOA

### Top 3 améliorations à fort impact

1. 🥇 **Trancher statut BCEAO + ajouter AML/KYC/fraude/PCI-DSS** (1-2 jours) — élimine un risque juridique existentiel
2. 🥈 **Renforcer § 6.2 Offline-first** (½ jour) — évite 3-6 mois de dette technique selon choix LWW/CRDT
3. 🥉 **Convertir PDF → MD + déplacer § 4 vers `architecture.md`** (2-3 heures) — alignement workflow BMad standard

### Recommandation finale

**Avant `bmad-create-architecture` :** boucher impérativement l'axe Critical fintech (#1). Sans cela, l'architecte technique prendra des décisions sans guidance réglementaire, et les choix faits (modèle facilitator vs PSP, chiffrement, logs AML) seront coûteux à corriger plus tard.

**Une fois ce point traité (3-4 jours produit estimés)**, le PRD passera de **4/5 Good** à **5/5 Excellent**, et le projet sera prêt pour la phase 3 BMad (Solutioning).

---

## Documents d'entrée

- **PRD :** `__PROJECT_NAME__-PRD-v2.0-Africa.pdf` (28 pages, 13 sections)
- **Product Brief :** aucun
- **Recherche (marché / domaine / technique) :** aucun
- **Références additionnelles :** aucune

## Constats de validation

## Détection de format

**Structure du PRD (13 sections de niveau 1 + sous-sections) :**

1. Résumé exécutif (1.1 Vision, 1.2 Proposition de valeur, 1.3 Marché cible, 1.4 Modèle économique, 1.5 Différenciation)
2. Contexte et marché (2.1 Marché PME Afrique francophone, 2.2 Marchés pilotes, 2.3 Concurrence, 2.4 Tendances)
3. Personas et cas d'usage (3.1 Personas principaux, 3.2 Parcours Aïssatou, 3.3 Parcours Kouassi)
4. Architecture produit (4.1 Hiérarchie, 4.2 Stack technique, 4.3 Paiements multi-providers, 4.4 Conformité SYSCOHADA)
5. Spécifications fonctionnelles (5.1 Identity/Tenancy, 5.2 RBAC, 5.3 Billing, 5.4 Facturation, 5.5 Encaissements, 5.6 CRM light, 5.7 Roadmap modules)
6. Exigences non fonctionnelles (6.1 Performance, 6.2 Offline-first, 6.3 Sécurité, 6.4 Conformité, 6.5 Disponibilité, 6.6 Évolutivité, 6.7 Accessibilité/i18n)
7. Roadmap de développement (7.1-7.5 Phases 0-4, 7.6 Jalons)
8. Modèle solo founder + IA assistants (8.1-8.4)
9. Budget et ressources (9.1-9.3)
10. Stratégie Go-to-Market (10.1-10.3)
11. Risques et mitigations
12. Métriques de succès (12.1 KPI produit, 12.2 KPI business, 12.3 KPI techniques, 12.4 Seuils pivot)
13. Annexes et références (13.1-13.4)

**Sections cœur BMAD présentes :**

- Executive Summary : ✅ Présent (§ 1 — Résumé exécutif)
- Success Criteria : ✅ Présent (§ 12 — Métriques de succès + § 7.6 Jalons)
- Product Scope : ✅ Présent (couvert par § 1.3 Marché cible, § 4.1 Hiérarchie tiers, § 5.7 Roadmap modules Phase 2/3, § 7 Roadmap)
- User Journeys : ✅ Présent (§ 3.2 Parcours Aïssatou, § 3.3 Parcours Kouassi)
- Functional Requirements : ✅ Présent (§ 5 — Spécifications fonctionnelles)
- Non-Functional Requirements : ✅ Présent (§ 6 — Exigences non fonctionnelles)

**Classification du format :** BMAD Standard
**Sections cœur présentes :** 6/6

**Sections additionnelles BMAD-friendly détectées :**
- Domain Requirements : ✅ Présent (§ 4.4 SYSCOHADA, § 6.4 Conformité réglementaire — OHADA, lois SN/CI)
- Innovation Analysis : ✅ Présent (§ 1.5 Différenciation, § 2.3 Concurrence, § 2.4 Tendances)
- Project-Type Requirements : ✅ Présent (§ 4.2 Stack, § 6.1 Performance mobile, § 6.2 Offline-first — SaaS B2B mobile-first)

**Spécificités notables :**
- Format PDF (issu de DOCX) — pas de frontmatter YAML, donc pas d'`inputDocuments` ni de `classification.domain` exploitables programmatiquement
- Excellent niveau de détail pour un PRD draft : KPI quantifiés, roadmap timeboxée, projections financières
- Sections complémentaires hors standard BMAD : Budget (§ 9), GTM (§ 10), Risks (§ 11), Annexes (§ 13)

## Validation de la densité d'information

Note : la grille BMAD est anglophone — adaptation aux équivalents français appliquée.

**Anti-patterns détectés :**

### Formules creuses / préambules narratifs (filler) — 5 occurrences

| § | Extrait | Suggestion |
|---|---|---|
| 1.1 | "Là où les solutions existantes (Sage, SmartERP, Pennylane, Odoo) proposent des outils de gestion classiques inadaptés aux réalités africaines (…), __PROJECT_NAME__ propose une approche moderne, modulaire et mobile-first qui couvre…" | Cadrage narratif → reformuler en énoncé direct : "__PROJECT_NAME__ : approche modulaire mobile-first couvrant prospection → encaissement, là où Sage/SmartERP/Pennylane/Odoo restent inadaptés (mobile money, SYSCOHADA, connectivité)." |
| 4.1 | "__PROJECT_NAME__ reste structurée en quatre tiers, mais avec des adaptations majeures pour le contexte africain :" | "Architecture en 4 tiers, adaptés contexte africain :" |
| 4.1 (Tier 3) | "Au MVP, __PROJECT_NAME__ propose le trio fondamental :" | "Trio MVP :" |
| 5.6 (Note) | "Note : Le CRM light du MVP ne contient pas les fonctionnalités avancées (…). Elles seront ajoutées en V1.5 selon retours bêta." | Promouvoir en sous-section ou liste explicite "Hors scope MVP / V1.5+" |
| 5.7 | "Les modules suivants seront développés après validation du trio MVP :" | "Modules post-MVP :" |

### Phrases verbeuses (wordy) — 3 occurrences

| § | Extrait | Suggestion |
|---|---|---|
| 4.3 | "La couche paiements est probablement le composant technique le plus critique de __PROJECT_NAME__. Elle doit gérer deux flux distincts :" | "Couche paiements (critique) — 2 flux :" — supprimer le hedge "probablement" |
| 8.1 | "__PROJECT_NAME__ sera développé selon un modèle innovant de solo founder augmenté par des assistants IA spécialisés. Ce modèle, encore récent dans l'industrie, est viable pour un SaaS B2B comme __PROJECT_NAME__ grâce à la maturité actuelle des outils d'IA pour le développement." | "Modèle de développement : solo founder + assistants IA spécialisés. Viabilité confirmée par la maturité actuelle des outils IA." |
| 2.1 | "L'Afrique francophone compte plus de 7 millions de TPE et PME, dont 90% évoluent dans le secteur informel. La transformation digitale est en pleine accélération, portée par trois tendances de fond :" | OK structurellement, mais "en pleine accélération" est rhétorique ; remplaçable par un chiffre de croissance. |

### Adjectifs subjectifs (overlap NFR/FR mais affecte la densité) — 4 occurrences

| § | Extrait | Problème |
|---|---|---|
| 1 (bullet) | "Tarification accessible" (titre) | Heading subjectif ; le contenu est quantifié (5 000 FCFA), mais le titre devrait l'être aussi → "Tarification entrée 5 000 FCFA/mois" |
| 1.5 | "Stack technique moderne (TanStack Start, Cloudflare edge, IA-first) vs solutions historiques basées sur PHP/.NET legacy" | "moderne"/"historiques"/"legacy" sont chargés. Reformuler en faits : "Stack edge-first (TanStack Start, Cloudflare Workers) vs stacks 2005-2015 des concurrents (PHP/.NET)" |
| 8.2 | "Vitesse de prototypage 3-5x supérieure à un développement humain classique" | "classique" vague → "vs équipe full-stack 2-3 devs équivalente" |
| 8.3 | "documentation excessive de l'architecture" | Probablement "exhaustive" attendu ; "excessive" connote négativement |

### Redondances — 1 occurrence

| § | Extrait | Problème |
|---|---|---|
| 2.3 (Insight) | "C'est précisément le Blue Ocean que __PROJECT_NAME__ va occuper" | Buzzword marketing ; déjà démontré par le tableau concurrentiel juste au-dessus → coupable de redite stylistique |

### Bilan quantifié

- Formules creuses : **5**
- Phrases verbeuses : **3**
- Adjectifs subjectifs (impact densité) : **4**
- Redondances / buzzwords : **1**
- **Total violations : 13**

**Évaluation de sévérité : ⚠️ Warning → frontière Critical** (seuil Critical BMAD = > 10)

**Recommandation :**

Le PRD est structurellement solide et **densifie sensiblement à partir du § 5** (Spécifications fonctionnelles) et § 6 (NFR) — ces sections sont bullet-style, directes, exemplaires. **La densité chute dans les sections de cadrage (§ 1, § 2, § 4.1, § 4.3, § 8)** qui adoptent un ton pitch/marketing.

**Action recommandée :** révision ciblée des sections 1, 2, 4.1, 4.3, 8.1 pour passer d'un ton narratif/marketing à un ton spec dense. **Gain estimé : ~25-30% de réduction de longueur sur ces sections, sans perte d'information.** Les sections 5, 6, 7 sont à conserver telles quelles.

## Couverture du Product Brief

**Statut : N/A** — aucun Product Brief n'a été fourni en entrée. Le PRD a été produit directement, sans phase 1 d'analysis BMad (brainstorming, brief ou PRFAQ).

**Note d'audit :** la rigueur de la phase 2.3 (Concurrence avec tableau quantifié), § 3 (Personas avec chiffres réels) et § 7.6 (Jalons avec critères de succès) suggère qu'une analyse préalable a été menée — mais elle n'est pas documentée comme artefact BMad traçable. **Risque** : pas de chaîne de traçabilité vers les sources d'évidence (études marché, interviews utilisateurs, benchmarks). À considérer si certains chiffres (78% pénétration mobile money Sénégal, CAC TPE 5 000 FCFA, taux de conversion bêta > 60%) doivent être défendus auprès d'un investisseur ou stakeholder.

## Validation de mesurabilité

### Exigences fonctionnelles (FRs)

**Total FRs analysées :** ~75 (sections 5.1 à 5.6, hors roadmap § 5.7)

**Violations de format :** 0
Tous les FRs sont rédigés en énoncés directs sous forme de capabilities — bullet-style propre, conforme au standard BMAD.

**Quantificateurs vagues :** 3

| § | Énoncé | Problème | Suggestion |
|---|---|---|---|
| 5.3 | "Gestion des moyens de paiement multiples" | "multiples" non quantifié | "Jusqu'à 5 moyens de paiement actifs simultanément par client" |
| 5.5 | "Notifications temps réel : push, email, WhatsApp à réception" | "temps réel" sans SLA | "Notifications dans les 5 secondes suivant la confirmation webhook" |
| 5.5 | "Tableau de bord encaissements : flux temps réel, totaux journaliers" | "temps réel" sans fréquence | "Rafraîchissement automatique toutes les 10 secondes (ou via webhook push)" |

**Fuite d'implémentation :** Borderline — 8 occurrences

Note : les noms de PSP (Wave, Orange Money, Free Money, Paystack, Flutterwave, Stripe) apparaissent dans les FRs § 5.3 (Billing) et § 5.5 (Encaissements). **Strictement parlant**, ces noms sont de l'implémentation et appartiendraient à l'architecture. **Mais** ce sont des éléments de proposition de valeur ("encaissements natifs Mobile Money via Wave/Orange Money") — leur présence dans le PRD est défendable car ils définissent le périmètre fonctionnel attendu par les clients (un client africain attend explicitement Wave/Orange Money, pas "un PSP générique").

**Recommandation pratique :** conserver les noms de providers dans § 5.5 (différenciation produit) mais ajouter un FR meta-capability en tête de section : "__PROJECT_NAME__ intègre nativement les PSP majeurs UEMOA (Wave, Orange Money, Free Money) et les agrégateurs cartes (Paystack pour local, Stripe pour international)" — puis lister les intégrations spécifiques.

**Adjectifs subjectifs dans FRs :** 0
Aucun "easy", "intuitive", "rapide" non quantifié dans les FRs.

**Total violations FR :** **3** (en mode strict ; 0 si l'on tolère les noms de PSP comme value-prop)

### Exigences non fonctionnelles (NFRs)

**Total NFRs analysées :** ~35 (sections 6.1 à 6.7)

**Métriques excellentes (exemples à conserver tels quels) :**
- § 6.1 : "Temps de réponse API < 300 ms en P95 depuis Dakar et Abidjan" — métrique + percentile + localisation ✓
- § 6.5 : "RTO 4 heures, RPO 1 heure" — métriques BCP standards ✓
- § 6.7 : "Conformité WCAG 2.1 niveau AA" — référentiel + niveau ✓

**Métriques manquantes ou incomplètes :** 6

| § | Énoncé | Problème | Suggestion |
|---|---|---|---|
| 6.1 | "Temps de chargement initial < 2 secondes sur connexion 3G dégradée" | Pas de percentile ni outil de mesure | "< 2s en P95 sur 3G Slow (400 kbps, 400ms RTT), mesuré via Lighthouse CI" |
| 6.1 | "Capacité à supporter 5 000 contacts et 10 000 factures par organisation sans dégradation" | "sans dégradation" non chiffré | "...avec maintien du P95 API < 300 ms et P95 chargement listing < 1 s" |
| 6.2 | "Service Worker agressif : cache complet de l'app shell" | "agressif" subjectif | "Stratégie cache-first sur app shell (HTML/CSS/JS) avec TTL 24h, revalidation background" |
| 6.2 | "Indicateur visuel clair du statut de connexion" | "clair" subjectif | "Badge persistant en barre supérieure : 3 états (online vert, syncing orange, offline gris)" |
| 6.2 | "Résolution de conflits pour les modifications concurrentes" | Stratégie non spécifiée | "Stratégie LWW (Last-Write-Wins) sur champs scalaires, merge 3-way sur listes de lignes (factures)" |
| 6.3 | "Rate limiting global et par utilisateur sur l'API" | Aucune limite chiffrée | "1 000 req/min/utilisateur authentifié, 100 req/min/IP anonyme, 10 000 req/min global" |

**Adjectifs subjectifs persistants :** 2

| § | Énoncé | Problème |
|---|---|---|
| 6.1 | "Optimisation des images : compression automatique, formats modernes (WebP, AVIF)" | "modernes" — mitigé par les exemples (WebP, AVIF), acceptable |
| 6.7 | "Polices Web Fonts optimisées pour faibles débits" | "optimisées" et "faibles débits" sans seuil | Suggérer : "Sous-ensembles latin + français d'Afrique, format WOFF2, total ≤ 50 KB" |

**Contexte / fenêtre temporelle manquant :** 2

| § | Énoncé | Problème |
|---|---|---|
| 6.5 | "SLA cible : 99,5% au lancement, 99,9% en phase de maturité" | Pas de fenêtre (mensuelle ? annuelle ?) ni de méthode de mesure | "...mensuelle, mesurée hors fenêtres de maintenance planifiées, via cloud provider SLA + status page interne" |
| 6.5 | "Notifications proactives aux clients en cas de maintenance" | Pas de SLA lead time | "Préavis ≥ 48 h pour maintenance planifiée, ≥ 5 min pour maintenance d'urgence" |

**Vague conditionnel :** 1
- § 6.6 : "Migration d'un module en microservice possible si nécessaire" — clause d'évolutivité OK comme principe, mais le "si nécessaire" rend ce point non testable. À déplacer en "Principes architecturaux" plutôt qu'en NFR.

**Total violations NFR :** **11**

### Évaluation globale

| Catégorie | Violations |
|---|---|
| FR — Format | 0 |
| FR — Quantificateurs vagues | 3 |
| FR — Fuite d'implémentation (borderline) | 0-8 (selon tolérance value-prop) |
| FR — Adjectifs subjectifs | 0 |
| NFR — Métriques manquantes/incomplètes | 6 |
| NFR — Adjectifs subjectifs | 2 |
| NFR — Contexte/fenêtre | 2 |
| NFR — Vague conditionnel | 1 |
| **Total (mode strict)** | **14** |
| **Total (mode tolérant value-prop)** | **14** (les PSP sont justifiés) |

**Sévérité : ⚠️ Warning fort → frontière Critical** (seuil Critical BMAD = > 10)

**Recommandation :**

Le PRD est **structurellement très solide** côté FRs : aucune violation de format, capabilities directes, scope clairement délimité par module. Les **FRs sont prêts pour épics & stories**.

**Le talon d'Achille est concentré sur les NFRs**, notamment § 6.1 (Performance), § 6.2 (Offline-first) et § 6.5 (SLA disponibilité) :

1. **§ 6.2 Offline-first est sous-spécifié** : c'est un pilier différenciateur du produit, pourtant la stratégie de cache, l'indicateur de statut et la résolution de conflits sont décrits qualitativement. **Risque critique** : l'architecte aura des décisions techniques majeures à prendre sans guidance (LWW vs CRDT, ce sont 3-6 mois de dette technique différents).
2. **§ 6.1 manque de percentiles et d'outils de mesure** — facilement corrigible (5-10 ajouts ciblés).
3. **§ 6.5 SLA sans fenêtre** est un point classique mais sensible (clients enterprise négocient le calcul du SLA).

**Action recommandée : enrichir § 6.1, § 6.2, § 6.3 (rate limiting) et § 6.5 avant de passer à la création d'architecture** — sinon l'archi devra elle-même prendre ces décisions, ce qui les éloigne de la phase produit.

## Validation de traçabilité

### Chain 1 — Executive Summary (§ 1) → Success Criteria (§ 7.6, § 12)

**Statut : Globalement intact, 1 gap mineur**

| Élément vision § 1 | Couverture Success Criteria |
|---|---|
| TPE/PME francophones SN+CI | ✓ Jalons § 7.6 (5 SN + 5 CI bêta, expansion 3e pays M24) |
| Prospection → encaissement (chaîne complète) | ✓ KPI § 12.1 (Time to first invoice, Time to first payment) |
| Mobile money natif | ✓ KPI § 12.3 ("Taux de réussite paiement mobile money > 95%") |
| Conformité SYSCOHADA | ⚠️ Pas de KPI direct (ex: 0 facture non-conforme). Couvert par audit mais non mesuré en KPI |
| Mobile/offline-first | ✓ NFR § 6.1 + § 6.2 (latence Dakar/Abidjan, PWA) |
| **WhatsApp Business intégré** | ⚠️ **Aucun KPI sur l'usage WhatsApp** (ex: % factures envoyées par WhatsApp, taux de conversion lien WhatsApp). Pilier différenciateur non mesuré |
| Prix accessible | ✓ § 10.3 (CAC TPE 5 000 FCFA) + § 9.3 panier moyen 22 000 FCFA |

### Chain 2 — Success Criteria → User Journeys (§ 3.2, § 3.3)

**Statut : ⚠️ 4 gaps modérés** — plusieurs success criteria business ne sont pas adressés par les parcours utilisateur.

| Success criterion | Parcours qui le démontre | Statut |
|---|---|---|
| Time to first invoice < 15 min | Aïssatou (création contact 30 sec + facture 1 clic) | ✓ |
| Time to first payment < 24h | Aïssatou (paiement Wave en 20 sec) | ✓ |
| **Activation rate 70% (3 factures en 14j)** | Aucun parcours d'onboarding ne montre comment un nouveau client atteint 3 factures | ⚠️ Gap |
| Module adoption 2,5 modules | Aïssatou utilise Facturation + Encaissements + (CRM léger via "création contact") | ✓ |
| **NPS ≥ 35 bêta / 50 à 12 mois** | Aucun parcours de feedback / collecte NPS | ⚠️ Gap |
| MRR objectifs | Acquisition via coopérative (Aïssatou) + expert-comptable (Kouassi) | ✓ partiel |
| CAC cibles par segment | Couvert par § 10 GTM, pas par parcours | ✓ (via GTM) |
| **Churn < 8% an 1** | Aucun parcours de rétention / réactivation / lutte contre l'attrition | ⚠️ Gap critique |
| **LTV > 250 000 FCFA à 24m** | Pas de parcours d'expansion (upsell modules, increment plan) | ⚠️ Gap |

**Suggestion** : ajouter un 4e parcours type "**Aïssatou — mois 6**" qui démontre la rétention (renouvellement abonnement, activation d'un 2e module, upsell vers Business). Ce parcours couvrirait les success criteria churn/LTV/NPS.

### Chain 3 — User Journeys → FRs (§ 5)

**Statut : ⚠️ 3-4 gaps de détail entre parcours et FRs**

**Parcours Aïssatou — gaps :**

| Action du parcours | FR correspondant | Statut |
|---|---|---|
| Tableau de bord matin (3 clientes, 2 impayées, 285k encaissés) | § 5.5 (tableau encaissements) + § 5.4 (factures impayées) | ✓ |
| Création contact 30 sec | § 5.6 (Gestion contacts personnes) | ✓ |
| Génération lien Wave par WhatsApp 25 000 FCFA | § 5.5 (liens MM) + § 5.4 (envoi WhatsApp) | ✓ |
| Paiement Wave 20 sec → facture statut payé auto | § 5.5 (Wave Direct + réconciliation auto) | ✓ |
| **Reçu PDF envoyé automatiquement par WhatsApp** | § 5.4 mentionne "génération reçus automatiques" mais **n'explicite pas l'envoi PDF WhatsApp automatique** | ⚠️ Gap FR |
| **Rapport quotidien avec écarts au prévisionnel** | Aucun FR sur le forecasting / écarts prévisionnels dans le MVP | ⚠️ Gap (feature non scopée mais promise au parcours) |
| Relances WhatsApp pré-remplies (nom + montant) | § 5.4 (Relances WhatsApp template pré-rempli) | ✓ |

**Parcours Kouassi — gaps :**

| Action du parcours | FR correspondant | Statut |
|---|---|---|
| Pipeline kanban (30 prospects, 8 en phase finale, 25M FCFA) | § 5.6 (kanban, opportunités, montant FCFA) | ✓ |
| **Conversion opportunité → facture SYSCOHADA en 1 clic** | § 5.6 dit "Conversion opportunité en devis en 1 clic". **Le passage devis → facture est en 2 étapes selon § 5.4** ("Conversion automatique devis accepté en facture en 1 clic"). Le parcours simplifie. | ⚠️ Ambiguïté wording — clarifier le flow |
| **Paiement partiel 2,5M par virement bancaire** | § 5.5 ne liste pas le **virement bancaire** comme moyen d'encaissement client (seulement Wave, OM, Free Money, cartes locales/intl). Le virement n'apparaît qu'en § 4.3 pour le subscription billing. | ⚠️ **Gap FR significatif** — incohérence parcours/FR |
| Export SYSCOHADA mensuel vers expert-comptable | § 5.4 (Export comptable SYSCOHADA CSV) | ✓ |

### Chain 4 — Product Scope → FRs

**Statut : ✓ Aligné**

- MVP scope (§ 4.1 Tier 3 + § 5.1-5.6) : trio CRM light + Facturation SYSCOHADA + Encaissements MM → couverture FR complète ✓
- Foundations (§ 4.1 Tier 0/1/2) → Identity § 5.1, RBAC § 5.2, Billing § 5.3 ✓
- ⚠️ **Tier 1 services partagés** : "Notifications multi-canal", "Files (R2)", "Jobs queue (BullMQ)", "Events bus", "Payment abstraction" ne sont pas listés comme **sections FR dédiées** — ils sont architecturaux mais certains méritent un FR (ex : "Notifications multi-canal email/WhatsApp/SMS" devrait être un FR explicite cross-modules, pas seulement un bullet en § 4.1)

### Matrice de traçabilité (synthèse)

| Chaîne | Statut | Issues |
|---|---|---|
| Exec Summary → Success Criteria | Globalement intact | 1 gap (WhatsApp non mesuré) |
| Success Criteria → User Journeys | ⚠️ Partiellement intact | 4 gaps (activation, NPS, churn, LTV non démontrés par parcours) |
| User Journeys → FRs | ⚠️ Partiellement intact | 3 gaps (reçu WhatsApp, virement bancaire client, conversion 1 clic ambiguë) |
| Scope → FRs | ✓ Intact | 0 gap structurel, 1 mineur (services partagés Tier 1 sans FR dédiés) |

**Orphan FRs détectés :** **0** — aucun FR ne flotte sans rattachement à une capability métier.

**Total issues traçabilité :** **8 gaps** (0 critiques, 5 modérés, 3 mineurs)

**Sévérité : ⚠️ Warning** (orphan FRs = 0 — la colonne vertébrale tient ; les gaps sont des détails à boucher)

**Recommandation :**

La structure de traçabilité est saine — aucun FR orphelin, scope MVP cohérent avec FRs. Deux axes de renforcement :

1. **Ajouter un parcours utilisateur "rétention / mois 6"** pour couvrir les success criteria churn, LTV, NPS, activation. Sans ce parcours, l'archi et les épics manqueront de guidance sur la rétention.
2. **Aligner les FRs avec les parcours** sur 3 points précis :
   - Documenter le virement bancaire comme moyen d'encaissement client (§ 5.5) — ou retirer du parcours Kouassi
   - Expliciter l'envoi WhatsApp automatique des reçus PDF (§ 5.4)
   - Clarifier le flow opportunité → devis → facture (1 ou 2 clics ?)
3. **Promouvoir Notifications multi-canal et WhatsApp Business en FR cross-cutting** (§ 5 actuel ou nouveau § 5.0 "Services partagés FR").

## Validation de fuite d'implémentation

### Constat structurel macro — § 4 "Architecture produit"

**Avant tout détail, un constat important :**

Le PRD intègre une **section § 4 "Architecture produit"** (4.1 Hiérarchie composants, 4.2 Stack technique, 4.3 Architecture paiements, 4.4 Conformité technique) ainsi qu'un § 13.1 "Décisions architecturales clés". **Selon la séparation BMAD stricte, l'intégralité de ces contenus appartient au document Architecture, pas au PRD** — un PRD pur ne devrait décrire ni `TanStack Start v1`, ni `Drizzle ORM multi-schema`, ni `Neon Postgres EU vs AWS Cape Town`, ni `BullMQ sur Redis Upstash`.

**Volume affecté :** environ **6 pages sur 28 (~21%)** sont architecturales par nature.

**Interprétation :** Ce n'est pas anormal pour :
- Un PRD initial produit en solo founder (single-source-of-truth)
- Un projet où les contraintes techniques sont des contraintes business (mobile-first sur 3G, intégrations PSP locales, hébergement Afrique)

**Mais** dans le flow BMad, cette section sera **redondante** une fois `bmad-create-architecture` exécuté — il faudra arbitrer : soit déplacer ce contenu dans `architecture.md` (recommandé BMad), soit assumer le double-emploi et garder la trace dans le PRD.

### Fuites d'implémentation **dans les FRs (§ 5) et NFRs (§ 6) eux-mêmes**

Scan exclusion faite de § 4 et § 13 :

#### Catégorie 1 — Bases de données / persistance : 1 violation

| § | Énoncé | Fuite |
|---|---|---|
| 6.3 | "Isolation cross-tenant garantie par triple couche (middleware, ORM, **RLS PostgreSQL**)" | PostgreSQL est un choix BDD spécifique. Reformulation BMad : "Isolation cross-tenant garantie au niveau base de données via row-level security (ou équivalent), middleware applicatif et ORM" |

#### Catégorie 2 — APIs/standards Web : 2 violations

| § | Énoncé | Fuite |
|---|---|---|
| 6.2 | "**Service Worker** agressif : cache complet de l'app shell" | Service Worker est une Web API spécifique. Reformulation : "Stratégie de cache local persistant de l'app shell (TTL 24h, revalidation background)" |
| 6.2 | "Données utilisateur disponibles hors-ligne via **IndexedDB**" | IndexedDB est une Web API. Reformulation : "Données utilisateur disponibles hors-ligne via stockage navigateur persistant" |

#### Catégorie 3 — Algorithmes / cryptographie : 1 violation (acceptable)

| § | Énoncé | Fuite |
|---|---|---|
| 6.3 | "Mots de passe hashés avec **Argon2**" | Argon2 est un algorithme spécifique. **Acceptable** car référence à un standard de sécurité validé (OWASP). Pourrait être : "Algorithme de hashage adaptive memory-hard recommandé OWASP (Argon2id par défaut)" |

#### Catégorie 4 — Patterns architecturaux : 1 violation

| § | Énoncé | Fuite |
|---|---|---|
| 6.6 | "Migration d'un module en **microservice** possible si nécessaire" | Pattern d'architecture, pas un NFR. Ce point appartient aux principes architecturaux ou ADR (Architecture Decision Record). À retirer du PRD. |

#### Catégorie 5 — Bundle / artefacts de build : 1 violation

| § | Énoncé | Fuite |
|---|---|---|
| 6.1 | "Bundle **JavaScript** initial < 200 KB compressé" | JavaScript est une techno spécifique. Tolérable comme vocabulaire universel web ; reformulation puriste : "Code client initial téléchargé < 200 KB compressé (gzip/brotli)" |

#### Catégorie 6 — Patterns d'intégration : 2 occurrences

| § | Énoncé | Statut |
|---|---|---|
| 5.3 | "**Webhooks** Stripe/Paystack/Wave pour synchronisation des activations" | Webhook est un pattern d'intégration. **Capability-relevant** car définit le mode de synchronisation expected — acceptable. |
| 5.5 | "**Webhooks** de confirmation automatique avec mise à jour facture" | Idem — acceptable comme capability "le système réagit à des événements push d'opérateurs externes" |

#### Catégorie 7 — Noms de PSP dans § 5 (Encaissements + Billing) : ~7 occurrences

Déjà traité en validation de mesurabilité. Rappel : Wave, Orange Money, Free Money, Paystack, Flutterwave, Stripe — **acceptable car value-prop** ("native PSP intégration"). Le PRD doit nommer ces providers, c'est la promesse différenciatrice.

#### Catégorie 8 — Standards/protocoles acceptables (pas des fuites)

- "Chiffrement TLS 1.3" (§ 6.3) — standard, capability ✓
- "Protection OWASP Top 10" (§ 6.3) — référentiel, capability ✓
- "WCAG 2.1 niveau AA" (§ 6.7) — standard accessibilité ✓
- "PWA installable" (§ 6.1) — feature utilisateur, capability ✓
- "Point-in-Time Recovery" (§ 6.5) — terme industriel standard ✓
- "WebP, AVIF" (§ 6.1) — formats fichiers, capability ✓
- "CSV import/export" (§ 5.4, § 5.6) — format interop, capability ✓
- "OAuth Google/Microsoft" (§ 5.1) — providers identité, capability ✓
- "TOTP" (§ 5.1) — standard MFA, capability ✓

### Bilan

| Catégorie | Violations | Sévérité |
|---|---|---|
| BDD/persistance (PostgreSQL) | 1 | Modérée |
| APIs Web (Service Worker, IndexedDB) | 2 | Modérée |
| Algorithmes crypto (Argon2) | 1 | Tolérable |
| Patterns archi (microservice) | 1 | À déplacer en ADR |
| Bundle (JavaScript) | 1 | Mineure |
| Webhooks | 2 | Acceptable (capability) |
| Noms PSP (déjà traités § 5) | ~7 | Acceptable (value-prop) |
| **Total dans FRs/NFRs (mode strict)** | **6** | **⚠️ Critical borderline** |
| **Total dans FRs/NFRs (mode tolérant)** | **3-4** | **⚠️ Warning** |

**Hors décompte FRs/NFRs :** § 4 entier est implémentation (~6 pages). Selon BMad strict, à déplacer en `architecture.md`.

**Sévérité retenue : ⚠️ Warning** (avec note sur § 4)

**Recommandation :**

1. **§ 4 "Architecture produit" et § 13.1 "Décisions architecturales"** : À retirer du PRD lors du passage à `bmad-create-architecture`. Le contenu est précieux et sera réutilisé tel quel — il appartient juste à un autre document. Conserver dans le PRD uniquement les contraintes business-driven : "hébergement avec POP Afrique pour latence Dakar/Abidjan", "intégrations PSP UEMOA natives", etc.
2. **Dans § 6 NFRs**, 4 reformulations rapides :
   - "PostgreSQL RLS" → "row-level security base de données"
   - "Service Worker / IndexedDB" → "cache + stockage local navigateur"
   - "microservice possible si nécessaire" → à retirer (point ADR, pas NFR)
   - "Argon2" → "algorithme adaptive memory-hard OWASP-recommandé"
3. **Conserver tel quel** :
   - Noms de PSP dans § 5 (value-prop différenciateur)
   - Standards référencés (TLS 1.3, OWASP, WCAG, PWA, TOTP, OAuth)
   - Patterns Webhook (capability d'intégration)

## Validation de conformité au domaine

### Classification du domaine

**Frontmatter PRD :** Absent (PDF). Domaine déduit du contenu.

**Domaine identifié :** **Fintech / Regtech / B2B SaaS Comptable**

**Signaux détectés (alignés avec la grille BMad `domain-complexity.csv` fintech) :**
- "payment" — § 4.3, § 5.3, § 5.5 (paiements mobile money, cartes, Stripe, virement)
- "transaction" — § 5.5 (encaissements), § 12.2 (KPI encaissements traités)
- "wallet" — § 1, § 2.2 (Wave Card, Orange Bank, Free Money Card)
- "funds" — § 5.5 (réconciliation, paiements partiels, commission 1%)
- "compliance" — § 4.4, § 6.4 (SYSCOHADA, lois SN/CI, e-facturation, RGPD-AF)
- "accounting" — § 5.4 (Facturation SYSCOHADA), § 5.7 (Module Comptabilité Phase 2)

**Complexité : 🔴 ÉLEVÉE** (regtech multi-juridictionnel : OHADA + DGI SN + DGI CI + CDP + ARTCI + BCEAO implicite)

### Couverture des sections spéciales requises (grille BMad fintech)

| Section requise BMad | Couverture PRD | Statut |
|---|---|---|
| **compliance_matrix** | § 6.4 Conformité réglementaire — liste OHADA, SYSCOHADA, Loi 2008-12 SN, Loi 2013-450 CI, CDP, ARTCI, mentions légales par pays, e-facturation, CGU OHADA | ✅ Adéquat |
| **security_architecture** | § 6.3 Sécurité — TLS 1.3, Argon2, OWASP Top 10, rate limiting, audit log immuable, isolation cross-tenant triple-couche, audit sécurité externe, plan de réponse incidents | ✅ Adéquat (à nuancer ci-dessous) |
| **audit_requirements** | § 6.3 (audit log immuable) + § 5.4 (export comptable SYSCOHADA / FEC pour experts-comptables) | ⚠️ Partiel — pas de plan d'audit DGI ni de processus de contrôle fiscal |
| **fraud_prevention** | **Absent** | ❌ **Manquant** |

### Analyse fine par axe fintech

#### Axe 1 — Conformité réglementaire multi-juridictionnelle : ✅ EXCELLENT

Le PRD couvre admirablement les obligations OHADA + nationales :
- SYSCOHADA Révisé (plan comptable, FEC export) ✓
- TVA SN 18% et CI 18%/9% avec exonérations ✓
- Mentions obligatoires factures (NINEA SN, RCCM, régime fiscal) ✓
- Facture normalisée DGI SN (timbre fiscal électronique) ✓
- E-facturation DGI CI (préparation) ✓
- Lois de protection des données (2008-12 SN, 2013-450 CI) ✓
- Déclarations CDP Sénégal + ARTCI Côte d'Ivoire ✓

#### Axe 2 — Sécurité paiements et données financières : ⚠️ Gaps significatifs

| Exigence | Statut PRD | Note |
|---|---|---|
| Chiffrement en transit (TLS 1.3) | ✓ § 6.3 | OK |
| **Chiffrement at-rest des données sensibles** | ❌ Absent | Manque — données clients, transactions, IBAN éventuels |
| Hashage mots de passe (Argon2) | ✓ § 6.3 | OK |
| **PCI-DSS scoping (cartes bancaires)** | ⚠️ Implicite | Le PRD délègue à Stripe/Paystack mais ne mentionne pas explicitement la stratégie "tokenization-only, no card data stored, PCI-DSS scope SAQ A" |
| **AML/KYC framework pour clients PME** | ❌ Absent | __PROJECT_NAME__ traite des flux financiers (commission 1%) → KYC clients PME nécessaire selon BCEAO. Ni KYC, ni AML mentionnés. |
| Audit log immuable | ✓ § 6.3 | OK |
| Isolation cross-tenant | ✓ § 6.3 | Triple couche middleware/ORM/RLS — solide |
| MFA pour comptes sensibles | ✓ § 5.1 | Owners obligatoire, users optionnel — bon design |
| Audit sécurité externe pré-lancement | ✓ § 6.3 | OK |
| Plan réponse incidents | ✓ § 6.3 | Mention présente, pas détaillée |

#### Axe 3 — Statut réglementaire de __PROJECT_NAME__ en tant qu'agrégateur : ❌ Question majeure non traitée

**Le PRD prélève une commission de 1% sur les encaissements traités** (§ 1.4, § 4.3, § 5.5). Cette commission soulève des questions réglementaires :

- **Statut BCEAO** : agir comme intermédiaire de paiement dans la zone UEMOA requiert généralement un statut d'**Établissement de paiement** ou **PSP agréé BCEAO**, sauf si __PROJECT_NAME__ n'est qu'un "facilitateur technique" sans détention de fonds.
- **Flow des fonds** : Si Wave/Paystack/Stripe encaissent directement chez le PME et __PROJECT_NAME__ facture sa commission séparément (modèle "facilitator"), le risque réglementaire est limité. Si __PROJECT_NAME__ intermédiate les fonds (modèle "settlement"), il devient PSP.
- **Le PRD ne tranche pas ce flux** → arbitrage critique à clarifier **avant l'architecture**, car le choix conditionne le modèle technique ET le statut juridique.

#### Axe 4 — Prévention de la fraude : ❌ ABSENT du PRD

**Aucune section ni FR/NFR sur :**
- Détection de fraude paiement (transactions suspectes, vélocité anormale)
- Limites de transaction par défaut (par utilisateur, par jour, par compte)
- Webhook anti-fraude (Stripe Radar, Paystack équivalent)
- Monitoring temps réel des transactions
- Processus de gel de compte / dispute / chargeback handling
- Anti-takeover de compte (détection logins suspects)

**Risque** : pour un SaaS qui traite des encaissements de PME africaines (cible : 200M FCFA/mois M18 selon § 1.4), l'absence de **fraud prevention** est un gap critique pour un produit fintech. À adresser obligatoirement avant lancement public.

#### Axe 5 — Conservation des données et rétention : ⚠️ Partiel

- § 6.5 mentionne "sauvegardes rétention 30 jours" et "PITR 7 jours" — mais c'est l'opérationnel (DRP), pas la politique de rétention légale
- **Rétention légale SYSCOHADA** : les documents comptables doivent être conservés **10 ans** en droit OHADA. Le PRD ne mentionne pas cette obligation.
- **RGPD-AF / lois SN/CI** : droits des personnes (accès, rectification, effacement, portabilité) non mentionnés en FR
- **Politique de suppression à la résiliation client** : que devient la donnée après churn ? Pas traité.

### Bilan conformité

| Volet | Évaluation |
|---|---|
| Conformité réglementaire SYSCOHADA + lois SN/CI | ✅ Excellent — niveau professionnel |
| Sécurité technique de base | ✅ Bon |
| Sécurité paiements / cartes / PCI-DSS | ⚠️ Implicite, à expliciter |
| KYC/AML | ❌ Absent — critique |
| Statut réglementaire BCEAO / PSP | ❌ Question non tranchée — bloquant |
| Prévention fraude | ❌ Absent — critique |
| Chiffrement at-rest | ❌ Absent |
| Rétention légale 10 ans OHADA | ❌ Absent |
| Droits RGPD-AF des personnes | ❌ Absent — critique |

**Sévérité : 🔴 Critical** — 5 gaps critiques pour un produit fintech/regtech destiné à traiter des flux financiers PME en zone UEMOA.

**Recommandation :**

Le PRD démontre une **maîtrise impressionnante** des aspects fiscaux et comptables OHADA — c'est un point fort différenciateur. **En revanche, le volet "sécurité fintech + AML/fraude + statut réglementaire BCEAO" est sous-traité**, ce qui pourrait :
- Retarder le lancement (audit sécurité externe pré-lancement remontera ces gaps)
- Bloquer la croissance (BCEAO peut imposer un agrément si __PROJECT_NAME__ intermédiate des fonds)
- Exposer juridiquement (RGPD-AF + lois locales prévoient des sanctions)

**Actions prioritaires à intégrer au PRD avant Architecture :**

1. **Ajouter § 6.4.x — Statut réglementaire BCEAO** : trancher modèle facilitator vs settlement, documenter conséquences
2. **Ajouter § 6.4.x — KYC/AML framework** : niveau de KYC à l'inscription PME (RIB, NINEA/RCCM vérifiés), monitoring AML basique
3. **Ajouter § 6.3.x — Prévention de fraude** : capabilities anti-fraude paiement, limites par défaut, détection vélocité
4. **Préciser § 6.3 — PCI-DSS scope** : "Aucune donnée carte stockée. SAQ A en s'appuyant sur tokens Stripe/Paystack"
5. **Ajouter § 6.3.x — Chiffrement at-rest** : "Données sensibles (transactions, identités, IBAN) chiffrées at-rest via [stratégie]"
6. **Ajouter § 6.4.x — Rétention légale** : "Conservation 10 ans des documents comptables conformément OHADA"
7. **Ajouter § 6.4.x — Droits des personnes** : accès, rectification, effacement, portabilité (Loi 2008-12 SN art. X, Loi 2013-450 CI)

## Validation de conformité au type de projet

### Classification du type de projet

**Frontmatter PRD :** Absent. Type déduit du contenu.

**Type primaire :** **saas_b2b** (déclaratif fort : "plateforme SaaS modulaire", "B2B", "multi-tenant", "PME", "abonnement mensuel/annuel")

**Type secondaire / hybride :** **web_app** (PWA installable) + dimension **mobile_app** (mobile-first PWA, offline-first, smartphones bas de gamme)

Cette hybridation est **un choix produit assumé** (§ 1.1, § 1.2, § 6.1, § 6.2) — __PROJECT_NAME__ est un SaaS B2B délibérément mobile-first pour le contexte africain, contre la convention "SaaS B2B = desktop-centric".

### Sections requises pour `saas_b2b` (grille BMad)

| Section requise | Couverture PRD | Statut |
|---|---|---|
| **tenant_model** | § 4.1 Tier 0 Tenancy (organisations, memberships multi-org, multi-tenant strict) + § 5.1 (Création org, sélection pays, Switch entre orgs, invitation par email/WhatsApp) | ✅ **Excellent** |
| **rbac_matrix** | § 4.1 Tier 0 RBAC (owner/admin/member/guest) + § 5.2 (4 rôles, permissions `module:resource:action`, rôles custom Pro/Enterprise, audit log) | ✅ **Excellent** |
| **subscription_tiers** | § 1.4 (5 paliers Free/Starter/Business/Pro/Enterprise quantifiés en FCFA) + § 5.3 (Billing complet : upgrade, prorata, essai 14j, retry échoué, renouvellement, multi-PSP) | ✅ **Excellent** |
| **integration_list** | Mentions dispersées : WhatsApp Business, Wave, Stripe, Paystack, Flutterwave, OAuth Google/Microsoft, Twilio Africa, Resend, Sentry, Axiom, PostHog, BullMQ, Cloudflare, Neon | ⚠️ **Présent mais non centralisé** — aucune section "Integrations" dédiée. Listé en § 4.2 Stack technique (qui est de l'archi) plutôt qu'en § 5 |
| **compliance_reqs** | § 6.4 Conformité (SYSCOHADA, OHADA, lois SN/CI, déclarations CDP/ARTCI, e-facturation) | ✅ **Excellent** |

**Score : 4/5 sections excellentes + 1 dispersée = 4.5/5**

### Sections requises pour la dimension `web_app` (PWA)

| Section requise | Couverture PRD | Statut |
|---|---|---|
| **browser_matrix** | Non explicité (PWA Android + iOS mentionné mais pas de versions navigateurs supportées) | ⚠️ Gap mineur |
| **responsive_design** | § 4.2 (shadcn/ui + Tailwind v4 mobile-first design system) + § 6.1 (PWA installable) | ✅ |
| **performance_targets** | § 6.1 (P95 API < 300ms, chargement < 2s sur 3G, bundle < 200KB) | ✅ **Excellent** |
| **seo_strategy** | Non explicité — pour un SaaS B2B avec acquisition partielle via SEO local (§ 10.1 "SEO local : mots-clés facturation Sénégal, logiciel gestion PME Côte d'Ivoire"), une section SEO serait utile | ⚠️ Gap mineur |
| **accessibility_level** | § 6.7 (WCAG 2.1 niveau AA) | ✅ **Excellent** |

**Score : 3/5 sections excellentes + 2 gaps mineurs = 3.5/5**

### Sections requises pour la dimension `mobile_app` (via PWA)

| Section requise | Couverture PRD | Statut |
|---|---|---|
| **platform_reqs** | § 6.1 (PWA installable Android + iOS) — pas de versions minimales OS | ⚠️ Gap mineur |
| **device_permissions** | Non traité — quelles permissions PWA (camera pour QR ?, notifications push ?, géoloc ?) | ⚠️ Gap |
| **offline_mode** | § 6.2 Offline-first dédié — mais sous-spécifié (voir § Mesurabilité) | ⚠️ Partiel |
| **push_strategy** | Mentionné dans § 5.5 ("notifications temps réel : push, email, WhatsApp") mais pas de stratégie push détaillée (web push, OneSignal, FCM ?) | ⚠️ Gap |
| **store_compliance** | N/A (PWA pure, pas de stores Apple/Google) ✓ — déviation justifiée du standard mobile_app |

**Score : 0/5 sections excellentes + 4 gaps = 1/5** (mais justifié partiellement par modèle PWA)

### Sections à exclure (skip_sections pour `saas_b2b`)

| Section à exclure | Présence PRD | Statut |
|---|---|---|
| **cli_interface** | Absent | ✅ Conforme |
| **mobile_first** | **Présent et central** au PRD (§ 1.2 "Mobile-first et offline-first", § 4.2, § 6.1, § 6.2) | ⚠️ **Déviation consciente** |

**Analyse de la déviation `mobile_first`** : la grille BMad indique que les SaaS B2B classiques ne devraient pas être mobile-first (workflow B2B = desktop). **__PROJECT_NAME__ assume cette déviation** car le marché cible (TPE/PME Afrique francophone) utilise majoritairement le smartphone. C'est un **choix produit central, défendu et différenciateur** — pas une erreur de spécification. ✅ À conserver tel quel.

### Innovation signals pour `saas_b2b`

| Signal innovation | Présence PRD | Statut |
|---|---|---|
| **Workflow automation** | § 5.4 (relances auto, conversion devis→facture, réconciliation auto, reçus auto) + § 5.5 (webhooks, matching paiement-facture) | ✅ **Présent** — pilier différenciateur |
| **AI agents (in-product)** | § 1.5 "IA-first" — mais § 8 montre que l'IA est utilisée pour **développer** le produit (Claude Code, Codex, Copilot), pas dans le produit | ❌ Promesse marketing "IA-first" sans implémentation IA in-product. **Incohérence** à clarifier |

### Bilan compliance type de projet

| Volet | Score |
|---|---|
| `saas_b2b` sections requises | 4.5/5 ✅ |
| `web_app` (PWA dim.) sections requises | 3.5/5 ⚠️ |
| `mobile_app` (via PWA) sections requises | 1/5 ❌ |
| Sections à exclure | 1/2 (déviation `mobile_first` assumée) |
| Innovation signals | 1/2 (incohérence marketing IA) |

**Sévérité : ⚠️ Warning** — 7 gaps mineurs/modérés, aucun bloquant.

**Recommandation :**

Le PRD est **exemplaire sur la dimension `saas_b2b` cœur** (tenant model, RBAC, subscription tiers, compliance — c'est la colonne vertébrale d'un PRD SaaS et c'est solide). Les gaps sont sur les dimensions `web_app` et `mobile_app` qui sont **hybrides** dans __PROJECT_NAME__ (PWA).

**Actions recommandées :**

1. **Centraliser une section "Integrations" en § 5** (extraire ce qui est aujourd'hui dispersé dans § 4.2 Stack technique) — liste cleaning : WhatsApp Business, providers paiement, providers identité, providers infrastructure
2. **Ajouter § 6.1.x — Matrice navigateurs supportés** (Chrome SN/CI versions, Safari iOS, Samsung Internet — important pour les usagers Afrique)
3. **Ajouter § 6.1.x — Stratégie SEO** : mots-clés cibles, structure pages publiques, sitemap (pertinent car § 10.1 mentionne SEO comme canal d'acquisition)
4. **Ajouter § 5.x.x — Permissions PWA** : caméra (QR codes § 5.5), notifications push, géoloc si applicable
5. **Détailler § 5.x.x — Stratégie push notifications** : web push API ? FCM ? OneSignal ? Format des notifications par type d'événement
6. **Trancher § 1.5 et § 8 — IA in-product vs IA-build** : la phrase "stack technique moderne (TanStack Start, Cloudflare edge, **IA-first**)" est ambiguë. Soit on intègre vraiment de l'IA dans le produit (catégorisation auto contacts, prédiction churn, OCR factures fournisseurs — fonctionnalité distinctive), soit on retire "IA-first" du positionnement et on clarifie que l'IA est interne au build.

## Validation SMART des Functional Requirements

**Total FRs analysés :** ~75 (sections 5.1 à 5.6, hors roadmap § 5.7)

**Méthode :** notation par section (Specific, Measurable, Attainable, Relevant, Traceable — échelle 1-5) avec focus individuel sur les FRs flaggés (score < 3 dans une catégorie).

### Scoring par section

| Section | FRs | Specific | Measurable | Attainable | Relevant | Traceable | Moyenne | Flagged |
|---|---|---|---|---|---|---|---|---|
| 5.1 Identity et Tenancy | 10 | 5 | 4 | 5 | 5 | 5 | **4.8** | 0 |
| 5.2 RBAC | 4 | 5 | 4 | 5 | 5 | 5 | **4.8** | 0 |
| 5.3 Billing et Subscription | 11 | 4 | 4 | 5 | 5 | 5 | **4.6** | 1 |
| 5.4 Facturation SYSCOHADA | 13 | 5 | 5 | 5 | 5 | 5 | **5.0** | 0 |
| 5.5 Encaissements Mobile Money | 16 | 5 | 4 | 4 | 5 | 5 | **4.6** | 2 |
| 5.6 CRM light | 11 | 5 | 4 | 5 | 5 | 5 | **4.8** | 0 |
| **Global** | **~65** | **4.8** | **4.2** | **4.8** | **5.0** | **5.0** | **4.7** | **3** |

### Détail des FRs flaggés (score < 3 dans une catégorie)

#### FR-Billing-001 : "Gestion des moyens de paiement multiples" (§ 5.3)

| Critère | Score | Justification |
|---|---|---|
| Specific | 3 | Capability claire mais "multiples" non quantifié |
| **Measurable** | **2** | "Multiples" = combien ? Pas de borne, donc pas testable |
| Attainable | 5 | Réalisable |
| Relevant | 4 | Aligné avec besoin de flexibilité PME |
| Traceable | 4 | Aucun parcours utilisateur précis ne démontre le besoin "multiples" |

**Suggestion :** "Un client peut enregistrer jusqu'à 5 moyens de paiement actifs simultanément (cartes, Wave, virement), avec sélection d'un par défaut au paiement"

#### FR-MM-001 : "Notifications temps réel : push, email, WhatsApp à réception" (§ 5.5)

| Critère | Score | Justification |
|---|---|---|
| Specific | 4 | Canaux listés |
| **Measurable** | **2** | "Temps réel" = quel SLA de latence ? |
| Attainable | 4 | Réaliste sous condition de webhooks PSP fiables |
| Relevant | 5 | Critique pour le besoin Aïssatou (rassurance immédiate) |
| Traceable | 5 | § 3.2 Aïssatou "10h05 reçoit notification push" |

**Suggestion :** "Notifications déclenchées dans les 5 secondes après confirmation webhook PSP, sur les 3 canaux (push, email, WhatsApp). Délai mesuré entre `webhook.received_at` et `notification.dispatched_at`."

#### FR-MM-002 : "Tableau de bord encaissements : flux temps réel, totaux journaliers, statistiques" (§ 5.5)

| Critère | Score | Justification |
|---|---|---|
| Specific | 4 | Capabilities listées |
| **Measurable** | **2** | "Temps réel" sans fréquence de rafraîchissement |
| Attainable | 5 | Réalisable |
| Relevant | 5 | Couvre § 3.2 (Aïssatou consulte 8h matin) |
| Traceable | 5 | OK |

**Suggestion :** "Tableau de bord avec rafraîchissement automatique toutes les 10 secondes (polling) OU push instantané via SSE/WebSocket sur événement webhook. Affichage : flux 24h glissantes, totaux jour/semaine/mois, top 5 clients du mois."

### Scores agrégés

| Métrique | Valeur |
|---|---|
| FRs avec tous scores ≥ 3 | **96%** (62/65) |
| FRs avec tous scores ≥ 4 | **89%** (58/65) |
| Score moyen global | **4.7 / 5.0** |
| FRs flagged | **3 / 65 (4.6%)** |

**Sévérité : ✅ Pass** (seuil Critical = >30% flagged, Warning = 10-30%, Pass = <10%)

### Points exemplaires

**§ 5.4 Facturation SYSCOHADA — score parfait 5.0/5 sur tous critères.** Chaque FR est :
- Précis (numérotation continue, mentions obligatoires, multi-devises FCFA/EUR/USD)
- Mesurable (relances J+7/J+15/J+30 quantifiées)
- Réalisable (conformité OHADA documentée)
- Pertinent (cœur de la value-prop)
- Traçable (parcours Aïssatou et Kouassi le démontrent)

**§ 5.1 Identity / Tenancy** et **§ 5.2 RBAC** sont également quasi-parfaits — fondations solides.

**Recommandation :**

La qualité SMART des FRs est **excellente — c'est le point fort majeur du PRD**. Avec 96% des FRs au-dessus du seuil acceptable et 89% au niveau "excellent", **le passage en épics et stories sera fluide**.

**Action minimale** : reformuler les 3 FRs flaggés (15 minutes de travail) avant `bmad-create-epics-and-stories`. Aucun blocage structurel.

## Évaluation holistique de la qualité

### Flow et cohérence du document

**Évaluation : 🟢 Good (4/5)**

**Forces :**
- Progression narrative claire : Pitch (§ 1) → Marché (§ 2) → Personas (§ 3) → Architecture (§ 4) → Specs (§ 5) → NFRs (§ 6) → Roadmap (§ 7) → Modèle (§ 8) → Budget (§ 9) → GTM (§ 10) → Risques (§ 11) → Métriques (§ 12) → Annexes (§ 13). C'est l'un des plans les plus complets pour un PRD draft.
- Cohérence chiffres : MRR, CAC, panier moyen, jalons mois 10/12/14/18/24 alignés entre § 1.4 / § 7.6 / § 9.3 / § 10.3 / § 12.2 — aucune contradiction détectée.
- Personas (§ 3) et parcours (§ 3.2, § 3.3) bien ancrés dans la réalité africaine (montants FCFA crédibles, géographies réelles, métiers cohérents).

**Axes d'amélioration :**
- Mélange PRD + Architecture + Business Plan dans un seul document (28 pages) — typique d'un solo founder, mais § 4 et § 8 alourdissent et seront redondants après BMad-create-architecture
- Ton oscille entre "deck investisseur" (§ 1, § 2 marketing) et "spec technique stricte" (§ 5, § 6) — manque d'unification stylistique
- Pas de glossaire en début (§ 13.2 est en fin, alors qu'il serait utile dès la lecture du § 1 pour les non-initiés UEMOA)

### Efficacité dual audience

**Pour les humains :**

| Audience | Score | Notes |
|---|---|---|
| Exécutifs / investisseurs | 4/5 | Vision claire, marché chiffré, modèle économique défendable. Manque léger : pas de TAM/SAM/SOM explicite (juste "1,8M TPE/PME SN+CI") |
| Développeurs | 4/5 | FRs très exploitables, stack détaillée (§ 4.2). Manque : aucune section "API surface" ou "schémas de données" — l'archi aura à les créer from scratch |
| Designers UX | 3/5 | Parcours (§ 3.2, § 3.3) sont solides comme briefs UX. Mais aucun mockup, wireframe, design system détaillé (juste "shadcn/ui + Tailwind v4"), ni guideline de marque |
| Stakeholders / partenaires | 4/5 | Suffisant pour montrer à un expert-comptable partenaire ou un investisseur. Très convaincant côté conformité OHADA |

**Pour les LLMs :**

| Audience | Score | Notes |
|---|---|---|
| Structure machine-readable | 3/5 | Hiérarchie de sections claire (1.x, 2.x), mais **format PDF** rend l'extraction LLM moins fiable que markdown. Conversion `.md` recommandée |
| Prêt pour UX Design | 3/5 | Parcours sont là, mais besoin de design system + accessibilité concrète + interactions détaillées |
| Prêt pour Architecture | 4/5 | § 4 fournit déjà la moitié du travail archi (stack, paiements, conformité). Avantage et redondance à la fois |
| Prêt pour Epics & Stories | 4/5 | § 5 est très exploitable, ~75 FRs mappables sur ~30-50 stories. La § 5.7 roadmap fournit même un découpage en phases |

**Score dual audience global : 3.7/5** (limité par le format PDF — passage en markdown serait un gain immédiat)

### Conformité aux principes BMAD PRD

| Principe | Statut | Notes |
|---|---|---|
| Information Density | ⚠️ Partial | Excellent dans § 5-7, ton pitch dans § 1, § 2, § 4.1, § 8 → 13 violations dénombrées |
| Measurability | ⚠️ Partial | FRs SMART 4.7/5, mais NFRs avec 11 violations (offline-first sous-spécifié, SLA sans fenêtre, rate limiting sans seuil) |
| Traceability | ✅ Met | 0 FR orphelin, chaîne globalement intacte. 8 gaps fins à boucher (rétention, NPS, churn non démontrés par parcours) |
| Domain Awareness | ⚠️ Partial | Excellent côté SYSCOHADA/lois SN-CI. **Critiques sur statut BCEAO, KYC/AML, fraud prevention, PCI-DSS scoping, chiffrement at-rest** |
| Zero Anti-Patterns | ⚠️ Partial | Adjectifs subjectifs résiduels ("moderne", "classique", "agressif"), 1 buzzword (Blue Ocean) |
| Dual Audience | ⚠️ Partial | Bon pour humains, perfectible LLM — surtout par le format PDF (non extractible programmatiquement) |
| Markdown Format | ❌ Not Met | PDF — pas le format cible BMad. La version `.docx` existe, conversion markdown serait directe |

**Principes pleinement satisfaits : 1/7. Partiellement satisfaits : 5/7. Non satisfaits : 1/7.**

### Note globale de qualité

**Rating : 🟢 4/5 — Good (Solide avec améliorations mineures)**

**Justification :**

Le PRD __PROJECT_NAME__ est **largement au-dessus de la moyenne** des PRD que je rencontre. Il combine :
- Une **maîtrise produit/marché solide** (personas crédibles, marché chiffré, GTM segmenté par taille PME)
- Une **rigueur fonctionnelle exceptionnelle sur § 5** (notamment Facturation SYSCOHADA à 5.0/5)
- Une **maîtrise réglementaire impressionnante** sur OHADA / SYSCOHADA / lois locales
- Une **roadmap réaliste** avec jalons quantifiés, plan B (seuils pivot mois 12/18) et risques mappés
- Une **vision claire** et une **proposition de valeur défendable** (trio intégré inédit, mobile-first, FCFA, IA-augmenté pour le dev)

**Ce qui empêche le 5/5 :**
- Volets fintech sécurité/AML/fraude **sous-traités** pour un produit qui manipule des flux financiers
- Question **statut BCEAO** non tranchée (bloquant juridique potentiel)
- Format **PDF** au lieu de markdown
- Mix PRD + Architecture + Business Plan (à arbitrer)
- 13 violations de densité dans les sections de cadrage

### Top 3 améliorations prioritaires

#### 🥇 #1 — Trancher le statut réglementaire BCEAO et ajouter le volet AML/KYC/fraude

**Impact :** Bloquant juridique potentiel. La commission 1% sur encaissements UEMOA pose une question d'agrément BCEAO non résolue dans le PRD.

**Action :**
- Ajouter § 6.4.x "Statut juridique __PROJECT_NAME__" : trancher modèle **facilitator** (recommandé MVP — pas de détention de fonds) vs **PSP agréé**
- Ajouter § 6.4.x "KYC clients PME" : vérification NINEA/RCCM à l'inscription Pro/Enterprise, validation IBAN si applicable
- Ajouter § 6.3.x "Prévention de fraude" : limites de transaction par défaut, monitoring vélocité, intégration Stripe Radar / Paystack anti-fraud, dispute handling
- Ajouter § 6.3.x "PCI-DSS scope" : "SAQ A — aucune donnée carte stockée, tokens PSP exclusivement"
- Ajouter § 6.3.x "Chiffrement at-rest" : stratégie pour transactions, identités, données KYC

**Effort :** 1-2 jours de recherche réglementaire + consultation juridique légère + rédaction. **ROI majeur** : élimine un risque existentiel.

#### 🥈 #2 — Renforcer § 6.2 Offline-first (différenciateur clé sous-spécifié)

**Impact :** L'offline-first est un pilier de différenciation produit (§ 1.2, § 1.5, marché 3G dégradé), mais § 6.2 est qualitatif. **Sans guidance ferme, l'archi prendra des décisions à 3-6 mois de dette technique près** (LWW vs CRDT, granularité conflicts, taille queue sync).

**Action :**
- Définir stratégie cache (cache-first, network-first, stale-while-revalidate) par type de ressource
- Définir stratégie résolution conflits (LWW sur scalaires, merge 3-way sur listes de lignes facture, escalade utilisateur sur conflits non résolvables)
- Définir SLA sync (envoi différé < 30s après retour réseau, retry exponentiel max 5 tentatives)
- Définir indicateur visuel statut connexion (3 états : online/syncing/offline, badge persistant)

**Effort :** Demi-journée de spec + alignement avec § 4.3 Architecture paiements (cohérence multi-providers + offline).

#### 🥉 #3 — Convertir en markdown et déplacer § 4 Architecture vers `architecture.md`

**Impact :** Aligne le PRD avec le workflow BMad standard, libère 6 pages (§ 4) pour la phase Architecture, améliore l'extraction LLM downstream.

**Action :**
- Convertir `.docx` en `.md` (Pandoc ou export DOCX→MD)
- Ajouter frontmatter YAML : `classification.domain: fintech`, `classification.projectType: saas_b2b`, `inputDocuments: []`
- Déplacer § 4 et § 13.1 dans un futur `architecture-__PROJECT_SLUG__.md` (à créer en phase 3 via `bmad-create-architecture`)
- Conserver dans le PRD uniquement les **contraintes business-driven** : "hébergement avec POPs Afrique", "PSP UEMOA natifs requis"
- Densifier sections de cadrage (§ 1, § 2, § 4.1, § 4.3, § 8) : -25 à -30% de longueur sans perte d'info

**Effort :** 2-3 heures de conversion + restructuration. **Bénéfice immédiat** sur la phase Architecture qui démarrera dans un état propre.

### Synthèse

**Ce PRD est :** un draft v2.0 ambitieux et largement supérieur à la moyenne, qui combine vision produit solide et maîtrise réglementaire OHADA exceptionnelle, mais nécessite de boucher 3 gaps critiques (fintech/AML/BCEAO, offline-first sous-spec, format PDF) avant d'être prêt pour l'architecture BMad.

**Pour le rendre excellent :** se concentrer sur les Top 3 améliorations ci-dessus. **Estimation totale : 3-4 jours de travail produit** pour passer de 4/5 à 5/5 sur les axes BMad.

## Validation de complétude

### Complétude du template

**Variables non substituées détectées :** **0**
Aucun `{placeholder}`, `[XXX]`, `{{variable}}`, TODO ou TBD résiduel dans le PRD. Document propre.

### Complétude du contenu par section

| Section | Statut | Notes |
|---|---|---|
| Executive Summary (§ 1) | ✅ Complet | Vision, value-prop, marché, modèle économique, différenciation — tous traités |
| Contexte et marché (§ 2) | ✅ Complet | Marché PME UEMOA chiffré, focus pays, table concurrentielle, tendances |
| Personas (§ 3) | ✅ Complet | 3 personas (Aïssatou, Kouassi, Fatou) + 2 parcours détaillés |
| Architecture (§ 4) | ✅ Complet (mais hors-scope PRD strict) | Détaillée mais à déplacer en `architecture.md` |
| Spécifications fonctionnelles (§ 5) | ✅ Complet | 6 sous-sections (Identity, RBAC, Billing, Facturation, Encaissements, CRM) + roadmap modules § 5.7 |
| Exigences non fonctionnelles (§ 6) | ⚠️ Complet structurellement, gaps de mesurabilité | 7 sous-sections présentes ; certaines NFRs sous-spécifiées (offline-first, rate limiting, SLA fenêtre) |
| Roadmap (§ 7) | ✅ Complet | 5 phases timeboxées (M1-4 → M19+) + jalons quantifiés § 7.6 |
| Modèle solo founder + IA (§ 8) | ✅ Complet (mais hors-scope PRD strict) | Setup, avantages, risques, plan scale |
| Budget (§ 9) | ✅ Complet (mais hors-scope PRD strict) | Coûts dev + ops + projections |
| Go-to-Market (§ 10) | ✅ Complet | Approche segmentée, plan par pays, métriques CAC |
| Risques (§ 11) | ✅ Complet | 9 risques avec probabilité × impact × mitigation |
| Métriques de succès (§ 12) | ✅ Complet | KPI produit + business + techniques + seuils pivot |
| Annexes (§ 13) | ✅ Complet | Décisions archi, glossaire, docs associés, historique versions |

### Complétude section-spécifique

| Critère | Statut |
|---|---|
| Success Criteria mesurables (§ 7.6 + § 12) | ✅ Tous quantifiés (MRR FCFA/EUR, CAC, churn %, NPS, P95 latence...) |
| User Journeys couvrent tous les personas | ⚠️ Partiel — Aïssatou ✓ et Kouassi ✓ ont des parcours détaillés ; **Fatou (Pro plan, agence digitale Dakar, multi-devise EUR/FCFA) est présentée § 3.1 mais sans parcours dédié** |
| FRs couvrent le scope MVP | ✅ Trio MVP (CRM + Facturation + Encaissements) + foundations (Identity, RBAC, Billing) couvert intégralement |
| NFRs ont des critères spécifiques | ⚠️ ~75% des NFRs sont quantifiés ; 11 violations recensées (cf § Mesurabilité) |
| Domain-specific sections présentes | ⚠️ SYSCOHADA/lois locales ✓ excellents ; AML/KYC/fraude/BCEAO absents |
| Project-type sections présentes | ✅ Tenant, RBAC, subscription tiers, compliance pour saas_b2b ✓ ; PWA gaps mineurs |

### Complétude du frontmatter

**Constat :** Le PRD est en **PDF** — pas de frontmatter YAML possible. Toutes les métadonnées (date, version, auteur, statut) sont en **page de couverture** et **§ 13.4 Historique des versions**.

| Champ frontmatter BMad attendu | Présence | Localisation |
|---|---|---|
| `validationStepsCompleted` | N/A | Non applicable au PRD source (uniquement au validation report) |
| `classification.domain` | ❌ Manquant en frontmatter | Déductible du contenu (fintech) — à expliciter en conversion markdown |
| `classification.projectType` | ❌ Manquant en frontmatter | Déductible du contenu (saas_b2b) — à expliciter |
| `inputDocuments` | ❌ Manquant en frontmatter | Aucun input documenté (pas de brief BMad antécédent) |
| `date` | ✅ Présent | Page de couverture "Mai 2026" + § 13.4 |
| `version` | ✅ Présent | Page de couverture "Version 2.0" + § 13.4 |
| `author` | ✅ Présent | Page de couverture "Auteur : Marius" + § 13.4 |
| `status` | ✅ Présent | Page de couverture "Statut : Draft — Repositionnement Afrique" |

**Score frontmatter :** 4/8 champs présents (50%) — limité par le format PDF.

### Bilan complétude

| Volet | Score |
|---|---|
| Variables non substituées | ✅ 0 / Parfait |
| Sections présentes | ✅ 13/13 / Complet |
| Contenu section-spécifique | ⚠️ 4/6 critères complets (Fatou sans parcours, NFRs partiellement sous-spec, domain fintech AML manquant) |
| Frontmatter exploitable | ⚠️ 4/8 (limite PDF, gain immédiat via conversion markdown) |

**Sévérité : ✅ Pass (avec notes)** — aucun gap critique de complétude structurelle. Les gaps identifiés sont des enrichissements (Fatou journey, NFRs mesurabilité, frontmatter YAML), pas des manques bloquants.

**Recommandation :**

Le PRD est **structurellement complet et utilisable en l'état pour démarrer la phase Architecture** (sous réserve des avertissements critiques sur le volet fintech sécurité/AML traités en § Conformité). Pour passer à 100% de complétude BMad :

1. Ajouter un parcours type pour **Fatou** (déjà esquissée en § 3.1) — couvre le cas multi-devise EUR/FCFA et le segment Pro 35 000 FCFA
2. Compléter les NFRs sous-spécifiées (cf § Mesurabilité — 11 violations listées)
3. Lors de la conversion markdown, ajouter le frontmatter YAML :
   ```yaml
   ---
   classification:
     domain: fintech
     projectType: saas_b2b
   version: 2.0
   date: 2026-05
   author: Marius
   status: draft
   inputDocuments: []
   ---
   ```
