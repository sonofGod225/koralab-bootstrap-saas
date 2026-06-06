/**
 * /onboarding/consent — Step 3 du wizard V2 (**jalon obligatoire final**).
 *
 * 4 consentements légaux : CGU OHADA, KYC rétroactif, CDP/ARTCI (obligatoires),
 * et Assistance IA (facultative). À la soumission :
 *  - 1 row inséré dans `consent_log` par checkbox cochée (PII hashée)
 *  - `onboarding_progress.completed_obligatory_at`/`completed_at` est marqué →
 *    **débloque l'app** via le middleware `requireOnboardingCompleted` (Story 7.2)
 *  - la souscription Free est bootstrappée côté serveur
 *
 * C'est le dernier écran du wizard : la soumission redirige directement vers
 * `/dashboard`. Le plan, les modules, l'équipe, les préférences et le 2FA se
 * configurent en post-onboarding dans `/settings/*`.
 *
 * Design : `epic-onboarding/project/app/onboarding-v2-steps.jsx` lignes ~745-840.
 *
 * Garde d'accès : `getSession` nul → `/signin`.
 */
import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Check, FileText, IdCard, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  OnboardingShellV2,
  StepActions,
  StepHeaderV2,
  OnboardingStepSkeleton,
} from '../../components/onboarding-shell';
import { authClient } from '../../lib/auth-client';
import { trpc } from '../../lib/trpc-client';

export const Route = createFileRoute('/onboarding/consent')({ component: ConsentStep });

interface ConsentItem {
  id: 'cgu' | 'kyc' | 'cdp' | 'ai';
  icon: LucideIcon;
  title: string;
  body: string;
  linkLabel: string;
  linkHref: string;
  required: boolean;
}

const ITEMS: ConsentItem[] = [
  {
    id: 'cgu',
    icon: FileText,
    title: "Conditions générales d'utilisation OHADA",
    body: 'En acceptant, vous adhérez aux CGU de __PROJECT_NAME__, conformes au droit commercial OHADA. Le contrat reste résiliable à tout moment.',
    linkLabel: 'Lire les CGU complètes',
    linkHref: '/legal/cgu',
    required: true,
  },
  {
    id: 'kyc',
    icon: IdCard,
    title: 'Procédure KYC rétroactive',
    body: "Conformément à la réglementation, __PROJECT_NAME__ pourra demander des justificatifs (pièce d'identité, RCCM, attestation fiscale) avant d'atteindre certains seuils d'encaissement.",
    linkLabel: 'Comprendre la procédure KYC',
    linkHref: '/legal/kyc',
    required: true,
  },
  {
    id: 'cdp',
    icon: ShieldCheck,
    title: 'Traitement de vos données (CDP / ARTCI)',
    body: "Vos données sont stockées en Europe et traitées conformément aux exigences de la CDP Sénégal et de l'ARTCI Côte d'Ivoire. Vous pouvez les exporter ou les supprimer à tout moment.",
    linkLabel: 'Politique de confidentialité',
    linkHref: '/legal/privacy',
    required: true,
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: 'Assistance IA dans le produit',
    body: "__PROJECT_NAME__ utilise des modèles d'IA (Anthropic, OpenAI) pour vous assister. Vos données métier ne servent pas à entraîner ces modèles (zero data retention contractuel).",
    linkLabel: "En savoir plus sur l'usage de l'IA",
    linkHref: '/legal/ai',
    required: false,
  },
];

type Phase = 'loading' | 'ready' | 'no-org';

function ConsentStep() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [checks, setChecks] = useState<Record<ConsentItem['id'], boolean>>({
    cgu: false,
    kyc: false,
    cdp: false,
    ai: false,
  });
  const [submitting, setSubmitting] = useState(false);
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
      setPhase('ready');
    })();
  }, []);

  function toggle(id: ConsentItem['id']) {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const allRequired = checks.cgu && checks.kyc && checks.cdp;

  async function onSubmit() {
    if (!allRequired) {
      setServerError('Vous devez accepter les 3 consentements obligatoires pour continuer.');
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      await trpc.onboarding.completeConsent.mutate({
        cgu: true,
        kyc: true,
        cdp: true,
        ai: checks.ai,
        version: 'v1',
      });
      // Dernier écran du wizard : l'onboarding est terminé → dashboard.
      void navigate({ to: '/dashboard' });
    } catch (err) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : "Erreur d'enregistrement.";
      setServerError(msg);
    }
  }

  if (phase === 'loading') {
    return <OnboardingStepSkeleton currentId="consent" />;
  }
  if (phase === 'no-org') {
    return (
      <OnboardingShellV2 currentId="consent">
        <StepHeaderV2
          title="Aucune organisation active"
          subtitle="Votre compte n'est rattaché à aucune organisation."
        />
      </OnboardingShellV2>
    );
  }

  return (
    <OnboardingShellV2 currentId="consent">
      <StepHeaderV2
        eyebrow="Étape 8 sur 9"
        title="Conformité & vos accords"
        subtitle="__PROJECT_NAME__ est conforme OHADA, ARTCI et CDP Sénégal. Confirmez votre accord pour finaliser votre compte."
      />

      <div className="bg-terre-50 border-border overflow-hidden rounded-2xl border">
        {ITEMS.map((c, i) => {
          const checked = checks[c.id];
          const Icon = c.icon;
          return (
            <label
              key={c.id}
              className={`flex cursor-pointer items-start gap-3.5 px-5 py-4 transition-colors ${
                checked ? 'bg-soleil-50/40' : ''
              } ${i < ITEMS.length - 1 ? 'border-border border-b' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(c.id)}
                className="sr-only"
              />
              {/* Faux-checkbox visuel */}
              <span
                className={`mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] transition-colors ${
                  checked ? 'bg-terre-900 border-transparent' : 'bg-card border-border border'
                }`}
                aria-hidden
              >
                {checked ? <Check className="h-3 w-3 text-[#F4E4CC]" strokeWidth={2.5} /> : null}
              </span>
              <span className="bg-soleil-50 text-soleil-700 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Icon className="h-[15px] w-[15px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-display text-terre-900 text-[15px] font-medium tracking-tight">
                    {c.title}
                  </span>
                  {c.required ? (
                    <span className="text-brique-600 text-[10px] font-medium tracking-wide">
                      · Obligatoire
                    </span>
                  ) : (
                    <span className="text-terre-500 text-[10px] font-medium tracking-wide">
                      · Facultatif
                    </span>
                  )}
                </div>
                <div className="text-terre-600 text-xs leading-relaxed">{c.body}</div>
                <a
                  href={c.linkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-soleil-700 mt-1.5 inline-block text-xs font-medium underline underline-offset-2"
                >
                  {c.linkLabel} →
                </a>
              </div>
            </label>
          );
        })}
      </div>

      {serverError ? <p className="text-brique-700 text-sm">{serverError}</p> : null}

      <StepActions
        onBack={() => void navigate({ to: '/onboarding/user' })}
        primaryLabel="Accepter et finaliser"
        primaryDisabled={!allRequired}
        primaryLoading={submitting}
        onPrimary={onSubmit}
      />
    </OnboardingShellV2>
  );
}
