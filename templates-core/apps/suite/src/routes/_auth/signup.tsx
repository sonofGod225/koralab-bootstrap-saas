/**
 * /signup — inscription (Stories 3.13 / 3.17).
 *
 * Aligné pixel-perfect sur le bundle de design `__PROJECT_NAME__-Auth` : écran
 * split-screen (`AuthScreen`), rangée OAuth + séparateur + formulaire email,
 * bouton secondaire vers le parcours téléphone (OTP SMS en 2 étapes).
 *
 * MVP : le parcours téléphone est masqué (`PHONE_AUTH_ENABLED=false`) — auth par
 * email + OAuth uniquement. Le code reste en place, réactivable post-MVP.
 */
import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod/v4';
import { ArrowRight } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@__SCOPE__/ui/form';
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
  PhoneOtpForm,
} from '../../components/auth-screen';
import { authClient } from '../../lib/auth-client';
import { useAuthFlowStore } from '../../lib/auth-flow-store';
import { safeRedirect } from '../../lib/safe-redirect';
import { PHONE_AUTH_ENABLED } from '@__SCOPE__/config/flags';

export const Route = createFileRoute('/_auth/signup')({
  component: SignupPage,
  validateSearch: (search: Record<string, unknown>): { email?: string; redirect?: string } => ({
    email: typeof search.email === 'string' ? search.email : undefined,
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
});

/**
 * Destination par défaut une fois le compte créé + email vérifié. Route
 * orchestratrice `/onboarding` : elle crée l'organisation "brouillon" (l'org
 * n'est plus créée à l'inscription) puis ouvre le Step 1 du wizard. Un signup
 * issu d'une invitation surcharge cette valeur via `?redirect=/invite/accept…`.
 */
const DEFAULT_POST_SIGNUP_URL = '/onboarding';

const SIGNUP_MARKETING = {
  eyebrow: "Plateforme de gestion d'entreprise",
  title: 'Tout votre business. *Au même endroit.*',
  description:
    '__PROJECT_NAME__ réunit la facturation, les encaissements, le CRM, la comptabilité — et de ' +
    'nombreux autres modules à venir — dans une seule plateforme pensée pour les entreprises ' +
    'africaines.',
  illustration: '/illustrations/illu-01-signup.svg',
};

const emailSchema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom.'),
  email: z.email('Adresse email invalide.'),
  password: z.string().min(12, 'Au moins 12 caractères.'),
  acceptTerms: z.boolean().refine((v) => v, 'Vous devez accepter les conditions.'),
});
type EmailForm = z.infer<typeof emailSchema>;

function EmailMode({
  onPhone,
  nextUrl,
  defaultEmail,
}: {
  onPhone: () => void;
  nextUrl: string;
  defaultEmail: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(values: EmailForm) {
    setServerError(null);
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: nextUrl,
    });
    if (error) {
      setServerError(error.message ?? "L'inscription a échoué. Réessayez.");
      return;
    }
    // Déclenche l'envoi du code de vérification puis redirige vers l'écran OTP.
    await authClient.emailOtp.sendVerificationOtp({
      email: values.email,
      type: 'email-verification',
    });
    // L'email transite via sessionStorage (Zustand persist) plutôt que dans
    // l'URL — évite la fuite PII (historique, referer, logs). Cf. auth-flow-store.
    useAuthFlowStore.getState().setPendingVerificationEmail(values.email);
    // `redirect` reste en URL (non-PII, pattern cohérent avec /signin?redirect=) —
    // utile quand le signup vient d'un `/invite/accept`.
    const params = new URLSearchParams();
    if (nextUrl !== DEFAULT_POST_SIGNUP_URL) params.set('redirect', nextUrl);
    const search = params.toString();
    window.location.assign(`/verify-email${search ? `?${search}` : ''}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <OAuthRow callbackURL={nextUrl} />
      <AuthDivider label="ou avec votre email" />
      <Form
        schema={emailSchema}
        onSubmit={onSubmit}
        defaultValues={{ name: '', email: defaultEmail, password: '', acceptTerms: false }}
        className="flex flex-col gap-4"
      >
        {(methods) => (
          <>
            <FormField
              name="name"
              required
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <IconInput icon="user" placeholder="Awa Diop" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              required
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email professionnel</FormLabel>
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
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <IconInput
                      icon="lock"
                      type="password"
                      placeholder="Minimum 12 caractères"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="acceptTerms"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-2.5">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <Label className="text-terre-700 text-sm font-normal">
                      J'accepte les conditions d'utilisation et la politique de confidentialité.
                    </Label>
                  </div>
                  <FormMessage />
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
                Créer mon compte
              </LoadingButton>
              {PHONE_AUTH_ENABLED ? (
                <Button type="button" variant="ghost" className="w-full" onClick={onPhone}>
                  Continuer avec un numéro de téléphone
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </>
        )}
      </Form>
    </div>
  );
}

function SignupPage() {
  const { email, redirect } = Route.useSearch();
  const nextUrl = safeRedirect(redirect, DEFAULT_POST_SIGNUP_URL);
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  return (
    <AuthScreen marketing={SIGNUP_MARKETING}>
      <div className="flex flex-col gap-6">
        <FormHeader title="Créez votre compte" subtitle="Gratuit 14 jours, sans carte bancaire." />

        {mode === 'email' ? (
          <EmailMode
            onPhone={() => setMode('phone')}
            nextUrl={nextUrl}
            defaultEmail={email ?? ''}
          />
        ) : (
          <PhoneOtpForm
            redirectTo={nextUrl}
            onBack={() => setMode('email')}
            backLabel="Revenir à l'inscription par email"
          />
        )}

        <p className="text-terre-600 text-sm">
          Vous avez déjà un compte ?{' '}
          <Link
            to="/signin"
            search={nextUrl === DEFAULT_POST_SIGNUP_URL ? undefined : { redirect: nextUrl }}
            className="text-terre-900 font-medium underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </AuthScreen>
  );
}
