/**
 * /invite/accept — acceptation d'une invitation à une organisation (Story 3.9).
 *
 * Cible des liens d'activation envoyés par `sendInvitationEmail`
 * (`packages/auth/src/auth.ts`). URL : `?token=<invitationId>&email=<inviteeEmail>`.
 *
 * Better-Auth (`organization.acceptInvitation`) exige une session DONT :
 *  - l'email correspond (case-insensitive) à l'email de l'invitation,
 *  - l'email est vérifié.
 *
 * Les états couverts ici :
 *  1. token manquant → lien invalide ;
 *  2. pas de session → CTA Se connecter / Créer un compte (bounce-back via `?redirect=`) ;
 *  3. session avec email ≠ invitation → bouton « se reconnecter avec le bon compte » ;
 *  4. session non vérifiée → CTA « Vérifier mon email » (envoie l'OTP + bounce-back) ;
 *  5. invitation expirée / introuvable → message d'erreur ;
 *  6. prêt → carte récap (inviteur · organisation · rôle) + Accepter / Refuser.
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@__SCOPE__/ui/button';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { AuthScreen, FormHeader } from '../../components/auth-screen';
import { authClient } from '../../lib/auth-client';
import { trpc } from '../../lib/trpc-client';

export const Route = createFileRoute('/invite/accept')({
  component: AcceptInvitePage,
  validateSearch: (search: Record<string, unknown>): { token?: string; email?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
});

const MARKETING = {
  eyebrow: 'Mieux ensemble',
  title: 'Collaborez *vraiment.*',
  description:
    "Acceptez l'invitation pour rejoindre l'organisation : vous partagerez la facturation, " +
    'les encaissements et la comptabilité de votre équipe.',
  illustration: '/illustrations/illu-08-invitation.svg',
};

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organizationId: string;
  organizationName: string;
  inviterEmail: string;
}

/** Libellé français d'un rôle d'organisation. */
function roleLabel(role: string): string {
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

type Phase =
  | 'loading'
  | 'noToken'
  | 'notAuth'
  | 'mismatchEmail'
  | 'unverified'
  | 'invalid'
  | 'ready'
  | 'accepting'
  | 'accepted';

function AcceptInvitePage() {
  const { token, email: invitedEmail } = Route.useSearch();
  const [phase, setPhase] = useState<Phase>('loading');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  /** URL courante (avec ses query params), encodée pour `?redirect=`. */
  const currentUrl = (() => {
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (invitedEmail) params.set('email', invitedEmail);
    return `/invite/accept?${params.toString()}`;
  })();
  const redirectParam = encodeURIComponent(currentUrl);

  const load = useCallback(async () => {
    if (!token) {
      setPhase('noToken');
      return;
    }
    const session = await authClient.getSession();
    if (!session.data) {
      setPhase('notAuth');
      return;
    }
    const sessionEmail = session.data.user.email;
    setUserEmail(sessionEmail);

    if (invitedEmail && sessionEmail.toLowerCase() !== invitedEmail.toLowerCase()) {
      setPhase('mismatchEmail');
      return;
    }
    if (session.data.user.emailVerified === false) {
      setPhase('unverified');
      return;
    }

    const { data, error: err } = await authClient.organization.getInvitation({
      query: { id: token },
    });
    if (err || !data) {
      const msg = err?.message ?? '';
      // Better-Auth renvoie un code dédié quand l'email n'est pas (encore) vérifié.
      if (/verif/i.test(msg)) {
        setPhase('unverified');
        return;
      }
      setError(msg || 'Cette invitation est introuvable ou a expiré.');
      setPhase('invalid');
      return;
    }
    setInvitation(data);
    setPhase('ready');
  }, [token, invitedEmail]);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept() {
    if (!invitation) return;
    setError(null);
    setPhase('accepting');
    const { error: err } = await authClient.organization.acceptInvitation({
      invitationId: invitation.id,
    });
    if (err) {
      setError(err.message ?? "Impossible d'accepter l'invitation.");
      setPhase('ready');
      return;
    }
    setPhase('accepted');
    // Story 3.25 : auto-affecte le nouveau membre aux établissements ciblés par
    // l'invitation (sinon siège). Best-effort — l'org active vient d'être posée
    // par `acceptInvitation`.
    await trpc.establishments.acceptInvitationEstablishments
      .mutate({ invitationId: invitation.id })
      .catch(() => undefined);
    // Rechargement complet : la session porte désormais l'organisation active
    // mise à jour par `acceptInvitation` — besoin reload pour que le shell
    // re-fetch organization.list/getActiveMember avec la nouvelle org.
    window.location.assign('/dashboard');
  }

  async function reject() {
    if (!invitation) return;
    setError(null);
    const { error: err } = await authClient.organization.rejectInvitation({
      invitationId: invitation.id,
    });
    if (err) {
      setError(err.message ?? "Impossible de refuser l'invitation.");
      return;
    }
    window.location.assign('/dashboard');
  }

  async function signOutAndRetry() {
    await authClient.signOut();
    window.location.assign(`/signin?redirect=${redirectParam}`);
  }

  async function sendVerificationAndGo() {
    if (!userEmail) return;
    await authClient.emailOtp.sendVerificationOtp({
      email: userEmail,
      type: 'email-verification',
    });
    window.location.assign(
      `/verify-email?email=${encodeURIComponent(userEmail)}&redirect=${redirectParam}`,
    );
  }

  return (
    <AuthScreen marketing={MARKETING}>
      <div className="flex flex-col gap-6">
        {phase === 'loading' ? (
          <p className="text-terre-600 text-sm">Chargement de l'invitation…</p>
        ) : phase === 'noToken' ? (
          <PanelMessage
            title="Lien invalide"
            body="Le lien d'invitation est incomplet ou a été tronqué. Demandez à la personne qui vous invite de vous le renvoyer."
            cta={{ href: '/', label: "Aller à l'accueil" }}
          />
        ) : phase === 'notAuth' ? (
          <NotAuth invitedEmail={invitedEmail} redirectParam={redirectParam} />
        ) : phase === 'mismatchEmail' ? (
          <MismatchEmail
            invitedEmail={invitedEmail ?? ''}
            userEmail={userEmail}
            onSignOut={signOutAndRetry}
          />
        ) : phase === 'unverified' ? (
          <Unverified email={userEmail} onSend={sendVerificationAndGo} />
        ) : phase === 'invalid' ? (
          <PanelMessage
            title="Invitation introuvable"
            body={error ?? 'Cette invitation a peut-être expiré ou été révoquée.'}
            cta={{ href: '/', label: "Aller à l'accueil" }}
          />
        ) : invitation ? (
          <ReadyPanel
            invitation={invitation}
            busy={phase === 'accepting'}
            accepted={phase === 'accepted'}
            error={error}
            onAccept={accept}
            onReject={reject}
          />
        ) : null}
      </div>
    </AuthScreen>
  );
}

/* ─── Sous-écrans ───────────────────────────────────────────────────────── */

function NotAuth({
  invitedEmail,
  redirectParam,
}: {
  invitedEmail: string | undefined;
  redirectParam: string;
}) {
  const signupHref = invitedEmail
    ? `/signup?email=${encodeURIComponent(invitedEmail)}&redirect=${redirectParam}`
    : `/signup?redirect=${redirectParam}`;
  return (
    <>
      <FormHeader
        title="Vous êtes invité·e"
        subtitle={
          invitedEmail ? (
            <>
              Connectez-vous (ou créez un compte) avec <strong>{invitedEmail}</strong> pour
              accepter.
            </>
          ) : (
            'Connectez-vous ou créez un compte pour accepter cette invitation.'
          )
        }
      />
      <div className="flex flex-col gap-2.5">
        <Button asChild size="lg" className="w-full">
          <a href={`/signin?redirect=${redirectParam}`}>J'ai déjà un compte — Se connecter</a>
        </Button>
        <Button asChild size="lg" variant="ghost" className="w-full">
          <a href={signupHref}>Créer un compte</a>
        </Button>
      </div>
    </>
  );
}

function MismatchEmail({
  invitedEmail,
  userEmail,
  onSignOut,
}: {
  invitedEmail: string;
  userEmail: string;
  onSignOut: () => Promise<void>;
}) {
  return (
    <>
      <FormHeader
        title="Mauvais compte"
        subtitle={
          <>
            Cette invitation est destinée à <strong>{invitedEmail}</strong>. Vous êtes connecté·e en
            tant que <strong>{userEmail}</strong>.
          </>
        }
      />
      <Button type="button" size="lg" className="w-full" onClick={() => void onSignOut()}>
        Se reconnecter avec {invitedEmail}
      </Button>
    </>
  );
}

function Unverified({ email, onSend }: { email: string; onSend: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    await onSend();
  }
  return (
    <>
      <FormHeader
        title="Vérifiez votre email d'abord"
        subtitle={
          <>
            Pour accepter une invitation, l'adresse <strong>{email}</strong> doit être vérifiée.
          </>
        }
      />
      <LoadingButton
        type="button"
        size="lg"
        loading={busy}
        className="w-full"
        onClick={() => void go()}
      >
        Recevoir un code de vérification
      </LoadingButton>
    </>
  );
}

function ReadyPanel({
  invitation,
  busy,
  accepted,
  error,
  onAccept,
  onReject,
}: {
  invitation: InvitationDetails;
  busy: boolean;
  accepted: boolean;
  error: string | null;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  return (
    <>
      <FormHeader
        title={
          accepted ? 'Bienvenue dans l’équipe !' : `Rejoindre ${invitation.organizationName} ?`
        }
        subtitle={
          accepted ? (
            'Redirection en cours…'
          ) : (
            <>
              <strong>{invitation.inviterEmail}</strong> vous invite à rejoindre{' '}
              <strong>{invitation.organizationName}</strong>.
            </>
          )
        }
      />
      <div className="border-border bg-terre-50 flex flex-col gap-3 rounded-2xl border p-4">
        <Row label="Organisation" value={invitation.organizationName} />
        <Row label="Rôle attribué" value={roleLabel(invitation.role)} />
        <Row label="Invité par" value={invitation.inviterEmail} />
      </div>
      {error ? <p className="text-brique-700 text-sm">{error}</p> : null}
      <div className="flex flex-col gap-2.5">
        <LoadingButton
          type="button"
          size="lg"
          loading={busy}
          disabled={accepted}
          className="w-full"
          onClick={() => void onAccept()}
        >
          Accepter et rejoindre
        </LoadingButton>
        <Button
          type="button"
          variant="ghost"
          className="text-brique-700 w-full"
          disabled={busy || accepted}
          onClick={() => void onReject()}
        >
          Refuser l'invitation
        </Button>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-terre-500 text-xs font-medium tracking-wide uppercase">{label}</span>
      <span className="text-terre-900 truncate text-sm font-medium">{value}</span>
    </div>
  );
}

function PanelMessage({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <>
      <FormHeader title={title} subtitle={body} />
      <Button asChild variant="ghost" className="w-full">
        <a href={cta.href}>{cta.label}</a>
      </Button>
    </>
  );
}
