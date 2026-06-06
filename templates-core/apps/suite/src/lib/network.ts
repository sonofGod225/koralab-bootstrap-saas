/**
 * Détection réseau — distingue une panne de connexion d'une vraie erreur serveur.
 *
 * Sans cette distinction, un échec réseau (utilisateur hors-ligne) était capté
 * par les `catch {}` nus des gardes d'accès et interprété comme « non
 * authentifié » ou « onboarding incomplet » → l'utilisateur connecté était
 * éjecté vers `/onboarding` ou `/signin`. On ne redirige plus sur une panne
 * réseau : on affiche un écran hors-ligne avec reprise automatique.
 */
import { TRPCClientError } from '@trpc/client';

/** Vrai si le navigateur se sait hors-ligne (SSR-safe). */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * Distingue une panne réseau (offline / `fetch` échoué) d'une vraie réponse
 * d'erreur du serveur (UNAUTHORIZED, PRECONDITION_FAILED…). Un échec réseau ne
 * doit JAMAIS être lu comme « non authentifié » ou « onboarding incomplet ».
 */
export function isNetworkError(err: unknown): boolean {
  if (isOffline()) return true;
  // TRPCClientError : `data` non nul ⇒ le serveur a répondu (httpStatus/code
  // présents) ⇒ ce n'est pas une panne réseau mais une vraie erreur applicative.
  if (err instanceof TRPCClientError) return err.data == null;
  // `fetch` échoue par un TypeError « Failed to fetch ».
  return err instanceof TypeError;
}
