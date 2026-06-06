/**
 * Décision d'accès RBAC + entitlement (ADR 0011) — helpers **purs** (aucune DB).
 *
 * Centralise les règles auparavant dupliquées inline dans les middlewares tRPC
 * (`require-permission`, `require-module-active`) et l'UI (`CORE_MODULES`).
 * Réutilisables hors middleware (ex. UI afficher/masquer) — source unique.
 *
 *   can(rules, perm)            → l'utilisateur a-t-il la permission ? (deny gagne)
 *   isModuleActive(enabled, m)  → le module est-il souscrit ? (cœur = toujours)
 *   canAccess({rules,enabled},p)→ entitlement ET autorisation
 */
import { matchesPermission } from './match';

/** Règle de rôle — forme alignée sur `role_permissions` (`effect` vient de la DB). */
export interface PermissionRule {
  readonly effect: string; // 'allow' | 'deny'
  readonly permission: string;
}

/**
 * Modules plateforme cœur — toujours disponibles, indépendants de l'abonnement.
 * Source unique (remplace les redéclarations locales backend/UI).
 */
export const CORE_MODULES: readonly string[] = ['identity', 'audit'];

/** Segment `module` d'une permission `module:resource:action`. */
export function moduleOf(permission: string): string {
  return permission.split(':')[0] ?? '';
}

/**
 * RBAC pur : un jeu de règles `allow`/`deny` autorise-t-il `permission` ?
 * **`deny` l'emporte** — toute règle `deny` qui matche refuse, même si un `allow`
 * matche aussi. Équivaut à l'ancien `denied || !allowed` du middleware (inversé).
 */
export function can(rules: ReadonlyArray<PermissionRule>, permission: string): boolean {
  let allowed = false;
  for (const rule of rules) {
    if (!matchesPermission(rule.permission, permission)) continue;
    if (rule.effect === 'deny') return false; // deny gagne — court-circuit
    if (rule.effect === 'allow') allowed = true;
  }
  return allowed;
}

/**
 * Entitlement pur : le module est-il actif sur l'abonnement de l'organisation ?
 * Les modules cœur (`CORE_MODULES`) sont toujours actifs.
 */
export function isModuleActive(enabledModules: readonly string[], moduleCode: string): boolean {
  return CORE_MODULES.includes(moduleCode) || enabledModules.includes(moduleCode);
}

/**
 * Accès complet : le module de `permission` est actif (entitlement) **ET** les
 * règles l'autorisent (RBAC). C'est la décision que combinent, côté serveur,
 * `requireModuleActive` ∘ `requirePermission`.
 */
export function canAccess(
  context: { rules: ReadonlyArray<PermissionRule>; enabledModules: readonly string[] },
  permission: string,
): boolean {
  return (
    isModuleActive(context.enabledModules, moduleOf(permission)) && can(context.rules, permission)
  );
}
