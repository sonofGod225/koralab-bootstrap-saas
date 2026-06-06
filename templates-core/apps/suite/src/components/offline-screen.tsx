/**
 * <OfflineScreen /> — écran plein affiché quand le chargement échoue faute de
 * réseau. Honnête : hors-ligne, on ne peut pas charger l'espace de travail. Se
 * recharge automatiquement au retour du réseau (event `online`), et propose un
 * bouton « Réessayer » manuel.
 */
import { useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { EmptyState } from '@__SCOPE__/ui/empty-state';
import { Button } from '@__SCOPE__/ui/button';

export function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  useEffect(() => {
    const onOnline = () => onRetry();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [onRetry]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <EmptyState
        illustration={
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <WifiOff className="text-muted-foreground h-8 w-8" strokeWidth={1.25} />
          </div>
        }
        title="Pas de connexion internet"
        description="Impossible de charger votre espace. Vérifiez votre connexion — la page se rechargera automatiquement au retour du réseau."
        action={<Button onClick={onRetry}>Réessayer</Button>}
      />
    </div>
  );
}
