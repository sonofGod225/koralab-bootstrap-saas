/**
 * RBAC permission registry — single source of truth (gate tRPC, UI matrix, seed).
 *
 * Each manifest is a module. Core domains (identity/audit) are declared here;
 * product modules export their own manifest (e.g. @__SCOPE__/module-example/permissions)
 * and are aggregated below (uni-directional dependency: rbac → module-*).
 */
import { examplePermissions } from '@__SCOPE__/module-example/permissions';
import type { Action, ActionMeta, ModuleManifest } from './types';

/** Display metadata for actions (labels + lucide icons). */
export const ACTION_META: Readonly<Record<Action, ActionMeta>> = {
  read: { label: 'Voir', icon: 'eye' },
  create: { label: 'Créer', icon: 'plus' },
  update: { label: 'Modifier', icon: 'pencil' },
  delete: { label: 'Supprimer', icon: 'trash-2' },
  manage: { label: 'Gérer', icon: 'settings' },
};

/** Manifest declaration helper — extension point for modules. */
export function definePermissions(manifest: ModuleManifest): ModuleManifest {
  return manifest;
}

/* ─── Core domain manifests (not `module-*`) ─────────────────────────────── */

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

export const auditPermissions = definePermissions({
  module: 'audit',
  label: "Journal d'audit",
  icon: 'history',
  resources: [{ id: 'log', label: 'Journal' }],
  actions: ['read'],
});

/* ─── Product module manifests ───────────────────────────────────────────── */
// `example` is declared by its package (@__SCOPE__/module-example/permissions,
// pure-data sub-export) and aggregated here — the "Voie A" pattern. Duplicate
// this for each new product module.
export { examplePermissions };

/** Aggregates manifests into an ordered registry (dedupes by `module`). */
export function aggregate(manifests: readonly ModuleManifest[]): readonly ModuleManifest[] {
  const byModule = new Map<string, ModuleManifest>();
  for (const m of manifests) byModule.set(m.module, m);
  return Array.from(byModule.values());
}

/** Full registry, in UI matrix display order (modules first, then core domains). */
export const PERMISSION_REGISTRY: readonly ModuleManifest[] = aggregate([
  examplePermissions,
  identityPermissions,
  auditPermissions,
]);

/** module → manifest index (O(1) lookup for matching/validation). */
export const REGISTRY_BY_MODULE: ReadonlyMap<string, ModuleManifest> = new Map(
  PERMISSION_REGISTRY.map((m) => [m.module, m]),
);

/** Flat list of every concrete `module:resource:action` permission. */
export const ALL_PERMISSIONS: readonly string[] = PERMISSION_REGISTRY.flatMap((m) =>
  m.resources.flatMap((r) => m.actions.map((a) => `${m.module}:${r.id}:${a}`)),
);
