/**
 * /reset-password — définition d'un nouveau mot de passe (Story 3.17).
 *
 * Aligné pixel-perfect sur le bundle de design `__PROJECT_NAME__-Auth` (écran 04).
 * Le token de réinitialisation est lu depuis `?token=` (lien reçu par email —
 * Story 3.8) ; `?error=` signale un lien invalide/expiré.
 */
import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod/v4';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@__SCOPE__/ui/form';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { AuthScreen, FormHeader, IconInput, PasswordStrength } from '../../components/auth-screen';
import { authClient } from '../../lib/auth-client';

export const Route = createFileRoute('/_auth/reset-password')({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>): { token?: string; error?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
});

const MARKETING = {
  eyebrow: 'Bonnes pratiques',
  title: 'Un mot de passe *solide.*',
  description:
    'Utilisez une phrase facile à mémoriser plutôt qu’un mot court et complexe. Au moins ' +
    '12 caractères, et un mot de passe unique à __PROJECT_NAME__.',
  illustration: '/illustrations/illu-04-reset-password.svg',
};

const schema = z
  .object({
    newPassword: z.string().min(12, 'Au moins 12 caractères.'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirm'],
  });
type ResetForm = z.infer<typeof schema>;

function ResetPasswordPage() {
  const { token, error: linkError } = Route.useSearch();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(values: ResetForm) {
    if (!token) return;
    setServerError(null);
    const { error } = await authClient.resetPassword({ newPassword: values.newPassword, token });
    if (error) {
      setServerError(error.message ?? 'La réinitialisation a échoué. Le lien a peut-être expiré.');
      return;
    }
    setDone(true);
  }

  const invalid = !token || Boolean(linkError);

  return (
    <AuthScreen marketing={MARKETING}>
      <div className="flex flex-col gap-6">
        <FormHeader
          title="Nouveau mot de passe"
          subtitle="Choisissez un mot de passe solide. Vous l'utiliserez à chaque connexion."
        />

        {invalid ? (
          <div className="flex flex-col gap-3 py-2 text-center">
            <p className="text-terre-900 font-medium">Lien invalide ou expiré</p>
            <p className="text-terre-600 text-sm">
              Ce lien de réinitialisation n'est plus valable. Demandez-en un nouveau.
            </p>
            <Link
              to="/forgot-password"
              className="text-terre-900 mt-1 text-sm font-medium underline"
            >
              Demander un nouveau lien
            </Link>
          </div>
        ) : done ? (
          <div className="border-palmeraie-200 bg-palmeraie-50 text-palmeraie-800 flex flex-col gap-1.5 rounded-xl border p-4 text-sm leading-[1.5]">
            <p className="font-semibold">Mot de passe réinitialisé</p>
            <p>Votre mot de passe a été modifié et toutes vos sessions ont été déconnectées.</p>
            <Link to="/signin" className="text-palmeraie-800 mt-1 font-medium underline">
              Se connecter
            </Link>
          </div>
        ) : (
          <Form
            schema={schema}
            onSubmit={onSubmit}
            defaultValues={{ newPassword: '', confirm: '' }}
            className="flex flex-col gap-4"
          >
            {(methods) => (
              <>
                <FormField
                  name="newPassword"
                  required
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
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
                      {field.value ? (
                        <div className="mt-2">
                          <PasswordStrength password={field.value} />
                        </div>
                      ) : null}
                    </FormItem>
                  )}
                />
                <FormField
                  name="confirm"
                  required
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer</FormLabel>
                      <FormControl>
                        <IconInput
                          icon="lock"
                          type="password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {serverError ? <p className="text-brique-700 text-sm">{serverError}</p> : null}
                <LoadingButton
                  type="submit"
                  size="lg"
                  loading={methods.formState.isSubmitting}
                  className="w-full"
                >
                  Mettre à jour mon mot de passe
                </LoadingButton>
              </>
            )}
          </Form>
        )}
      </div>
    </AuthScreen>
  );
}
