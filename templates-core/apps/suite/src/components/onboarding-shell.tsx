/**
 * Onboarding V2 shell + helpers UI (Story 7.3+, Epic 7).
 *
 * Traduit le design bundle `epic-onboarding/project/app/onboarding-v2.jsx` en
 * Tailwind + tokens __PROJECT_NAME__. Réutilisé par les 9 routes `/onboarding/*`.
 *
 * Le shell V2 utilise une **sidebar verticale groupée en 4 sections** (au
 * lieu d'un stepper horizontal numéroté). Les sections affichent un check
 * une fois validées, les steps en cours montrent leur dot. Sur mobile, un
 * `MobileIndicator` compact remplace la sidebar.
 *
 * Exports :
 * - [[OnboardingShellV2]] — layout pleine page (sidebar + contenu)
 * - [[StepHeaderV2]] — eyebrow + titre Fraunces + subtitle
 * - [[StepActions]] — barre de boutons retour / continuer / skip
 * - [[FieldGrid]], [[FieldRow]] — layout de form
 * - [[RadioCardGrid]] — grille de cards radio (avec icône + description optionnelles)
 * - [[SegmentedControl]] — toggle horizontal pill (langue, cycle mensuel/annuel)
 * - [[ONBOARDING_SECTIONS]] — définition unique des 4 sections × 9 steps,
 *   alignée sur le bundle V2.
 */
import { useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Building, Check, ChevronDown, Flag, ArrowLeft, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@__SCOPE__/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@__SCOPE__/ui/dropdown-menu';
import { Skeleton } from '@__SCOPE__/ui/skeleton';
import { Topbar } from '@__SCOPE__/ui/topbar';
import { authClient } from '../lib/auth-client';
import { __PROJECT_NAME__Logo } from './__PROJECT_SLUG__-logo';

/* ─── Définition des 2 sections × 3 steps (flow simplifié) ──────────────── */

/** Identifiant nominal de step — sert d'`id` de route (`/onboarding/<id>`). */
export type OnboardingStepId = 'company' | 'user' | 'consent';

export interface OnboardingStepDef {
  id: OnboardingStepId;
  label: string;
  optional?: boolean;
}

export interface OnboardingSectionDef {
  id: 'identity' | 'done';
  title: string;
  icon: LucideIcon;
  steps: OnboardingStepDef[];
}

export const ONBOARDING_SECTIONS: OnboardingSectionDef[] = [
  {
    id: 'identity',
    title: 'Vous & votre entreprise',
    icon: Building,
    steps: [
      { id: 'company', label: 'Profil entreprise' },
      { id: 'user', label: 'Votre profil' },
    ],
  },
  {
    id: 'done',
    title: 'Finalisation',
    icon: Flag,
    steps: [{ id: 'consent', label: 'Conformité & CGU' }],
  },
];

/** Liste plate de tous les steps, pour calculer l'index courant. */
const STEPS_FLAT = ONBOARDING_SECTIONS.flatMap((s) => s.steps);
const TOTAL_STEPS = STEPS_FLAT.length;

const stepIndexById = (id: OnboardingStepId): number => STEPS_FLAT.findIndex((s) => s.id === id);

/* ─── Sidebar (desktop) ─────────────────────────────────────────────────── */

function SidebarIndicator({ currentId }: { currentId: OnboardingStepId }) {
  const currentIdx = stepIndexById(currentId);
  return (
    <aside className="bg-base-25 border-border flex h-full w-[280px] flex-col gap-6 border-r px-6 py-8">
      <__PROJECT_NAME__Logo size={32} />

      {/* Progression globale */}
      <div className="flex flex-col gap-2">
        <div className="text-base-500 text-[11px] font-medium tracking-[1.4px] uppercase">
          Configuration · {currentIdx + 1} sur {TOTAL_STEPS}
        </div>
        <div className="bg-base-100 h-1 overflow-hidden rounded-full">
          <div
            className="bg-brand-400 h-full transition-[width] duration-200 ease-out"
            style={{ width: `${((currentIdx + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <nav className="mt-1 flex flex-col gap-[22px]">
        {ONBOARDING_SECTIONS.map((sec) => {
          const stepStart = STEPS_FLAT.findIndex((s) => s.id === sec.steps[0]?.id);
          const stepEnd = stepStart + sec.steps.length - 1;
          const sectionState =
            currentIdx > stepEnd ? 'done' : currentIdx >= stepStart ? 'active' : 'upcoming';
          const Icon = sec.icon;
          return (
            <div key={sec.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg ${
                    sectionState === 'done'
                      ? 'bg-brand-400 text-base-900'
                      : sectionState === 'active'
                        ? 'bg-base-900 text-base-100'
                        : 'bg-base-100 text-base-500'
                  }`}
                >
                  {sectionState === 'done' ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-[13px] w-[13px]" />
                  )}
                </span>
                <span
                  className={`text-[13px] font-semibold tracking-tight ${
                    sectionState === 'upcoming' ? 'text-base-500' : 'text-base-900'
                  }`}
                >
                  {sec.title}
                </span>
              </div>

              {/* Dots des steps — visibles pour les sections actives ou terminées */}
              {(sectionState === 'active' || sectionState === 'done') && (
                <ul className="mt-1 ml-9 flex list-none flex-col gap-2 p-0">
                  {sec.steps.map((st, sti) => {
                    const absIdx = stepStart + sti;
                    const stState =
                      absIdx < currentIdx ? 'done' : absIdx === currentIdx ? 'current' : 'upcoming';
                    return (
                      <li
                        key={st.id}
                        className={`flex items-center gap-2.5 text-xs leading-tight ${
                          stState === 'current'
                            ? 'text-base-900 font-medium'
                            : stState === 'done'
                              ? 'text-base-600'
                              : 'text-base-400'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            stState === 'done'
                              ? 'bg-brand-400'
                              : stState === 'current'
                                ? 'bg-base-900'
                                : 'border-border bg-transparent ring-1 ring-current/30 ring-inset'
                          }`}
                        />
                        <span>{st.label}</span>
                        {st.optional && stState !== 'done' && (
                          <span className="text-base-400 ml-auto text-[10px]">facultatif</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

/* ─── Indicator mobile compact ──────────────────────────────────────────── */

function MobileIndicator({ currentId }: { currentId: OnboardingStepId }) {
  const currentIdx = stepIndexById(currentId);
  const cur = STEPS_FLAT[currentIdx];
  const sectionForCur = ONBOARDING_SECTIONS.find((s) => s.steps.some((st) => st.id === cur?.id));
  return (
    <div className="bg-base-25 border-border sticky top-0 z-10 flex flex-col gap-2.5 border-b px-5 pt-3.5 pb-4">
      <div className="flex items-center justify-between">
        <__PROJECT_NAME__Logo size={28} />
        <span className="text-base-600 font-mono text-[11px] font-medium tabular-nums">
          {currentIdx + 1} / {TOTAL_STEPS}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="text-brand-700 text-[10px] font-medium tracking-[1.3px] uppercase">
          {sectionForCur?.title}
        </div>
        <div className="text-base-900 font-display text-[18px] leading-tight font-normal tracking-tight">
          {cur?.label}
        </div>
      </div>
      <div className="flex gap-1">
        {STEPS_FLAT.map((s, i) => (
          <span
            key={s.id}
            className={`h-[3px] flex-1 rounded-full transition-colors ${
              i <= currentIdx ? 'bg-brand-400' : 'bg-base-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Shell ─────────────────────────────────────────────────────────────── */

/* ─── Topbar (profil + déconnexion) ─────────────────────────────────────── */

function OnboardingTopbar() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await authClient.getSession();
      if (session.data) {
        setUser({ name: session.data.user.name, email: session.data.user.email });
      }
    })();
  }, []);

  async function signOut() {
    await authClient.signOut();
    window.location.assign('/signin');
  }

  return (
    <Topbar
      className="justify-end"
      end={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="border-border bg-card hover:bg-subtle flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 transition-colors"
              aria-label="Menu utilisateur"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold">
                  {user?.name.charAt(0).toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-base-900 hidden max-w-[140px] truncate text-sm font-medium sm:block">
                {user?.name ?? '…'}
              </span>
              <ChevronDown className="text-base-500 h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block">{user?.name}</span>
              <span className="text-muted-foreground block text-xs font-normal">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut()}>Se déconnecter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  );
}

export function OnboardingShellV2({
  currentId,
  children,
  contentWidth = 'default',
}: {
  currentId: OnboardingStepId;
  children: ReactNode;
  contentWidth?: 'default' | 'wide';
}) {
  const maxW = contentWidth === 'wide' ? 'max-w-5xl' : 'max-w-3xl';
  return (
    <div className="bg-background flex h-dvh w-full overflow-hidden font-sans">
      {/* Mobile : topbar + indicateur + contenu en colonne */}
      <div className="flex w-full flex-col overflow-hidden md:hidden">
        <OnboardingTopbar />
        <MobileIndicator currentId={currentId} />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-5 pt-5 pb-24">
          {children}
        </div>
      </div>

      {/* Desktop : sidebar pleine hauteur (gauche) + [topbar au-dessus du contenu] (droite) */}
      <div className="hidden h-full w-full md:flex">
        <SidebarIndicator currentId={currentId} />
        <div className="flex min-h-0 flex-1 flex-col">
          <OnboardingTopbar />
          <div className="flex-1 overflow-auto bg-white px-16 pt-12 pb-0">
            <div
              key={currentId}
              className={`animate-in fade-in slide-in-from-bottom-1 mx-auto flex min-h-full ${maxW} flex-col gap-6 duration-300 ease-out [&_input:not([type='radio']):not([type='checkbox']):not([type='hidden'])]:h-[46px] [&_select]:h-[46px]`}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── StepHeader ────────────────────────────────────────────────────────── */

export function StepHeaderV2({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow ? (
        <span className="text-brand-700 hidden text-[11px] font-medium tracking-[1.4px] uppercase md:inline">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="font-display text-base-900 max-w-[560px] text-[26px] leading-[1.05] font-light tracking-tight text-pretty md:text-[34px]">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-base-600 max-w-[540px] text-[13px] leading-relaxed text-pretty md:text-sm">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/* ─── StepActions ───────────────────────────────────────────────────────── */

export function StepActions({
  onBack,
  onSkip,
  skipLabel,
  primaryLabel = 'Continuer',
  primaryDisabled,
  primaryLoading,
  onPrimary,
  primaryType = 'button',
}: {
  /** Si fourni, affiche le bouton Retour. Sinon, espace vide. */
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  /** Pour les CTA déclenchés hors-form ; ignoré si `primaryType='submit'`. */
  onPrimary?: () => void;
  primaryType?: 'button' | 'submit';
}) {
  return (
    <div className="border-border fixed inset-x-0 bottom-0 z-20 mt-auto flex flex-wrap items-center justify-between gap-3 border-t bg-white px-5 pt-4 pb-6 md:sticky md:inset-x-auto md:px-0">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-base-700 hover:text-base-900 inline-flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        {onSkip && skipLabel ? (
          <button
            type="button"
            onClick={onSkip}
            className="text-base-600 hover:text-base-900 px-2 text-sm font-medium"
          >
            {skipLabel}
          </button>
        ) : null}
        <button
          type={primaryType}
          onClick={primaryType === 'button' ? onPrimary : undefined}
          disabled={primaryDisabled || primaryLoading}
          className="bg-base-900 hover:bg-base-800 text-base-50 inline-flex items-center gap-1.5 rounded-[10px] px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {primaryLoading ? 'Envoi…' : primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Layout helpers ────────────────────────────────────────────────────── */

export function FieldGrid({ cols = 2, children }: { cols?: 1 | 2 | 3; children: ReactNode }) {
  const gridCols = cols === 3 ? 'md:grid-cols-3' : cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';
  return <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>{children}</div>;
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

/* ─── RadioCardGrid ─────────────────────────────────────────────────────── */

export interface RadioCardOption<TValue extends string = string> {
  value: TValue;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
}

export function RadioCardGrid<TValue extends string>({
  options,
  value,
  onChange,
  name,
  cols = 2,
  compact,
}: {
  options: ReadonlyArray<RadioCardOption<TValue>>;
  value: TValue | undefined;
  onChange: (next: TValue) => void;
  name: string;
  cols?: 1 | 2 | 3;
  compact?: boolean;
}) {
  const gridCols = cols === 3 ? 'md:grid-cols-3' : cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';
  return (
    <div role="radiogroup" className={`grid grid-cols-1 gap-2.5 ${gridCols}`}>
      {options.map((opt) => {
        const sel = opt.value === value;
        const Icon = opt.icon;
        return (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border transition-all duration-150 active:scale-[0.99] ${
              compact ? 'px-3.5 py-3' : 'px-4 py-3.5'
            } ${
              sel
                ? 'bg-base-900 text-base-100 border-transparent shadow-sm'
                : 'bg-card text-base-900 border-border hover:border-base-300 hover:shadow-sm'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={sel}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {Icon ? (
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  sel ? 'text-brand-300 bg-white/10' : 'bg-brand-50 text-brand-700'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-medium ${opt.description ? 'mb-0.5' : ''}`}>
                {opt.label}
              </div>
              {opt.description ? (
                <div
                  className={`text-xs leading-snug ${sel ? 'text-base-200' : 'text-base-500'}`}
                >
                  {opt.description}
                </div>
              ) : null}
            </div>
            {/* Cercle radio visuel (le vrai input est sr-only ci-dessus). */}
            <span
              className={`mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                sel ? 'bg-brand-400' : 'border-border border bg-transparent'
              }`}
              aria-hidden
            >
              {sel ? <Check className="text-base-900 h-2.5 w-2.5" strokeWidth={3} /> : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/* ─── SegmentedControl ──────────────────────────────────────────────────── */

export interface SegmentedOption<TValue extends string = string> {
  value: TValue;
  label: string;
  badge?: string;
}

export function SegmentedControl<TValue extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: ReadonlyArray<SegmentedOption<TValue>>;
  value: TValue | undefined;
  onChange: (next: TValue) => void;
  name: string;
}) {
  return (
    <div
      role="radiogroup"
      className="bg-base-50 border-border inline-flex w-fit gap-0.5 rounded-full border p-1"
    >
      {options.map((opt) => {
        const sel = opt.value === value;
        return (
          <label
            key={opt.value}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              sel ? 'bg-background text-base-900 shadow-sm' : 'text-base-600 hover:text-base-900'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={sel}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
            {opt.badge ? (
              <span className="bg-brand-400 text-base-900 rounded-full px-1.5 py-px text-[9px] font-semibold tracking-wide">
                {opt.badge}
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}

/* ─── Skeletons d'étape ─────────────────────────────────────────────────── */

/** Champ : libellé + contrôle (+ aide optionnelle). */
export function FieldSkeleton({ withHelper }: { withHelper?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-[13px] w-24" />
      <Skeleton className="h-[46px] w-full rounded-[12px]" />
      {withHelper ? <Skeleton className="h-[11px] w-2/3" /> : null}
    </div>
  );
}

/** Paire de champs en grille 2 colonnes. */
function FieldPairSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <FieldSkeleton />
      <FieldSkeleton />
    </div>
  );
}

/** En-tête d'étape (eyebrow + titre + sous-titre). */
export function StepHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-[11px] w-28" />
      <Skeleton className="h-8 w-2/3 max-w-[560px]" />
      <Skeleton className="h-4 w-1/2 max-w-[540px]" />
    </div>
  );
}

/** Grille de cartes (RadioCardGrid / cartes pleines). */
export function CardGridSkeleton({
  count = 4,
  cols = 2,
  height = 68,
  keyPrefix,
}: {
  count?: number;
  cols?: 1 | 2 | 3;
  height?: number;
  keyPrefix: string;
}) {
  const gridCols = cols === 3 ? 'md:grid-cols-3' : cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';
  const items = Array.from({ length: count }, (_, i) => `${keyPrefix}-${i}`);
  return (
    <div className={`grid grid-cols-1 gap-2.5 ${gridCols}`}>
      {items.map((id) => (
        <Skeleton key={id} className="w-full rounded-xl" style={{ height }} />
      ))}
    </div>
  );
}

/** Barre d'actions (Retour + Continuer). */
export function StepActionsSkeleton() {
  return (
    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-10 w-32 rounded-[10px]" />
    </div>
  );
}

/**
 * Squelette de chargement dédié par étape : conserve la sidebar/stepper visible
 * et reflète la structure de l'écran cible. Remplace l'ancien « Chargement… ».
 */
export function OnboardingStepSkeleton({ currentId }: { currentId: OnboardingStepId }) {
  let body: ReactNode;
  switch (currentId) {
    case 'user':
      body = (
        <>
          <FieldPairSkeleton />
          <CardGridSkeleton keyPrefix="sk-role" count={4} cols={2} />
          <StepActionsSkeleton />
        </>
      );
      break;
    case 'consent':
      body = (
        <>
          <CardGridSkeleton keyPrefix="sk-consent" count={4} cols={1} height={72} />
          <StepActionsSkeleton />
        </>
      );
      break;
    case 'company':
    default:
      body = (
        <>
          <FieldPairSkeleton />
          <FieldPairSkeleton />
          <CardGridSkeleton keyPrefix="sk-sector" count={6} cols={3} />
          <CardGridSkeleton keyPrefix="sk-size" count={3} cols={3} />
          <FieldPairSkeleton />
          <StepActionsSkeleton />
        </>
      );
  }
  return (
    <OnboardingShellV2 currentId={currentId} contentWidth="default">
      <StepHeaderSkeleton />
      <div className="flex flex-1 flex-col gap-4">{body}</div>
    </OnboardingShellV2>
  );
}
