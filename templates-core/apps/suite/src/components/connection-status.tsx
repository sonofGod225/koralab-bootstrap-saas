/**
 * <ConnectionStatus /> — branche le toast d'état réseau (Story 2.10) au root.
 *
 * Ne rend rien : monte juste `useConnectionStatusToast()` sous le `<Toaster>`
 * pour signaler de façon non-bloquante les pertes/retours de connexion pendant
 * l'usage de l'app (app déjà chargée). Le cas « chargement à froid hors-ligne »
 * est géré séparément par <OfflineScreen />.
 */
import { useConnectionStatusToast } from '@__SCOPE__/ui/use-connection-status-toast';

export function ConnectionStatus() {
  useConnectionStatusToast();
  return null;
}
