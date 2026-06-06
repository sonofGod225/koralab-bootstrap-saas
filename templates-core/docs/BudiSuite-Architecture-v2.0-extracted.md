---
classification:
  domain: fintech
  projectType: saas_b2b
title: __PROJECT_NAME__ — Architecture technique extraite du PRD v2.0
sourceDocument: ./__PROJECT_NAME__-PRD-v2.0-Africa.md
status: draft (extrait pré-bmad-create-architecture)
date: 2026-05-13
author: Marius
---

# __PROJECT_NAME__ — Architecture technique (extrait PRD v2.0)

> **Note BMad** : ce document contient les éléments architecturaux qui étaient initialement embarqués dans le PRD v2.0 (sections § 4 et § 13.1). Il sert de **point de départ** pour la phase 3 BMad (`bmad-create-architecture`). À ce stade, ces éléments ne sont pas encore validés comme décisions architecturales finales — ils représentent l'intention de l'auteur du PRD au moment de la rédaction (Mai 2026), avant l'arbitrage architectural BMad.
>
> Voir aussi les TODO Lot 1 du PRD (statut BCEAO, KYC, offline strategy) qui impactent directement plusieurs décisions ci-dessous.

---

## 1. Hiérarchie des composants (intention)

Architecture 4 tiers adaptée au contexte africain.

### Tier 0 — Fondations système (non négociables)

- **Identity** : authentification, gestion des utilisateurs, sessions, MFA, OAuth Google et Microsoft
- **Tenancy** : organisations, memberships multi-organisations, contexte multi-tenant strict
- **RBAC** : rôles owner/admin/member/guest, permissions granulaires par module
- **Billing** : Stripe pour cartes internationales, Paystack pour cartes locales, Wave API pour mobile money

### Tier 1 — Services partagés (toujours actifs)

- **Notifications multi-canal** : email (Resend), WhatsApp Business API, SMS (Twilio Africa)
- **Files** : stockage objet avec POPs Afrique (Cloudflare R2), upload optimisé pour faibles débits
- **Audit logs** immuables pour traçabilité et conformité
- **Jobs queue** : BullMQ sur Redis Upstash, retry agressif adapté aux connexions instables
- **Events bus** : pub/sub typé pour communication inter-modules
- **Payment abstraction** : interface unifiée Wave, Orange Money, Free Money, Paystack, Flutterwave, Stripe
- **Multi-currency engine** : FCFA, EUR, USD, conversions et arrondis OHADA
- **i18n** : français de France et français d'Afrique, anglais
- **WhatsApp Business** : envoi templates et messages depuis tous les modules

### Tier 2 — Entités centrales (toujours actives, dans le core)

- **Contacts central** : carnet unifié personnes et entreprises, partagé entre tous les modules
- **Catalogue produits** : produits et services unifiés, conformes aux exigences fiscales locales

### Tier 3 — Modules métier

#### MVP (trio fondamental)
- CRM light : pipelines kanban, contacts, opportunités, relances simples
- Facturation SYSCOHADA : devis, factures normalisées, conformité OHADA Sénégal et Côte d'Ivoire
- Encaissements Mobile Money : Wave, Orange Money, Free Money, cartes via Paystack, réconciliation auto

#### Modules ajoutés en Phase 2 et 3
- Comptabilité SYSCOHADA : génération automatique des écritures, balance, journaux, états financiers
- Inventaire et stocks : multi-entrepôts, mouvements, valorisation FIFO/CMP
- Ressources humaines : employés, congés, paie selon législation locale
- Helpdesk et SAV : tickets, base de connaissances

---

## 2. Stack technique (intention)

> ⚠️ Tous ces choix sont à valider/challenger en phase `bmad-create-architecture`. Les éléments marqués (*) impactent les TODO Lot 1.

