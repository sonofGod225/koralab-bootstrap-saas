/**
 * /onboarding — route orchestratrice (entrée du wizard entreprise).
 *
 * L'organisation n'est plus créée à l'inscription (cf. `packages/auth`). Cette
 * route est le point d'entrée qui matérialise l'organisation puis ouvre le bon
 * Step :
 *
 *  - `?create=1` (bouton « Créer une organisation » du dropdown) : crée
 *    TOUJOURS une nouvelle org brouillon même si l'utilisateur en possède déjà,
 *    la rend active, puis ouvre le Step 1.
 *  - sinon (post-signup) : si l'utilisateur n'a aucune org → en crée une ; s'il
 *    en a une (ex: invité ayant accepté) → la rend active et redirige vers
 *    l'étape courante du wizard (ou `/dashboard` si l'onboarding est terminé).
 *
 * `organization.create` ne touche pas à la session : on appelle
 * `authClient.organization.setActive` ici pour rester cohérent avec le cache KV
 * de Better-Auth (même pattern que `<OrgSwitcher />`).
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { __PROJECT_NAME__Loader } from '../../components/__PROJECT_SLUG__-logo';
import { OfflineScreen } from '../../components/offline-screen';
import { authClient } from '../../lib/auth-client';
import { trpc } from '../../lib/trpc-client';
import { isNetworkError, isOffline } from '../../lib/network';

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingIndex,
  // `create` peut arriver comme booléen, nombre ou chaîne selon le parseur de
  // search params. On ne renvoie la clé QUE lorsqu'elle est vraie : sinon la
  // clé est omise de l'URL (pas de `?create=false` parasite).
  validateSearch: (search: Record<string, unknown>): { create?: true } => {
    const raw = search.create;
    const create = raw === true || raw === 'true' || raw === 1 || raw === '1';
    return create ? { create: true } : {};
  },
});

/** Mappe le `stage` d'onboarding (cf. ONBOARDING_STAGES) vers sa route Suite. */
const STAGE_ROUTE: Record<string, string> = {
  company: '/onboarding/company',
  user_profile: '/onboarding/user',
  consent: '/onboarding/consent',
  completed: '/dashboard',
};

/** Crée une org brouillon, la rend active, et ouvre le Step 1. */
async function createOrgAndStart(): Promise<void> {
  const { organizationId } = await trpc.organization.create.mutate();
  await authClient.organization.setActive({ organizationId });
  window.location.assign('/onboarding/company');
}

function OnboardingIndex() {
  const { create } = Route.useSearch();
  const [offline, setOffline] = useState(false);

  const run = useCallback(async () => {
    setOffline(false);
    try {
      const session = await authClient.getSession();
      if (!session.data) {
        // Hors-ligne, `getSession` peut renvoyer `data: null` faute de réseau —
        // ne pas éjecter vers `/signin` : afficher l'écran hors-ligne.
        if (isOffline()) {
          setOffline(true);
          return;
        }
        window.location.assign('/signin');
        return;
      }

      // Dropdown « Créer une organisation » : on force une nouvelle org.
      if (create) {
        await createOrgAndStart();
        return;
      }

      // Flux post-signup : résolution de l'organisation active.
      let activeId = session.data.session.activeOrganizationId ?? '';
      if (!activeId) {
        const { data: orgs } = await authClient.organization.list();
        const first = orgs?.[0];
        if (first?.id) {
          // L'utilisateur a déjà une org (invité ayant accepté) — on la réactive.
          await authClient.organization.setActive({ organizationId: first.id });
          activeId = first.id;
        } else {
          // Compte neuf sans org : création de l'org brouillon + Step 1.
          await createOrgAndStart();
          return;
        }
      }

      // Org active connue : on rejoint l'étape courante du wizard. Une panne
      // réseau ici ne doit PAS pousser l'utilisateur vers `/onboarding/company`.
      const progress = await trpc.onboarding.get.query();
      if (progress?.completedObligatoryAt) {
        window.location.assign('/dashboard');
        return;
      }
      window.location.assign(STAGE_ROUTE[progress?.stage ?? 'company'] ?? '/onboarding/company');
    } catch (err) {
      if (isNetworkError(err)) {
        setOffline(true);
        return;
      }
      throw err;
    }
  }, [create]);

  useEffect(() => {
    void run();
  }, [run]);

  if (offline) {
    return <OfflineScreen onRetry={() => void run()} />;
  }

  return <__PROJECT_NAME__Loader />;
}
