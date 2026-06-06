/**
 * `useConnectionStatusToast()` — toast non-bloquant d'état réseau (Story 2.10, UX-DR12).
 *
 * Surveille `navigator.onLine` : affiche un toast persistant « Connexion
 * perdue » hors-ligne, puis un toast bref « Connexion rétablie » au retour.
 * Les deux partagent le même `id` → le second remplace le premier.
 *
 * À appeler une fois, dans un composant racine de l'app (sous `<Toaster>`).
 */

import * as React from 'react';
import { toast } from 'sonner';

const TOAST_ID = 'connection-status';

export function useConnectionStatusToast(): void {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      toast.warning('Connexion perdue', {
        id: TOAST_ID,
        description: 'Vos modifications seront synchronisées au retour du réseau.',
        duration: Infinity,
      });
    };

    const handleOnline = () => {
      toast.success('Connexion rétablie', { id: TOAST_ID, duration: 3000 });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}
