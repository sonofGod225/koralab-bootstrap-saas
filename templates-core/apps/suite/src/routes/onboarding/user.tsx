/**
 * /onboarding/user — Step 2 du wizard V2 (Story 7.4).
 *
 * Profil utilisateur : prénom, nom, téléphone (read-only, badge "Vérifié" si
 * `phoneNumberVerified` côté Better-Auth), rôle dans l'entreprise (4
 * RadioCard). La langue par défaut (`fr-af`) est enregistrée sans champ visible.
 *
 * À la soumission, appelle `trpc.onboarding.completeUserProfile` puis
 * redirige vers `/onboarding/consent` (Step 3 — jalon obligatoire final).
 *
 * Design : `epic-onboarding/project/app/onboarding-v2-steps.jsx` lignes 90-152.
 */
import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod/v4';
import { BookOpen, Briefcase, Check, Handshake, Phone, Users } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@__SCOPE__/ui/form';
import { Input } from '@__SCOPE__/ui/input';
import {
  FieldGrid,
  FieldRow,
  OnboardingShellV2,
  OnboardingStepSkeleton,
  RadioCardGrid,
  StepActions,
  StepHeaderV2,
} from '../../components/onboarding-shell';
import { authClient } from '../../lib/auth-client';
import { trpc } from '../../lib/trpc-client';

export const Route = createFileRoute('/onboarding/user')({ component: UserStep });

/* ─── Options (cohérent router tRPC) ────────────────────────────────────── */

const ROLE_OPTIONS = [
  {
    value: 'gerant' as const,
    label: 'Gérante / dirigeante',
    description: 'Direction, prise de décision',
    icon: Briefcase,
  },
  {
    value: 'compta' as const,
    label: 'Comptable / finance',
    description: 'Comptabilité, finances',
    icon: BookOpen,
  },
  {
    value: 'commercial' as const,
    label: 'Commercial / vente',
    description: 'Ventes, relation client',
    icon: Handshake,
  },
  {
    value: 'autre' as const,
    label: 'Autre rôle',
    description: 'Opérations, support, etc.',
    icon: Users,
  },
];

const formSchema = z.object({
  firstName: z.string().trim().min(2, 'Prénom requis (2 caractères minimum).').max(40),
  lastName: z.string().trim().min(2, 'Nom requis (2 caractères minimum).').max(40),
  role: z.enum(['gerant', 'compta', 'commercial', 'autre']),
  language: z.enum(['fr-fr', 'fr-af', 'en', 'wo']),
});
type FormValues = z.infer<typeof formSchema>;

/** Split heuristique `"Amina Yao"` → `{ firstName: 'Amina', lastName: 'Yao' }`. */
function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0] ?? '', lastName: '' };
  const first = parts[0] ?? '';
  const last = parts.slice(1).join(' ');
  return { firstName: first, lastName: last };
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

type Phase = 'loading' | 'ready' | 'no-org';

function UserStep() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [defaults, setDefaults] = useState<Partial<FormValues>>({});
  const [phoneInfo, setPhoneInfo] = useState<{ number: string; verified: boolean } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await authClient.getSession();
      if (!session.data) {
        window.location.assign('/signin');
        return;
      }
      if (!session.data.session.activeOrganizationId) {
        setPhase('no-org');
        return;
      }

      // Pré-remplissage depuis la session (split du `name` Better-Auth).
      const split = splitName(session.data.user.name);
      const sessionDefaults: Partial<FormValues> = {
        firstName: split.firstName,
        lastName: split.lastName,
      };
      if (session.data.user.phoneNumber) {
        setPhoneInfo({
          number: session.data.user.phoneNumber,
          verified: session.data.user.phoneNumberVerified === true,
        });
      }

      // Pré-remplissage depuis l'onboarding existant (si déjà fait, prioritaire).
      try {
        const existing = await trpc.onboarding.get.query();
        const prevUser = (existing?.data as { user?: Partial<FormValues> } | null)?.user;
        setDefaults({ ...sessionDefaults, ...(prevUser ?? {}) });
      } catch {
        setDefaults(sessionDefaults);
      }

      setPhase('ready');
    })();
  }, []);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await trpc.onboarding.completeUserProfile.mutate(values);
      void navigate({ to: '/onboarding/consent' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur d'enregistrement.";
      setServerError(msg);
    }
  }

  if (phase === 'loading') {
    return <OnboardingStepSkeleton currentId="user" />;
  }

  if (phase === 'no-org') {
    return (
      <OnboardingShellV2 currentId="user">
        <StepHeaderV2
          title="Aucune organisation active"
          subtitle="Votre compte n'est rattaché à aucune organisation. Reconnectez-vous ou contactez le support."
        />
      </OnboardingShellV2>
    );
  }

  return (
    <OnboardingShellV2 currentId="user">
      <StepHeaderV2
        eyebrow="Étape 2 sur 9"
        title="Et vous, qui êtes-vous ?"
        subtitle="Votre profil personnel sert à la signature des documents et à la sécurité du compte."
      />

      <Form
        schema={formSchema}
        onSubmit={onSubmit}
        defaultValues={{
          firstName: defaults.firstName ?? '',
          lastName: defaults.lastName ?? '',
          role: defaults.role ?? 'gerant',
          language: defaults.language ?? 'fr-af',
        }}
        className="flex flex-1 flex-col gap-4"
      >
        {(methods) => (
          <>
            <FieldRow>
              <FieldGrid cols={2}>
                <FormField
                  name="firstName"
                  required
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Amina" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="lastName"
                  required
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Yao" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldGrid>

              {/* Téléphone — read-only, statut Vérifié si OTP déjà fait au signup */}
              {phoneInfo ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-terre-700 text-[13px] font-medium">
                    Téléphone professionnel
                  </span>
                  <div className="border-input bg-card flex items-center justify-between rounded-md border px-3 py-2.5">
                    <span className="text-terre-900 inline-flex items-center gap-2 text-sm">
                      <Phone className="text-terre-500 h-4 w-4" />
                      {phoneInfo.number}
                    </span>
                    {phoneInfo.verified ? (
                      <span className="bg-palmeraie-50 text-palmeraie-800 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        Vérifié
                      </span>
                    ) : (
                      <span className="bg-terre-100 text-terre-600 rounded-full px-2 py-0.5 text-[11px] font-medium">
                        À vérifier
                      </span>
                    )}
                  </div>
                  <p className="text-terre-500 text-[11px]">
                    Modifiable depuis vos paramètres après l'onboarding.
                  </p>
                </div>
              ) : null}

              <FormField
                name="role"
                required
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Votre rôle dans l'entreprise</FormLabel>
                    <FormControl>
                      <RadioCardGrid
                        name="role"
                        cols={2}
                        options={ROLE_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FieldRow>

            {serverError ? <p className="text-brique-700 text-sm">{serverError}</p> : null}

            <StepActions
              onBack={() => void navigate({ to: '/onboarding/company' })}
              primaryType="submit"
              primaryLoading={methods.formState.isSubmitting}
            />
          </>
        )}
      </Form>
    </OnboardingShellV2>
  );
}
