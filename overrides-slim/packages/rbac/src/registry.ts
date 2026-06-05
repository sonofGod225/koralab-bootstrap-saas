/**
 * Registre de permissions RBAC (ADR 0011) — source de vérité unique.
 *
 * Chaque manifeste correspond à un module (domaine cœur ici ; cible : un
 * `packages/module-*` exporte son propre manifeste agrégé via `aggregate`).
 * Les segments `module`/`resource`/`action` sont le contrat partagé backend ↔ UI.
 */
import { examplePermissions } from '@__SCOPE__/module-example/permissions';
import type { Action, ActionMeta, ModuleManifest } from './types';

/** Métadonnées d'affichage des actions (libellés FR + icônes lucide). */
export const ACTION_META: Readonly<Record<Action, ActionMeta>> = {
  read: { label: 'Voir', icon: 'eye' },
  create: { label: 'Créer', icon: 'plus' },
  update: { label: 'Modifier', icon: 'pencil' },
  delete: { label: 'Supprimer', icon: 'trash-2' },
  manage: { label: 'Gérer', icon: 'settings' },
};

/**
 * Helper de déclaration d'un manifeste — point d'extension pour les modules.
 * (Identité de type aujourd'hui ; pourra valider/normaliser plus tard.)
 */
export function definePermissions(manifest: ModuleManifest): ModuleManifest {
  return manifest;
}

/* ─── Manifestes des domaines cœur (non `module-*`) ──────────────────────── */

export const identityPermissions = definePermissions({
  module: 'identity',
  label: 'Identité & accès',
  icon: 'shield-check',
  resources: [
    { id: 'organization', label: 'Organisation' },
    { id: 'role', label: 'Rôle' },
    { id: 'member', label: 'Membre' },
    { id: 'establishment', label: 'Établissement' },
  ],
  actions: ['read', 'create', 'update', 'delete'],
});

export const billingPermissions = definePermissions({
  module: 'billing',
  label: 'Abonnement & facturation',
  icon: 'credit-card',
  resources: [
    { id: 'plan', label: 'Plan' },
    { id: 'subscription', label: 'Abonnement' },
    { id: 'paymentMethod', label: 'Moyen de paiement' },
  ],
  actions: ['read', 'manage'],
});

export const auditPermissions = definePermissions({
  module: 'audit',
  label: "Journal d'audit",
  icon: 'history',
  resources: [{ id: 'log', label: 'Journal' }],
  actions: ['read'],
});

/* Epic 6 — entités centrales (CORE, pas `module-*` — ADR 0013 §8). Référentiels
   partagés consommés par tous les modules ; gating RBAC, jamais `require-module-active`. */

export const contactsPermissions = definePermissions({
  module: 'contacts',
  label: 'Contacts',
  icon: 'users',
  resources: [
    { id: 'contact', label: 'Contact' },
    { id: 'segment', label: 'Segment' },
  ],
  actions: ['read', 'create', 'update', 'delete'],
});

export const cataloguePermissions = definePermissions({
  module: 'catalogue',
  label: 'Catalogue',
  icon: 'package',
  resources: [
    { id: 'product', label: 'Produit / service' },
    { id: 'category', label: 'Catégorie' },
  ],
  actions: ['read', 'create', 'update', 'delete'],
});

/* ─── Manifestes des modules métier ──────────────────────────────────────── */
/* `example` est déclaré par son package (`@__SCOPE__/module-example/permissions`,
   sous-export pur-data) et agrégé ici — concrétisation de la Voie A (ADR 0011).
   Dupliquer ce modèle pour chaque nouveau module produit. */

// Réexport pour les consommateurs du registre (UI, seed) — provenance module.
export { examplePermissions };

export const paymentsPermissions = definePermissions({
  module: 'payments',
  label: 'Encaissements',
  icon: 'coins',
  resources: [
    { id: 'transaction', label: 'Transaction' },
    { id: 'paymentLink', label: 'Lien de paiement' },
  ],
  actions: ['read', 'create', 'update', 'delete'],
});

/** Agrège des manifestes en un registre ordonné (dédoublonne par `module`). */
export function aggregate(manifests: readonly ModuleManifest[]): readonly ModuleManifest[] {
  const byModule = new Map<string, ModuleManifest>();
  for (const m of manifests) byModule.set(m.module, m);
  return Array.from(byModule.values());
}

/**
 * Registre complet, dans l'ordre d'affichage de la matrice UI.
 * Les modules métier d'abord (les plus manipulés), puis identité/billing/audit.
 */
export const PERMISSION_REGISTRY: readonly ModuleManifest[] = aggregate([
  contactsPermissions,
  cataloguePermissions,
  examplePermissions,
  paymentsPermissions,
  identityPermissions,
  billingPermissions,
  auditPermissions,
]);

/** Index module → manifeste (lookup O(1) pour le matching/validation). */
export const REGISTRY_BY_MODULE: ReadonlyMap<string, ModuleManifest> = new Map(
  PERMISSION_REGISTRY.map((m) => [m.module, m]),
);

/** Liste plate de toutes les permissions concrètes `module:resource:action`. */
export const ALL_PERMISSIONS: readonly string[] = PERMISSION_REGISTRY.flatMap((m) =>
  m.resources.flatMap((r) => m.actions.map((a) => `${m.module}:${r.id}:${a}`)),
);
