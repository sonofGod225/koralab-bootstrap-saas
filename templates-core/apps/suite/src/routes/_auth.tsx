/**
 * _auth — segment des écrans d'authentification (Story 3.17).
 *
 * Layout pathless (n'ajoute aucun segment d'URL) regroupant les écrans
 * publics d'authentification. La coquille visuelle split-screen est fournie
 * par le composant `AuthScreen` (contenu marketing propre à chaque écran),
 * pas par ce layout — qui se contente de rendre l'écran courant.
 */
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({ component: () => <Outlet /> });
