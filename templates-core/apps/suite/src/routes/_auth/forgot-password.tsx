/**
 * /forgot-password — demande de réinitialisation du mot de passe (Story 3.17).
 *
 * Aligné pixel-perfect sur le bundle de design `__PROJECT_NAME__-Auth` (écran 03).
 * Saisie de l'email → `requestPasswordReset` (backend Story 3.8). La réponse
 * est volontairement uniforme (anti-énumération de comptes) : on affiche
 * toujours le même message de succès.
 */
import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod/v4';
import { CircleCheck } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@__SCOPE__/ui/form';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { AuthScreen, FormHeader, IconInput } from '../../components/auth-screen';
import { authClient } from '../../lib/auth-client';

export const Route = createFileRoute('/_auth/forgot-password')({ component: ForgotPasswordPage });

const MARKETING = {
  eyebrow: "Sécurité d'abord",
  title: 'Votre compte *est protégé.*',
  description:
    'Les liens de réinitialisation expirent automatiquement après une heure et ne servent ' +
    "qu'une seule fois. Votre compte reste à l'abri, même en cas d'email oublié.",
  illustration: '/illustrations/illu-03-forgot-password.svg',
};

const schema = z.object({ email: z.email('Adresse email invalide.') });
type ForgotForm = z.infer<typeof schema>;

function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(values: ForgotForm) {
    // Réponse uniforme — on ignore l'erreur éventuelle (anti-énumération).
    await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSentTo(values.email);
  }

  return (
    <AuthScreen marketing={MARKETING}>
      <div className="flex flex-col gap-6">
        <FormHeader
          title="Mot de passe oublié ?"
          subtitle="Pas de souci. Entrez votre email, nous vous envoyons un lien pour le réinitialiser."
        />

        {sentTo ? (
          <div className="border-success-200 bg-success-50 flex items-start gap-3 rounded-xl border p-4">
            <CircleCheck className="text-success-600 mt-0.5 size-4 shrink-0" />
            <div className="text-success-800 text-sm leading-[1.5]">
              <p className="font-semibold">Lien envoyé !</p>
              <p>
                Vérifiez la boîte de réception <strong>{sentTo}</strong>. Le lien expire dans
                1&nbsp;heure.
              </p>
            </div>
          </div>
        ) : (
          <Form
            schema={schema}
            onSubmit={onSubmit}
            defaultValues={{ email: '' }}
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
                <LoadingButton
                  type="submit"
                  size="lg"
                  loading={methods.formState.isSubmitting}
                  className="w-full"
                >
                  Envoyer le lien
                </LoadingButton>
              </>
            )}
          </Form>
        )}

        <p className="text-base-600 text-sm">
          <Link to="/signin" className="text-base-900 font-medium underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </AuthScreen>
  );
}
