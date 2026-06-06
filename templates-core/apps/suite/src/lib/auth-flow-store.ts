/**
 * État transitoire des flows d'authentification (signup → verify-email).
 *
 * Persisté en sessionStorage : survit au refresh dans le même onglet, nettoyé
 * automatiquement à la fermeture. Évite de faire transiter de la PII (email)
 * dans l'URL (historique, referer, logs HTTP).
 *
 * SSR (TanStack Start) : `skipHydration: true` + storage no-op côté serveur.
 * Le consommateur doit appeler `useAuthFlowStore.persist.rehydrate()` une fois
 * côté client (cf. `verify-email.tsx`).
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthFlowState {
  /** Email en attente de vérification OTP, posé par `/signup`, lu par `/verify-email`. */
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string) => void;
  clearPendingVerificationEmail: () => void;
}

/** Storage no-op côté serveur — évite ReferenceError sur `sessionStorage`. */
const noopStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

export const useAuthFlowStore = create<AuthFlowState>()(
  persist(
    (set) => ({
      pendingVerificationEmail: null,
      setPendingVerificationEmail: (email) => set({ pendingVerificationEmail: email }),
      clearPendingVerificationEmail: () => set({ pendingVerificationEmail: null }),
    }),
    {
      name: 'budi-auth-flow',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : sessionStorage,
      ),
      skipHydration: true,
    },
  ),
);