| Couche | Technologie envisagée |
|---|---|
| Frontend Framework | TanStack Start v1 avec Vite, type-safe routing, PWA installable |
| Offline-first (*) | Service Worker, IndexedDB, sync différée, fonctionnement 3G dégradé |
| State / Cache | TanStack Query intégré nativement |
| API | tRPC pour l'API modulaire, Server Functions pour actions simples |
| Base de données | PostgreSQL hébergé sur Neon EU avec read replicas, ou AWS Cape Town selon performance mesurée |
| ORM | Drizzle ORM, multi-schéma (un schéma par module) |
| Authentification | Better-Auth, multi-org natif, MFA TOTP, OAuth Google/Microsoft |
| Jobs & events | BullMQ sur Redis Upstash global |
| Hébergement frontend | Cloudflare Pages avec POPs Lagos, Nairobi, Cape Town, Casablanca, Johannesburg |
| Hébergement backend | Cloudflare Workers ou Vercel Edge selon évaluation latence |
| Storage fichiers | Cloudflare R2 (compatible S3, POPs Afrique inclus) |
| Paiements Mobile Money | Wave API directe (Sénégal + CI), Flutterwave et Paystack pour autres MM |
| Paiements cartes | Paystack (cartes locales), Stripe (cartes internationales) |
| UI Kit | shadcn/ui + Tailwind v4, design system mobile-first |
| Email transactionnel | Resend avec domaine custom, DKIM/SPF/DMARC |
| WhatsApp Business | Meta WhatsApp Business API directe ou Twilio WhatsApp |
| SMS | Twilio Africa ou Africa's Talking selon couverture |
| Observabilité | Sentry, Axiom, PostHog (free tier généreux) |
| Outils de dev | Claude Code (architecte + reviewer), Codex (implémentation), GitHub Copilot (quotidien) |

---

## 3. Architecture paiements multi-providers (intention)

La couche paiements est le composant technique le plus critique de __PROJECT_NAME__. Elle gère deux flux distincts.

### Flux 1 : Subscription billing (__PROJECT_NAME__ encaisse ses propres clients PME)

- TPE et indépendants : Wave Direct Pay pour SN+CI (commissions minimes)
- PME mid-market : Paystack pour cartes locales (Wave Card, Orange Bank, Free Money Card)
- Comptes export : Stripe pour cartes internationales (clients ayant des activités UE/US)
- Abonnement annuel : virement bancaire avec validation manuelle

### Flux 2 : Encaissements clients (les PME utilisatrices encaissent leurs propres clients)

