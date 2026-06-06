/**
 * `@__SCOPE__/rbac` — registre de permissions RBAC typé (ADR 0011).
 * Source de vérité unique : gate tRPC, matrice UI, seed, validation Zod.
 */
export type { Action, ActionMeta, ModuleManifest, Permission, ResourceDef } from './types';
export {
  ACTION_META,
  ALL_PERMISSIONS,
  PERMISSION_REGISTRY,
  REGISTRY_BY_MODULE,
  aggregate,
  definePermissions,
  identityPermissions,
  auditPermissions,
  examplePermissions,
} from './registry';
export { isValidPermission, matchesPermission } from './match';
export type { PermissionRule } from './access';
export { CORE_MODULES, can, canAccess, isModuleActive, moduleOf } from './access';
