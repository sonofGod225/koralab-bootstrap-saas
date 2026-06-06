/**
 * QueryClient unique de l'app (React Query). Sert de cache partagé pour les requêtes
 * tRPC consommées via `useQuery` (cf. `lib/queries.ts`) — évite un refetch à chaque
 * navigation et dédoublonne les appels partagés (ex. `establishments.listMine`).
 *
 * Les pages authentifiées (Epic 6) ne montent que côté client (le shell `_app` rend un
 * loader tant que la session n'est pas résolue), donc aucune requête ne part au SSR.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
