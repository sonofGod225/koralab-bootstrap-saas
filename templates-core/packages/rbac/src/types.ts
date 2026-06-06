/**
 * Types RBAC — modèle `module:resource:action` (ADR 0011).
 *
 * Le registre est la **source de vérité unique** : gate tRPC (`requirePermission`),
 * matrice UI (`apps/suite`), seed des rôles prédéfinis et validation Zod du router
 * `rbac` en dérivent tous. Namespace **EN canonique** aligné sur le catalogue
 * modules (Epic 26) et les packages `module-*`.
 */

/** Verbes d'action supportés. Tous les modules n'exposent pas le même jeu. */
export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage';

/** Une sous-entité (feature) d'un module — segment `resource` de la permission. */
export interface ResourceDef {
  /** Code technique (segment `resource`). */
  readonly id: string;
  /** Libellé affiché (FR par défaut ; i18n côté UI). */
  readonly label: string;
}

/**
 * Manifeste de permissions d'un module. Déclaré par domaine cœur dans ce package
 * ou (cible) par chaque `packages/module-*` puis agrégé via `aggregate(...)`.
 */
export interface ModuleManifest {
  /** Code canonique EN du module (segment `module`). */
  readonly module: string;
  /** Libellé affiché. */
  readonly label: string;
  /** Nom d'icône lucide (résolu côté UI). */
  readonly icon: string;
  /** Sous-entités gérables. */
  readonly resources: readonly ResourceDef[];
  /** Jeu d'actions exposé par ce module. */
  readonly actions: readonly Action[];
}

/** Permission concrète ou motif — `module:resource:action`, `*` = joker de segment. */
export type Permission = `${string}:${string}:${string}`;

/** Métadonnée d'affichage d'une action (libellé + icône lucide). */
export interface ActionMeta {
  readonly label: string;
  readonly icon: string;
}
