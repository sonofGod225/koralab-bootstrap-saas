/**
 * Garde contre les open-redirect : n'accepte qu'un chemin interne (ouvre par
 * `/` et pas `//`, donc pas d'URL absolue ni de schéma). Utilisé sur les
 * écrans auth pour suivre un `?redirect=` après connexion / inscription /
 * vérification (Story 3.9 — `/invite/accept`).
 */
export function safeRedirect(target: string | undefined, fallback: string): string {
  if (target && target.startsWith('/') && !target.startsWith('//')) return target;
  return fallback;
}
