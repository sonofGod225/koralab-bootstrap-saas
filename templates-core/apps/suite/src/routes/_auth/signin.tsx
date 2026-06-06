/**
 * /signin — connexion + challenge MFA (Stories 3.14 / 3.17).
 *
 * Aligné pixel-perfect sur le bundle de design `__PROJECT_NAME__-Auth` : écran
 * split-screen (`AuthScreen`), rangée OAuth + séparateur + formulaire email.
 * Si le compte a la 2FA active, `signIn.email` renvoie `twoFactorRedirect` →
 * challenge TOTP.
 *
 * MVP : connexion par SMS désactivée (`PHONE_AUTH_ENABLED=false`) — le mode
 * `'phone'` reste dans le code (réversible) mais n'a aucun point d'entrée.
 */
import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod/v4';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@__SCOPE__/ui/form';
import { Input } from '@__SCOPE__/ui/input';
import { Button } from '@__SCOPE__/ui/button';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { Checkbox } from '@__SCOPE__/ui/checkbox';
import { Label } from '@__SCOPE__/ui/label';
import {
  AuthScreen,
  AuthDivider,
  FormHeader,
  IconInput,
  OAuthRow,
  OtpField,
  PhoneOtpForm,
} from '../../components/auth-screen';
import { authClient } from '../../lib/auth-client';
import { safeRedirect } from '../../lib/safe-redirect';

export const Route = createFileRoute('/_auth/signin')({
  component: SigninPage,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
});

/** Destination post-connexion par défaut — tableau de bord authentifié. */
const DEFAULT_POST_SIGNIN_URL = '/dashboard';

const SIGNIN_MARKETING = {
  eyebrow: 'La plateforme business des PME africaines',
  title: 'Une plateforme. *Tous vos métiers.*',
  description:
    'Pilotez votre activité commerciale, financière et opérationnelle depuis une seule ' +
    "plateforme. De nouveaux modules s'ajoutent régulièrement pour accompagner la croissance " +
    'de votre entreprise.',
  illustration: '/illustrations/illu-02-signin.svg',
};

const credentialsSchema = z.object({
  email: z.email('Adresse email invalide.'),
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
  rememberMe: z.boolean(),
});
type Credentials = z.infer<typeof credentialsSchema>;

/* ─── Étape identifiants ────────────────────────────────────────────────── */

function CredentialsMode({
  onMfaRequired,
  nextUrl,
}: {
  onMfaRequired: () => void;
  nextUrl: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(values: Credentials) {
    setServerError(null);
    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    });
    if (error) {
      setServerError(error.message ?? 'Email ou mot de passe incorrect.');
      return;
    }
    if (data?.twoFactorRedirect) {
      onMfaRequired();
      return;
    }
    window.location.assign(nextUrl);
  }

  return (
    <div className="flex flex-col gap-5">
      <OAuthRow callbackURL={nextUrl} />
      <AuthDivider label="ou avec votre email" />
      <Form
        schema={credentialsSchema}
        onSubmit={onSubmit}
        defaultValues={{ email: '', password: '', rememberMe: true }}
        className="flex flex-col gap-4"
      >
        {(methods) => (
          <>
            <FormField
              name="email"
              required
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <IconInput
                      icon="mail"
                      type="email"
                      placeholder="vous@votreentreprise.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              required
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-baseline justify-between">
                    <FormLabel>Mot de passe</FormLabel>
                    <a
                      href="/forgot-password"
                      className="text-soleil-700 text-xs font-medium underline underline-offset-2"
                    >
                      Oublié ?
                    </a>
                  </div>
                  <FormControl>
                    <IconInput
                      icon="lock"
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="rememberMe"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2.5">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <Label className="text-terre-700 text-sm font-normal">
                      Garder ma session active
                    </Label>
                  </div>
                </FormItem>
              )}
            />
            {serverError ? <p className="text-brique-700 text-sm">{serverError}</p> : null}
            <div className="flex flex-col gap-2.5">
              <LoadingButton
                type="submit"
                size="lg"
                loading={methods.formState.isSubmitting}
                className="w-full"
              >
                Se connecter
              </LoadingButton>
            </div>
          </>
        )}
      </Form>
    </div>
  );
}

/* ─── Challenge MFA TOTP ────────────────────────────────────────────────── */

function MfaMode({ nextUrl }: { nextUrl: string }) {
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = useRecovery ? code.length >= 8 : code.length === 6;

  async function verify() {
    setError(null);
    setBusy(true);
    const { error: err } = useRecovery
      ? await authClient.twoFactor.verifyBackupCode({ code })
      : await authClient.twoFactor.verifyTotp({ code });
    setBusy(false);
    if (err) {
      setError(err.message ?? 'Code incorrect. Réessayez.');
      return;
    }
    window.location.assign(nextUrl);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mfa-code">
          {useRecovery ? 'Code de récupération' : 'Code à 6 chiffres'}
        </Label>
        {useRecovery ? (
          <Input
            id="mfa-code"
            inputMode="text"
            autoComplete="one-time-code"
            autoFocus
            placeholder="XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
          />
        ) : (
          <OtpField value={code} onChange={setCode} autoFocus />
        )}
        <p className="text-terre-500 text-xs">
          {useRecovery
            ? 'Chaque code de récupération n’est utilisable qu’une seule fois.'
            : 'Ouvrez votre application d’authentification (Google Authenticator, etc.).'}
        </p>
      </div>
      {error ? <p className="text-brique-700 text-sm">{error}</p> : null}
      <LoadingButton
        type="button"
        size="lg"
        loading={busy}
        disabled={!ready}
        className="w-full"
        onClick={verify}
      >
        Vérifier
      </LoadingButton>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => {
          setUseRecovery((v) => !v);
          setCode('');
          setError(null);
        }}
      >
        {useRecovery
          ? 'Utiliser plutôt mon application d’authentification'
          : 'Utiliser un code de récupération'}
      </Button>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

function SigninPage() {
  const { redirect } = Route.useSearch();
  const nextUrl = safeRedirect(redirect, DEFAULT_POST_SIGNIN_URL);
  const [mode, setMode] = useState<'credentials' | 'mfa' | 'phone'>('credentials');
  const mfa = mode === 'mfa';

  return (
    <AuthScreen marketing={SIGNIN_MARKETING}>
      <div className="flex flex-col gap-6">
        <FormHeader
          title={mfa ? 'Vérification en deux étapes' : 'Content de vous revoir'}
          subtitle={
            mfa
              ? 'Saisissez le code de votre application d’authentification.'
              : 'Connectez-vous pour piloter votre entreprise.'
          }
        />

        {mode === 'credentials' ? (
          <CredentialsMode nextUrl={nextUrl} onMfaRequired={() => setMode('mfa')} />
        ) : mode === 'mfa' ? (
          <MfaMode nextUrl={nextUrl} />
        ) : (
          <PhoneOtpForm
            redirectTo={nextUrl}
            onBack={() => setMode('credentials')}
            backLabel="Revenir à la connexion par email"
          />
        )}

        {mode === 'credentials' ? (
          <p className="text-terre-600 text-sm">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="text-terre-900 font-medium underline">
              Créer un compte
            </Link>
          </p>
        ) : null}
      </div>
    </AuthScreen>
  );
}
