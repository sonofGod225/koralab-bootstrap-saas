/**
 * /onboarding/company — Step 1 du wizard V2 (Story 7.3).
 *
 * Profil entreprise : raison sociale, sigle, pays, NINEA/RCCM, secteur,
 * taille, adresse, ville, NIF optionnel. À la soumission, appelle
 * `trpc.onboarding.completeCompany` puis redirige vers `/onboarding/user`
 * (Step 2 — pas encore livré, redirige vers `/dashboard` en attendant).
 *
 * Garde d'accès : `getSession` nul → `/signin`. Pas d'organisation active
 * → message d'erreur (cas marginal — la session est censée être bootstrappée
 * avec une org à l'inscription).
 *
 * Design : `epic-onboarding/project/app/onboarding-v2-steps.jsx` lignes 11-88.
 */
import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod/v4';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@__SCOPE__/ui/form';
import { Input } from '@__SCOPE__/ui/input';
import { LogoUpload } from '../../components/logo-upload';
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
import {
  legalIdHelper,
  legalIdMeta,
  SECTOR_OPTIONS,
  SIZE_OPTIONS,
} from '../../lib/org-enums-labels';
import { trpc } from '../../lib/trpc-client';

export const Route = createFileRoute('/onboarding/company')({ component: CompanyStep });

/* ─── Schéma + options (cohérents avec le router tRPC) ──────────────────── */

/**
 * Pays exposés à l'onboarding (sous-ensemble du catalogue complet
 * `COUNTRY_OPTIONS` partagé — onboarding cible UEMOA core, settings expose tout).
 */
const COUNTRY_OPTIONS = [
  { value: 'SN', label: '🇸🇳 Sénégal' },
  { value: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'TG', label: '🇹🇬 Togo' },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'ML', label: '🇲🇱 Mali' },
] as const;

/**
 * Schéma form — strict côté UI (Zod). Le router tRPC re-valide côté serveur
 * avec le même contrat.
 */
const formSchema = z.object({
  legalName: z.string().trim().min(2, 'Raison sociale requise (2 caractères minimum).'),
  tradeName: z.string().trim().max(80).optional().or(z.literal('')),
  country: z.enum(['SN', 'CI', 'BJ', 'TG', 'BF', 'ML']),
  legalId: z.string().trim().min(5, 'NINEA ou RCCM requis (5 caractères minimum).').max(80),
  sector: z.enum(['commerce', 'services', 'distribution', 'resto', 'artisanat', 'tech']),
  size: z.enum(['tpe', 'pme-growth', 'pme-struct']),
  address: z.string().trim().min(3, 'Adresse requise.').max(200),
  city: z.string().trim().min(2, 'Ville requise.').max(80),
});
type FormValues = z.infer<typeof formSchema>;

/* ─── Page ──────────────────────────────────────────────────────────────── */

type Phase = 'loading' | 'ready' | 'no-org';

