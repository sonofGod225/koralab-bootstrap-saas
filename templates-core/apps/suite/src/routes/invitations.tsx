/**
 * /invitations — invitations en attente pour l'utilisateur courant.
 *
 * Atteinte depuis le bouton « Accepter une invitation » du dropdown
 * d'organisation (`<OrgSwitcher />`). Contrairement à `/invite/accept` (qui
 * cible UNE invitation via un token de lien email), cette page liste TOUTES les
 * invitations `pending` adressées à l'email du compte, toutes organisations
 * confondues (query `invitation.listForCurrentUser`).
 *
 * Accepter / refuser passent par Better-Auth (`acceptInvitation` /
 * `rejectInvitation`) qui met à jour le membership + l'org active de façon
 * cohérente avec le cache KV.
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@__SCOPE__/ui/button';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { AuthScreen, FormHeader } from '../components/auth-screen';
import { authClient } from '../lib/auth-client';
import { trpc } from '../lib/trpc-client';

export const Route = createFileRoute('/invitations')({ component: InvitationsPage });

const MARKETING = {
  eyebrow: 'Mieux ensemble',
  title: 'Rejoignez votre *équipe.*',
  description:
    'Acceptez une invitation pour rejoindre une organisation existante et collaborer sur la ' +
    'facturation, les encaissements et la comptabilité de votre équipe.',
  illustration: '/illustrations/illu-08-invitation.svg',
};

type PendingInvitation = Awaited<
  ReturnType<typeof trpc.invitation.listForCurrentUser.query>
>[number];

/** Libellé français d'un rôle d'organisation. */
function roleLabel(role: string | null): string {
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

function InvitationsPage() {
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading');
  const [items, setItems] = useState<PendingInvitation[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      window.location.assign(`/signin?redirect=${encodeURIComponent('/invitations')}`);
      return;
    }
    try {
      setItems(await trpc.invitation.listForCurrentUser.query());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les invitations.');
    }
    setPhase('ready');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(inv: PendingInvitation) {
    setError(null);
    setBusyId(inv.id);
    const { error: err } = await authClient.organization.acceptInvitation({
      invitationId: inv.id,
    });
    if (err) {
      setError(err.message ?? "Impossible d'accepter l'invitation.");
      setBusyId(null);
      return;
    }
    await authClient.organization.setActive({ organizationId: inv.organizationId });
    // Story 3.25 : auto-affectation établissement (cibles de l'invitation, sinon siège).
    await trpc.establishments.acceptInvitationEstablishments
      .mutate({ invitationId: inv.id })
      .catch(() => undefined);
    // Reload complet : le shell re-fetch org list / active member avec la nouvelle org.
    window.location.assign('/dashboard');
  }

  async function reject(id: string) {
    setError(null);
    setBusyId(id);
    const { error: err } = await authClient.organization.rejectInvitation({ invitationId: id });
    if (err) {
      setError(err.message ?? "Impossible de refuser l'invitation.");
      setBusyId(null);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setBusyId(null);
  }

  return (
    <AuthScreen marketing={MARKETING}>
      <div className="flex flex-col gap-6">
        <FormHeader
          title="Vos invitations"
          subtitle="Les organisations qui vous ont invité·e à les rejoindre."
        />

        {phase === 'loading' ? (
          <p className="text-terre-600 text-sm">Chargement…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-terre-600 text-sm">Vous n'avez aucune invitation en attente.</p>
            <div className="flex flex-col gap-2.5">
              <Button asChild size="lg" className="w-full">
                <a href="/onboarding?create=true">Créer une organisation</a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="w-full">
                <a href="/dashboard">Aller au tableau de bord</a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {error ? <p className="text-brique-700 text-sm">{error}</p> : null}
            {items.map((inv) => (
              <div
                key={inv.id}
                className="border-terre-200 flex flex-col gap-3 rounded-xl border p-4"
              >
                <div>
                  <p className="text-terre-900 font-medium">{inv.organizationName}</p>
                  <p className="text-terre-600 text-sm">Rôle proposé : {roleLabel(inv.role)}</p>
                </div>
                <div className="flex gap-2.5">
                  <LoadingButton
                    className="flex-1"
                    loading={busyId === inv.id}
                    onClick={() => void accept(inv)}
                  >
                    Accepter
                  </LoadingButton>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    disabled={busyId === inv.id}
                    onClick={() => void reject(inv.id)}
                  >
                    Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthScreen>
  );
}
