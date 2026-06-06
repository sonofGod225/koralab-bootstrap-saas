/**
 * /select-organization — bascule d'organisation active (Story 3.16).
 *
 * Branche le composant `<OrgSwitcher>` (`@__SCOPE__/ui`, design Epic 2) sur le
 * plugin `organization` de Better-Auth : liste des organisations de
 * l'utilisateur, sélection → `setActive` → rechargement du tableau de bord.
 *
 * Garde d'accès minimale : si `organization.list` échoue (401), redirection
 * vers `/signin`. L'intégration dans le top bar applicatif viendra avec le
 * shell Settings (Story 3.17).
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { OrgSwitcher } from '@__SCOPE__/ui/org-switcher';
import type { Organization } from '@__SCOPE__/ui/org-switcher';
import { authClient } from '../../lib/auth-client';

export const Route = createFileRoute('/_app/select-organization')({
  component: SelectOrganizationPage,
});

/** Destination après bascule d'organisation — tableau de bord authentifié. */
const DASHBOARD_URL = '/dashboard';

/** Libellé français d'un rôle d'organisation. */
function roleLabel(role: string | undefined): string {
  switch (role) {
    case 'owner':
      return 'Propriétaire';
    case 'admin':
      return 'Administrateur';
    case 'guest':
      return 'Invité';
    default:
      return 'Membre';
  }
}

function SelectOrganizationPage() {
  const [orgs, setOrgs] = useState<Organization[] | null>(null);
  const [activeId, setActiveId] = useState<string>('');
  const [switching, setSwitching] = useState(false);

  const load = useCallback(async () => {
    const [list, session, member] = await Promise.all([
      authClient.organization.list(),
      authClient.getSession(),
      authClient.organization.getActiveMember(),
    ]);
    if (list.error || !list.data) {
      window.location.assign('/signin');
      return;
    }
    const active = session.data?.session.activeOrganizationId ?? list.data[0]?.id ?? '';
    setActiveId(active);
    // Le rôle exact n'est connu que pour l'organisation active (`getActiveMember`) ;
    // les autres reçoivent le libellé neutre « Membre ».
    setOrgs(
      list.data.map((o) => ({
        id: o.id,
        name: o.name,
        role: o.id === active ? roleLabel(member.data?.role) : 'Membre',
      })),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function select(id: string) {
    if (id === activeId || switching) return;
    setSwitching(true);
    const { error } = await authClient.organization.setActive({ organizationId: id });
    if (error) {
      setSwitching(false);
      return;
    }
    window.location.assign(DASHBOARD_URL);
  }

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-foreground text-2xl font-semibold">Vos organisations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Choisissez l'organisation sur laquelle travailler.
        </p>
        <div className="mt-6 flex justify-center">
          {orgs === null ? (
            <p className="text-muted-foreground text-sm">Chargement…</p>
          ) : orgs.length === 0 ? (
            <div className="flex w-full flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                Vous n'appartenez à aucune organisation.
              </p>
              <a
                href="/onboarding?create=true"
                className="bg-primary text-primary-foreground inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium"
              >
                Créer une organisation
              </a>
              <a
                href="/invitations"
                className="text-muted-foreground inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium underline"
              >
                Accepter une invitation
              </a>
            </div>
          ) : (
            <OrgSwitcher organizations={orgs} activeId={activeId} onSelect={select} />
          )}
        </div>
        {switching ? <p className="text-muted-foreground mt-4 text-sm">Bascule en cours…</p> : null}
      </div>
    </main>
  );
}