function CompanyStep() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [defaults, setDefaults] = useState<Partial<FormValues>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Bootstrap : session + état onboarding pré-rempli (idempotence).
  useEffect(() => {
    void (async () => {
      const session = await authClient.getSession();
      if (!session.data) {
        window.location.assign('/signin');
        return;
      }
      if (!session.data.session.activeOrganizationId) {
        // Garde-fou : certains flows d'auto-signin (emailOTP.verifyEmail) créent
        // une session sans peupler activeOrganizationId. Si l'utilisateur a au
        // moins une org en DB, on bascule dessus et on recharge — sinon on
        // affiche le message d'erreur (cas pathologique : user orphelin).
        try {
          const { data: orgs } = await authClient.organization.list();
          const first = orgs?.[0];
          if (first?.id) {
            await authClient.organization.setActive({ organizationId: first.id });
            window.location.reload();
            return;
          }
        } catch {
          /* tombe en 'no-org' ci-dessous */
        }
        setPhase('no-org');
        return;
      }
      try {
        const existing = await trpc.onboarding.get.query();
        const prevCompany = (existing?.data as { company?: Partial<FormValues> } | null)?.company;
        if (prevCompany) setDefaults(prevCompany);
      } catch {
        // Si `get` échoue (org sans onboarding_progress), on continue avec un form vide.
      }
      // Logo déjà uploadé (retour sur l'étape) : on l'affiche depuis l'org.
      try {
        const org = await trpc.organization.get.query();
        if (org.logo) setLogoUrl(org.logo);
      } catch {
        // pas de logo / org non lisible — on continue
      }
      setPhase('ready');
    })();
  }, []);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await trpc.onboarding.completeCompany.mutate({
        legalName: values.legalName,
        tradeName: values.tradeName?.trim() ? values.tradeName.trim() : undefined,
        country: values.country,
        legalId: values.legalId,
        sector: values.sector,
        size: values.size,
        address: values.address,
        city: values.city,
      });
      void navigate({ to: '/onboarding/user' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur d'enregistrement.";
      setServerError(msg);
    }
  }

  if (phase === 'loading') {
    return <OnboardingStepSkeleton currentId="company" />;
  }

  if (phase === 'no-org') {
    return (
      <OnboardingShellV2 currentId="company">
        <StepHeaderV2
          title="Aucune organisation active"
          subtitle="Votre compte n'est rattaché à aucune organisation. Reconnectez-vous ou contactez le support."
        />
      </OnboardingShellV2>
    );
  }

  return (
    <OnboardingShellV2 currentId="company">
      <StepHeaderV2
        eyebrow="Étape 1 sur 9"
        title="Présentez-nous votre entreprise"
        subtitle="Ces informations alimenteront vos factures, devis et déclarations. Elles restent modifiables à tout moment."
      />

      <Form
        schema={formSchema}
        onSubmit={onSubmit}
        defaultValues={{
          legalName: defaults.legalName ?? '',
          tradeName: defaults.tradeName ?? '',
          country: defaults.country ?? 'SN',
          legalId: defaults.legalId ?? '',
          sector: defaults.sector ?? 'commerce',
          size: defaults.size ?? 'pme-growth',
          address: defaults.address ?? '',
          city: defaults.city ?? '',
        }}
        className="flex flex-1 flex-col gap-4"
      >
        {(methods) => {
          const country = methods.watch('country');
          const idMeta = legalIdMeta(country);
          return (
            <>
              <FieldRow>
                {/* Logo de l'entreprise — composant partagé (aperçu local + upload R2). */}
                <LogoUpload
                  initialUrl={logoUrl}
                  fallbackInitial={methods.watch('legalName').charAt(0) || 'E'}
                  onUploaded={setLogoUrl}
                />

                <FieldGrid cols={2}>
                  <FormField
                    name="legalName"
                    required
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Raison sociale</FormLabel>
                        <FormControl>
                          <Input placeholder="Distribution YK SARL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="tradeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sigle commercial</FormLabel>
                        <FormControl>
                          <Input placeholder="Distribution YK" {...field} />
                        </FormControl>
                        <p className="text-base-500 text-[11px]">Apparaît sur les factures.</p>
                      </FormItem>
                    )}
                  />
                </FieldGrid>

                <FieldGrid cols={2}>
                  <FormField
                    name="country"
                    required
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="border-input bg-card h-10 w-full rounded-md border px-3 text-sm"
                          >
                            {COUNTRY_OPTIONS.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="legalId"
                    required
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{idMeta.label}</FormLabel>
                        <FormControl>
                          <Input placeholder={idMeta.placeholder} {...field} />
                        </FormControl>
                        <p className="text-base-500 text-[11px]">{legalIdHelper(country)}</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FieldGrid>

                <FormField
                  name="sector"
                  required
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secteur d'activité</FormLabel>
                      <FormControl>
                        <RadioCardGrid
                          name="sector"
                          cols={3}
                          compact
                          options={SECTOR_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="size"
                  required
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taille de l'entreprise</FormLabel>
                      <FormControl>
                        <RadioCardGrid
                          name="size"
                          cols={3}
                          options={SIZE_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FieldGrid cols={2}>
                  <FormField
                    name="address"
                    required
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="Rue des Jardins, Cocody" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="city"
                    required
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Abidjan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FieldGrid>
              </FieldRow>

              {serverError ? <p className="text-danger-700 text-sm">{serverError}</p> : null}

              <StepActions primaryType="submit" primaryLoading={methods.formState.isSubmitting} />
            </>
          );
        }}
      </Form>
    </OnboardingShellV2>
  );
}
