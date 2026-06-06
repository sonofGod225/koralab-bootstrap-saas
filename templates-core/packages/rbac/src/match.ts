/**
 * Matching et validation de permissions (ADR 0011).
 *
 * `matchesPermission` était dupliqué dans `require-permission.ts` (backend) et
 * `permission-matrix.tsx` (UI). Source unique désormais.
 */
import type { Action } from './types';
import { REGISTRY_BY_MODULE } from './registry';

/**
 * Teste un motif (`*` joker de segment) contre une permission concrète.
 * Ex. `billing:*` autorise `billing:plan:read` ; `*:*:read` autorise tout `read`.
 */
export function matchesPermission(pattern: string, permission: string): boolean {
  if (pattern === '*') return true;
  const pat = pattern.split(':');
  const perm = permission.split(':');
  for (let i = 0; i < 3; i++) {
    const seg = pat[i] ?? '*';
    if (seg === '*') continue;
    if (seg !== perm[i]) return false;
  }
  return true;
}

/**
 * Valide qu'une permission saisie (règle de rôle custom) est cohérente avec le
 * registre. Accepte les jokers `*` par segment ; rejette un module/resource/action
 * inconnu. Utilisé par la validation Zod du router `rbac`.
 */
export function isValidPermission(permission: string): boolean {
  const parts = permission.split(':');
  if (parts.length !== 3) return false;
  const [moduleSeg, resourceSeg, actionSeg] = parts;
  if (!moduleSeg || !resourceSeg || !actionSeg) return false;
  // Joker module → motif large (rôles prédéfinis : `*`, `*:*:read`…).
  if (moduleSeg === '*') return true;
  const manifest = REGISTRY_BY_MODULE.get(moduleSeg);
  if (!manifest) return false;
  if (actionSeg !== '*' && !manifest.actions.includes(actionSeg as Action)) return false;
  if (resourceSeg !== '*' && !manifest.resources.some((r) => r.id === resourceSeg)) return false;
  return true;
}
