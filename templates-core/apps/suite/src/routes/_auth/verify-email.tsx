/**
 * /verify-email — vérification de l'adresse email par code OTP (Story 3.17).
 *
 * Aligné pixel-perfect sur le bundle de design `__PROJECT_NAME__-Auth` (écran 05).
 * Code à 6 chiffres envoyé par email à l'inscription (plugin `emailOTP` —
 * backend). L'adresse à vérifier est lue depuis le store `useAuthFlowStore`
 * (sessionStorage) plutôt que depuis l'URL (évite la fuite PII).
 */
import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@__SCOPE__/ui/button';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { Label } from '@__SCOPE__/ui/label';
import { AuthScreen, FormHeader, OtpField } from '../../components/auth-screen';
import { authClient } from '../../lib/auth-client';
import { useAuthFlowStore } from '../../lib/auth-flow-store';
import { safeRedirect } from '../../lib/safe-redirect';

export const Route = createFileRoute('/_auth/verify-email')({
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
});

/**
 * Route orchestratrice `/onboarding` : crée l'org brouillon (l'org n'est plus
 * créée à l'inscription) puis ouvre le Step 1. Surchargée par `?redirect=` pour
 * un signup issu d'une invitation (`/invite/accept…`).
 */
const DEFAULT_POST_VERIFY_URL = '/onboarding';

const MARKETING = {
  eyebrow: 'Étape de sécurité',
  title: "Un code *rapide.* Et c'est tout.",
  description:
    'Cette vérification protège votre compte et confirme que cette adresse vous appartient. ' +
    'Le code expire au bout de 10 minutes.',
  illustration: '/illustrations/illu-05-otp.svg',
};

function VerifyEmailPage() {
  const { redirect } = Route.useSearch();
  const nextUrl = safeRedirect(redirect, DEFAULT_POST_VERIFY_URL);
  const [email, setEmail] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    // Le store est `skipHydration: true` (SSR-safe) — on rehydrate manuellement
    // côté client puis on lit l'email posé par /signup.
    void useAuthFlowStore.persist.rehydrate();
    setEmail(useAuthFlowStore.getState().pendingVerificationEmail);
    setHydrated(true);
  }, []);

  async function verify() {
    if (!email) return;
    setError(null);
    setBusy(true);
    const { error: err } = await authClient.emailOtp.verifyEmail({ email, otp: code });
    if (err) {
      setBusy(false);
      setError(err.message ?? 'Code incorrect ou expiré.');
      return;
    }
    // Si l'utilisateur a déjà un membership (ex: invité ayant accepté avant de
    // vérifier), on bascule dessus. Un compte neuf n'a aucune org : la route
    // `/onboarding` la créera. `autoSignInAfterVerification` crée une session
    // sans activeOrganizationId (databaseHooks.session.create.before ne se
    // déclenche pas pour cet endpoint emailOTP), d'où ce best-effort.
    try {
      const { data: orgs } = await authClient.organization.list();
      const first = orgs?.[0];
      if (first?.id) {
        await authClient.organization.setActive({ organizationId: first.id });
      }
    } catch {
      // Best-effort — la route `/onboarding` prendra le relais sinon.
    }
    // Libère le store : évite qu'un email stale traîne pour un futur flow.
    useAuthFlowStore.getState().clearPendingVerificationEmail();
    setBusy(false);
    window.location.assign(nextUrl);
  }

  async function resend() {
    if (!email) return;
    setError(null);
    await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
    setResent(true);
  }

  return (
    <AuthScreen marketing={MARKETING}>
      <div className="flex flex-col gap-6">
        <FormHeader
          title="Vérifiez votre email"
          subtitle={
            email ? (
              <>
                Nous avons envoyé un code à 6 chiffres à <strong>{email}</strong>.
              </>
            ) : (
              'Saisissez le code reçu par email.'
            )
          }
        />

        {!hydrated ? (
          <p className="text-terre-600 text-sm">Chargement…</p>
        ) : !email ? (
          <div className="flex flex-col gap-3 py-2 text-center">
            <p className="text-terre-900 font-medium">Adresse email manquante</p>
            <p className="text-terre-600 text-sm">
              Relancez l'inscription pour recevoir un nouveau code.
            </p>
            <Link to="/signup" className="text-terre-900 mt-1 text-sm font-medium underline">
              Retour à l'inscription
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Code de vérification</Label>
              <OtpField value={code} onChange={setCode} autoFocus />
              <p className="text-terre-500 text-xs">Le code expire dans 10 minutes.</p>
            </div>
            {error ? <p className="text-brique-700 text-sm">{error}</p> : null}
            <LoadingButton
              type="button"
              size="lg"
              loading={busy}
              disabled={code.length !== 6}
              className="w-full"
              onClick={verify}
            >
              Vérifier
            </LoadingButton>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={resent}
              onClick={resend}
            >
              {resent ? 'Nouveau code envoyé' : "Je n'ai pas reçu de code — renvoyer"}
            </Button>
          </div>
        )}
      </div>
    </AuthScreen>
  );
}