**Modèle MVP : Facilitator pur** (décision Lot 1 #1.1, 2026-05-13). __PROJECT_NAME__ n'a aucun rôle de dépositaire de fonds. Le PSP reçoit le paiement du client final et reverse directement au PME.

- Génération de liens de paiement multi-méthodes (le client final choisit son moyen)
- Wave Business API pour les transferts directs Wave → reversement direct compte Wave du PME
- Flutterwave et Paystack comme PSP agrégateurs → reversement direct au PME
- Webhooks de réconciliation automatique vers les factures émises (mise à jour statut, sans transit financier)
- **Aucune commission MVP** — voir § 5 Décisions architecturales tranchées et PRD § 4.3.

### Impact architectural de la décision Facilitator

- ❌ **Pas de wallet interne __PROJECT_NAME__** — pas besoin de tables `internal_balances`, `escrow`, `payouts`. Économie de complexité majeure.
- ❌ **Pas de système de réconciliation des fonds détenus** — on enregistre seulement les événements paiement-facture, pas les flux monétaires internes.
- ✅ **Modèle webhook-driven pur** — réception événement PSP → mise à jour facture → notification. Architecture stateless côté paiements.
- ⚠️ **Préparer la table `commission_log` (désactivée MVP)** — pour quand on réintroduira la commission V1.5+, on aura déjà l'historique des montants encaissés transitant par __PROJECT_NAME__ (sans les avoir détenus).

### Architecture technique (esquisse TypeScript)

```typescript
// packages/core/payments/src/types.ts
type PaymentMethod =
  | { type: 'wave', country: 'SN' | 'CI' }
  | { type: 'orange_money', country: 'SN' | 'CI' | 'CM' }
  | { type: 'free_money', country: 'SN' }
  | { type: 'card_local', provider: 'paystack' }
  | { type: 'card_intl', provider: 'stripe' }
  | { type: 'bank_transfer', country: 'SN' | 'CI' };

interface PaymentProvider {
  initiate(amount: Money, method: PaymentMethod): Promise<PaymentSession>;
  verify(sessionId: string): Promise<PaymentStatus>;
  refund(transactionId: string): Promise<RefundResult>;
}
```

---

## 4. Conformité SYSCOHADA et facturation normalisée (technique)

Implémentation technique des exigences réglementaires OHADA :

- Plan comptable SYSCOHADA Révisé applicable depuis 2018 (schéma DB dédié au module Comptabilité Phase 2)
- Mentions obligatoires sur factures : NINEA Sénégal, numéro RCCM, régime fiscal (champs requis sur entité `Organization` + rendu PDF)
- Numérotation des factures conforme : numérotation séquentielle continue, sans saut ni rupture (séquence ACID en BDD avec verrouillage)
- TVA Sénégal : taux normal 18%, exonérations spécifiques (produits de première nécessité)
- TVA Côte d'Ivoire : taux normal 18%, taux réduit 9%, exonérations
- Facture normalisée DGI Sénégal : intégration du timbre fiscal électronique (en préparation, dépend du calendrier DGI)
- E-facturation Côte d'Ivoire : intégration progressive selon échéances DGI CI (PDP éventuelle)
- Export comptable au format SYSCOHADA pour transmission aux experts-comptables (FEC standard)

> Note conformité : les exigences fonctionnelles correspondantes restent dans le PRD § 5.4 et § 6.4. Cette section ne décrit que les implications techniques d'implémentation.

---

## 5. Décisions architecturales clés (à valider phase 3 BMad)

| Décision | Choix actuel | À valider |
|---|---|---|
| Framework frontend | TanStack Start v1 | Type-safe routing, mobile-first, performance Vite |
| Base de données | Neon Postgres EU avec multi-schéma | À challenger avec AWS Cape Town selon mesures latence Dakar/Abidjan |
| Jobs queue | BullMQ sur Redis Upstash | Acceptable pour MVP, à challenger si volume > 100k jobs/jour |
| Events bus | EventBus maison sur BullMQ | Simplicité MVP, à reconsidérer phase 3 si besoin pub/sub typé strict |
| Auth | Better-Auth pour multi-org natif | Confirmer support OAuth Google/Microsoft + OTP SMS |
| Paiements | Wave API directe + Paystack + Flutterwave + Stripe avec abstraction unifiée | Confirmer SLA Wave API, fallback strategy |
| Hébergement | Cloudflare Pages + Workers pour POPs Afrique | Mesurer latence réelle Dakar/Abidjan vs Vercel Edge / AWS Cape Town |
| **Offline strategy** | **✅ Merge 3-way listes + LWW scalaires (décision 1.3 — 2026-05-13)** | **Acté. Voir § 7 Sync engine pour détails d'implémentation.** |
| **Statut juridique paiements** | **✅ Facilitator pur (décision 1.1 — 2026-05-13)** | **Acté. Pas d'agrément BCEAO MVP. Réexamen V1.5+ si commission réintroduite.** |
| Chiffrement at-rest | Chiffrement applicatif au niveau colonne | À valider selon obligations CDP SN / ARTCI CI |
| Isolation tenant | Triple couche (middleware, ORM, RLS PostgreSQL) | Confirmer overhead RLS sur Neon |

---

## 6. Évolution KYC — schéma swappable (décision Lot 1 #1.2)

**Niveau MVP : auto-déclaratif léger.** Pas de validation à l'inscription.

**Tables créées dès le MVP** (désactivées en mode auto-déclaratif, prêtes pour activation V1.5+) :

```typescript
// packages/core/kyc/schema.ts (intention)

table pme_kyc_status {
  id: uuid
  organization_id: uuid (FK)
  level: 'declarative' | 'verified' | 'enhanced'  // MVP = 'declarative' par défaut
  status: 'pending' | 'approved' | 'flagged' | 'rejected' | 'suspended'
  declared_ninea: string?  // SN
  declared_rccm: string?   // CI
  declared_sector: enum (liste contrôlée)
  verified_at: timestamp?
  verified_by: 'auto-api' | 'manual-founder' | null
  next_review_due: timestamp?
}

table pme_kyc_events {
  id: uuid
  organization_id: uuid (FK)
  event_type: 'inscription' | 'upgrade' | 'trigger_review' |
              'manual_review' | 'document_upload' |
              'psp_audit_request' | 'sector_flag' | 'dispute'
  trigger_reason: string  // ex: "encaissements_cumul_10M_FCFA"
  payload: jsonb
  occurred_at: timestamp
  resolved_at: timestamp?
}

table pme_kyc_documents (V1.5+, table vide MVP) {
  id: uuid
  organization_id: uuid (FK)
  document_type: 'rccm_extract' | 'ninea_certificate' |
                 'bank_statement' | 'id_doc' | 'face_match'
  storage_url: string  // Cloudflare R2
  ocr_data: jsonb?
  verification_provider: 'manual' | 'smile_identity' | 'veriff' | 'idnow'
  verification_status: 'pending' | 'passed' | 'failed'
  expires_at: timestamp?
}
```

**Triggers automatiques (MVP)** :
- Cron horaire qui calcule encaissements cumulés du mois courant par organisation → si > 10M FCFA, INSERT into `pme_kyc_events(event_type='trigger_review', trigger_reason='encaissements_cumul_10M_FCFA')` et flag dans `pme_kyc_status.status = 'flagged'`
- Webhook chargeback/dispute (Stripe/Paystack) → INSERT into `pme_kyc_events(event_type='dispute')` et flag
- Inscription avec secteur sensible (liste contrôlée) → flag dès création

**Plan de bascule V1.5+ vers KYC API tierce** :
- Phase 1 (M14-M15) : intégration Smile Identity ou Veriff via webhook + UI upload documents (5-8 jours)
- Phase 2 (M15-M16) : backfill KYC sur PME existantes (envoi email "merci de compléter votre KYC sous 30 jours") via `pme_kyc_events(event_type='manual_review')`
- Phase 3 (M16+) : KYC API obligatoire à l'inscription Pro/Enterprise, conservé auto-déclaratif Free/Starter

---

## 7. Sync engine offline-first — architecture (décision Lot 1 #1.3)

**Stratégie actée** : Merge 3-way sur listes + LWW sur champs scalaires. Pas de CRDT (réévaluation V2).

### 7.1 Modèle de données sync

```typescript
// packages/core/sync/schema.ts (intention)

// Versioning des entités synchronisables
table entity_versions {
  id: uuid
  entity_type: 'invoice' | 'quote' | 'contact' | 'opportunity' | 'product' | ...
  entity_id: uuid
  version_number: bigint  // strictement croissant par entité (server-assigned)
  base_version_number: bigint  // pour 3-way merge
  modified_by_device_id: string
  modified_by_user_id: uuid
  client_timestamp: timestamp  // utilisé pour LWW
  server_timestamp: timestamp  // toujours fiable, source de vérité
  payload: jsonb  // état complet de l'entité après modification
  diff_from_base: jsonb  // diff calculé (jsondiffpatch)
  is_conflict_resolution: boolean
  conflict_resolution_strategy: 'auto-lww' | 'auto-merge' | 'manual'?
}

// File d'attente client (IndexedDB)
table sync_queue_client {
  id: uuid
  entity_type: string
  entity_id: uuid
  operation: 'create' | 'update' | 'delete'
  base_version_number: bigint?
  client_timestamp: timestamp
  payload: jsonb
  retry_count: int  // max 5
  status: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed'
}

// Log des conflits (audit + UX historique)
table conflict_log {
  id: uuid
  organization_id: uuid (FK)
  entity_type: string
  entity_id: uuid
  conflict_type: 'concurrent_modify' | 'delete_modify' | 'locked_status' | 'manual_escalation'
  client_version_id: uuid (FK entity_versions)
  server_version_id: uuid (FK entity_versions)
  resolved_version_id: uuid (FK entity_versions)
  resolution: 'auto-lww' | 'auto-merge' | 'manual-client' | 'manual-server' | 'manual-combine'
  resolved_by_user_id: uuid?
  resolved_at: timestamp
  diff_visual: jsonb  // snapshot pour relecture historique 30 jours
}
```

### 7.2 Flux de synchronisation

1. **Online** : chaque modification est immédiatement envoyée au serveur, qui retourne `version_number` incrémenté.
2. **Offline détecté** : Service Worker met les mutations en file dans `sync_queue_client` (IndexedDB).
3. **Retour réseau** : worker reprend la file, envoie batch de mutations au serveur (endpoint `/sync/push`).
4. **Server reception** :
   - Pour chaque mutation, vérifier `base_version_number` vs `current_version_number` côté serveur
   - Si égaux : application directe (pas de conflit)
   - Si différents : invoquer le merge engine
5. **Merge engine** :
   - Champs scalaires : LWW sur `client_timestamp` vs `server_timestamp`
   - Listes : appel `jsondiffpatch.patch(base, [client_diff, server_diff])` avec stratégie ID-stable
   - Si conflit non résolvable détecté : retour HTTP 409 avec payload de conflit
6. **Client conflict handling** :
   - 409 reçu → ouvre dialog conflit dans UI
   - Utilisateur choisit (3 actions) → nouvelle mutation envoyée avec flag `is_conflict_resolution=true`

### 7.3 Endpoints

| Endpoint | Méthode | Description |
|---|---|---|
| `/sync/pull` | POST | Client demande les changements depuis `last_synced_at`. Retourne diffs cumulés. |
| `/sync/push` | POST | Client envoie batch de mutations. Retourne 200 (OK), 207 (Multi-Status si certains en conflit), 409 (tout en conflit). |
| `/sync/resolve` | POST | Résolution manuelle d'un conflit. Payload : `conflict_id` + `chosen_resolution` + `merged_payload?`. |
| `/sync/health` | GET | Vérif disponibilité du sync engine côté client (Service Worker). |

### 7.4 Verrouillage des statuts terminaux

Les entités avec statuts terminaux ne sont **plus modifiables offline** dès que ce statut est atteint :

| Entité | Statuts verrouillés |
|---|---|
| Facture | `issued`, `paid`, `cancelled` |
| Paiement | `confirmed`, `refunded` |
| Devis | `accepted` (devient facture), `rejected` |
| Écriture comptable (Phase 2) | `validated` |

**Implémentation** : champ `is_locked: boolean` calculé serveur + check côté client avant ajout en `sync_queue_client`. Mutation sur entité verrouillée → erreur immédiate UI.

### 7.5 Considération réglementaire OHADA

Les modifications sur factures doivent être **traçables** (audit OHADA). Le log `conflict_log` est conservé **10 ans** au même titre que la facture elle-même. Toute résolution de conflit sur une facture est horodatée, attribuée à un utilisateur, et l'historique des versions est consultable dans l'audit log.

### 7.6 Estimation effort

- **MVP (M5-M9 selon roadmap)** : ~7-10 jours dev pour merge engine + UI conflits + queue Service Worker
- **Tests** : couverture > 80% obligatoire sur le sync engine (impact data integrity)
- **Monitoring** : métriques Sentry sur taux de conflits, taux de résolution auto vs manuelle, latence sync

---

## 8. Services IA in-product (décision Lot 1 #1.4)

**Périmètre MVP** : 2 features IA in-product (OCR factures fournisseurs + Assistant rédaction relances). Cf. PRD § 5.8.

### 8.1 Architecture multi-provider

```typescript
// packages/core/ai/provider.ts (intention)

interface AIProvider {
  vision(image: Buffer, prompt: string): Promise<VisionResult>
  text(messages: Message[], options: TextOptions): Promise<TextResult>
  isHealthy(): Promise<boolean>
}

// Implémentations
class AnthropicProvider implements AIProvider { ... }  // défaut MVP
class OpenAIProvider implements AIProvider { ... }     // fallback automatique

// Sélection runtime
const aiProvider = new ProviderSelector({
  primary: 'anthropic',
  fallback: 'openai',
  healthCheckIntervalMs: 30_000,
  fallbackAfterFailuresN: 3,
})
```

**Stratégie de routage** :
- Par défaut : Anthropic (Claude Sonnet vision + Claude Haiku text)
- Si 3 échecs consécutifs en < 30s ou latence > 10s : bascule auto vers OpenAI (GPT-4o-mini vision + GPT-4o-mini text)
- Retour automatique vers Anthropic après health check OK 60s
- Aucun changement requis dans le code applicatif (interface `AIProvider` unifiée)

### 8.2 Tables BDD

```typescript
table ai_request_log {
  id: uuid
  organization_id: uuid (FK)
  user_id: uuid (FK)
  feature: 'ocr_supplier_invoice' | 'reminder_draft' | 'future_features...'
  provider: 'anthropic' | 'openai'
  model: string  // ex: 'claude-sonnet-4-7-vision', 'gpt-4o-mini'
  input_tokens: int
  output_tokens: int
  estimated_cost_eur: decimal(10, 6)
  latency_ms: int
  status: 'success' | 'failure' | 'fallback_used'
  occurred_at: timestamp
  // metadata
  entity_type: string?  // 'supplier_invoice' | 'invoice'
  entity_id: uuid?
}

// Quotas par plan (matérialisation à l'usage, sinon configuration)
table ai_feature_quotas {
  plan: 'free' | 'starter' | 'business' | 'pro' | 'enterprise'
  feature: string
  monthly_limit: int  // -1 = illimité
  // ex: free + ocr_supplier_invoice = 50
  //     starter + ocr_supplier_invoice = 200
  //     business+ = -1 (illimité)
}
```

### 8.3 Privacy et data processing

- **Anthropic** : usage standard de la plateforme API (zero data retention par défaut, opt-in explicite pour amélioration modèle — désactivé)
- **OpenAI** : API Platform (zero data retention, pas d'usage pour entraînement par défaut)
- **Engagement contractuel** à signer avec les deux providers en phase Architecture
- **Données sensibles** envoyées : photos de factures fournisseurs (peuvent contenir RIB, mentions confidentielles), contextes clients (nom, montant, historique). Chiffrement TLS 1.3 en transit. Pas de stockage hors fournisseur API.
- **Conformité Loi 2008-12 SN / 2013-450 CI** : information utilisateur dans les CGU sur l'usage d'IA tierce et la nature des données transmises.

### 8.4 Coûts opérationnels (modélisation)

| Volume mensuel | OCR (Sonnet vision) | Relances (Haiku) | Total |
|---|---|---|---|
| 50 clients × 10 OCR + 20 relances | ~12,5 € | ~5 € | **~17,5 €** |
| 150 clients × 15 OCR + 30 relances | ~56 € | ~22 € | **~78 €** |
| 500 clients × 20 OCR + 50 relances | ~250 € | ~125 € | **~375 €** |

Hypothèses : OCR à 0,025 €/photo (Sonnet vision moyenne), relance à 0,008 €/génération (Haiku).

**Margin protection** : à 500 clients (M24 cible), 375 €/mois de coût API = 0,75 €/client/mois, négligeable face au panier moyen 33 €/client/mois (22 000 FCFA).

### 8.5 Fallback dégradé

Si **les deux providers** sont indisponibles (cas extrême) :
- OCR factures fournisseurs : badge UI "Saisie manuelle requise temporairement", formulaire de saisie classique reste accessible
- Assistant relances : bouton "Générer message IA" devient "IA temporairement indisponible — écrire manuellement", template texte par défaut proposé
- Aucune perte de fonctionnalité critique — l'IA est un **accelerator**, pas un **bloquant**

### 8.6 Monitoring

- Métriques Sentry / Axiom : taux de succès par feature, latence P95, coût cumulé par jour
- Alerte automatique si coût mensuel dépasse 2× projection (early warning)
- Dashboard PostHog : taux d'adoption par feature, taux de validation utilisateur post-OCR (pour mesurer la précision réelle)

---

## 9. Risque architectural majeur (rappel PRD § 8.3)

**Solo founder = Single Point of Failure** — non architectural au sens strict, mais conditionne toute la stratégie technique :

- Documentation exhaustive obligatoire (chaque ADR formalisée)
- Code auto-documenté, conventions strictes
- Couverture tests > 70% sur core modules paiements + facturation
- Backups Github privés quotidiens + sauvegarde DB hors région
- Contrats prestation freelance pré-signés (3 prestataires identifiés mois 8)

---

## Notes de migration BMad

Ce document a été extrait du PRD v2.0 le 2026-05-13 dans le cadre du Lot 3 du plan de validation BMad. Il deviendra la base d'entrée pour `bmad-create-architecture` (Phase 3 BMad — Solutioning) après traitement du Lot 1 (décisions produit en attente).

**À faire avant `bmad-create-architecture`** :
1. Trancher les TODO Lot 1 du PRD (BCEAO, KYC, offline, IA in-product, Fatou)
2. Compléter ce document avec les décisions architecturales finales
3. Ajouter ADR (Architecture Decision Records) pour chaque décision majeure

**Fin du document.**
