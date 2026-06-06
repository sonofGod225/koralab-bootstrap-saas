/**
 * Helpers visuels partagés par les 6 pages /settings/* (Story 3.17).
 *
 * Traduit le langage visuel du bundle Claude Design `__PROJECT_NAME__ shadcn Canvas`
 * (cf. `settings-shell.jsx` lignes 84-280) en Tailwind/React :
 *
 *  - [[SettingsPageHeader]] : breadcrumbs + eyebrow + h1 Fraunces (28→34→40px
 *    responsive) avec un fragment italique soleil + subtitle + slot actions.
 *    Sous lg, ajoute un bouton hamburger qui ouvre la [[SettingsNav]] dans un
 *    `<Sheet side="left">` (la sidebar settings est masquée sous lg par le
 *    `AppShell` — sans ce drawer, l'utilisateur mobile ne peut pas changer
 *    de sous-section).
 *  - [[SectionCard]] : card radius 20px shadow-xs avec header optionnel
 *    (title + description + action) + body padding responsive (la prop
 *    `padding` mappe vers des classes Tailwind, pas du style inline).
 *  - [[FormRow]] : ligne de form avec label + helper + colspan
 *  - [[SaveSuccessBanner]] : bandeau palmeraie "Modifications enregistrées"
 */
import { ChevronRight, Check, Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Sheet, SheetContent, SheetTitle } from '@__SCOPE__/ui/sheet';
import { SettingsNav, settingsCrumbHref } from './settings-nav';

/* ─── SettingsPageHeader ────────────────────────────────────────────────── */

export interface SettingsPageHeaderProps {
  /** Fil d'ariane — ex: `['Paramètres', 'Organisation', 'Profil']`. */
  breadcrumbs?: string[];
  /** Surtitre 11px uppercase tracking-[1.4px] terre-500. */
  eyebrow?: string;
  /** Titre principal — texte normal. */
  title: ReactNode;
  /** Fragment italique soleil ajouté au titre (ex: "qui vous représente."). */
  italic?: string;
  /** Sous-titre 14px terre-600, max-w 640. */
  subtitle?: ReactNode;
  /** Slot boutons en haut à droite. */
  actions?: ReactNode;
  /**
   * Navigation ouverte par le hamburger `<lg`. Reçoit un `close` pour fermer le drawer.
   * - `undefined` (défaut) → `SettingsNav` (espace Paramètres) ;
   * - une fonction → nav contextuelle custom (ex. Contacts/Catalogue) ;
   * - `null` → masque le hamburger (aucune nav latérale mobile).
   */
  mobileNav?: ((close: () => void) => ReactNode) | null;
}

export function SettingsPageHeader({
  breadcrumbs,
  eyebrow,
  title,
  italic,
  subtitle,
  actions,
  mobileNav,
}: SettingsPageHeaderProps) {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // undefined → SettingsNav par défaut ; fonction → nav custom ; null → pas de hamburger.
  const renderNav =
    mobileNav === undefined ? (close: () => void) => <SettingsNav onNavigate={close} /> : mobileNav;

  return (
    <header className="mb-5 sm:mb-7">
      {/* Ligne hamburger + breadcrumbs — hamburger visible <lg uniquement.
          Le drawer remplace la sidebar settings que `AppShell` masque sous lg. */}
      <div className="mb-3.5 flex items-center gap-2">
        {renderNav ? (
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Ouvrir la navigation"
              className="border-border text-terre-700 hover:bg-terre-100 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border transition-colors lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <SheetContent
              side="left"
              className="w-[300px] max-w-[85vw] rounded-none p-0 sm:max-w-[300px] [&>aside]:w-full [&>aside]:border-r-0"
            >
              {/* Accessibilité Radix : un titre est requis dans SheetContent. */}
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {renderNav(() => setNavOpen(false))}
            </SheetContent>
          </Sheet>
        ) : null}

        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav
            aria-label="Fil d'ariane"
            className="text-terre-500 flex flex-1 items-center gap-1.5 overflow-x-auto text-xs whitespace-nowrap"
          >
            {breadcrumbs.map((b, i) => {
              const isLast = i === breadcrumbs.length - 1;
              // Crumb cliquable : route résolue (via la nav), différente de la page courante.
              const href = isLast
                ? undefined
                : settingsCrumbHref(b, i > 0 ? breadcrumbs[i - 1] : undefined);
              const clickable = href != null && href !== pathname;
              return (
                <span key={`${b}-${i}`} className="inline-flex items-center gap-1.5">
                  {i > 0 ? <ChevronRight className="text-terre-400 h-3 w-3" /> : null}
                  {clickable ? (
                    <button
                      type="button"
                      onClick={() => void navigate({ to: href })}
                      className="text-terre-500 hover:text-terre-800 cursor-pointer font-normal underline-offset-2 transition-colors hover:underline"
                    >
                      {b}
                    </button>
                  ) : (
                    <span
                      className={
                        isLast ? 'text-terre-800 font-medium' : 'text-terre-500 font-normal'
                      }
                    >
                      {b}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="text-terre-500 mb-2.5 text-[11px] font-semibold tracking-[1.4px] uppercase">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="font-display text-terre-900 m-0 max-w-[640px] text-[28px] leading-[1.1] font-light tracking-[-1px] sm:text-[34px] sm:leading-[1.08] sm:tracking-[-1.2px] lg:text-[40px] lg:leading-[1.05] lg:tracking-[-1.5px]">
            {title}
            {italic ? (
              <>
                {' '}
                <em className="font-display text-soleil-600 font-normal italic">{italic}</em>
              </>
            ) : null}
          </h1>
          {subtitle ? (
            <p className="text-terre-600 mt-3 max-w-[640px] text-sm">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

/* ─── SectionCard ───────────────────────────────────────────────────────── */

export interface SectionCardProps {
  /** Titre de la card (Fraunces 18px). */
  title?: string;
  /** Description sous le titre (14px terre-600, max-w 540). */
  description?: string;
  /** Slot bouton/action dans le header de la card. */
  action?: ReactNode;
  /**
   * Padding intérieur. Mappé vers des classes Tailwind responsive :
   *  - `24` (défaut) → `p-4 sm:p-5 md:p-6`
   *  - `20`          → `p-3 sm:p-4 md:p-5`
   *  - `0`           → `p-0` (utile pour wrapper une table sans padding)
   *
   * Toute autre valeur est ramenée au mapping le plus proche.
   */
  padding?: number;
  /** Classes additionnelles sur le `<section>`. */
  className?: string;
  children: ReactNode;
}

/** Mapping prop `padding` (number) → classes Tailwind responsive (body). */
function bodyPaddingClass(padding: number, hasHeader: boolean): string {
  if (padding === 0) return 'p-0';
  if (padding <= 20)
    return hasHeader ? 'px-3 pb-3 pt-3 sm:px-4 sm:pb-4 md:px-5 md:pb-5' : 'p-3 sm:p-4 md:p-5';
  // 24 par défaut
  return hasHeader ? 'px-4 pb-4 pt-3 sm:px-5 sm:pb-5 md:px-6 md:pb-6' : 'p-4 sm:p-5 md:p-6';
}

/** Mapping prop `padding` (number) → classes Tailwind responsive (header). */
function headerPaddingClass(padding: number, hasDescription: boolean): string {
  if (padding === 0) return 'p-0';
  const bottom = hasDescription ? 'pb-3' : 'pb-0';
  if (padding <= 20) return `px-3 pt-3 ${bottom} sm:px-4 sm:pt-4 md:px-5 md:pt-5`;
  return `px-4 pt-4 ${bottom} sm:px-5 sm:pt-5 md:px-6 md:pt-6`;
}

export function SectionCard({
  title,
  description,
  action,
  padding = 24,
  className,
  children,
}: SectionCardProps) {
  const hasHeader = Boolean(title || description || action);
  return (
    <section
      className={`bg-card border-border overflow-hidden rounded-[20px] border shadow-xs ${className ?? ''}`}
    >
      {hasHeader ? (
        <header
          className={`flex items-start justify-between gap-3 sm:gap-4 ${headerPaddingClass(padding, Boolean(description))}`}
        >
          <div className="min-w-0">
            {title ? (
              <h3 className="font-display text-terre-900 m-0 text-[16px] font-medium tracking-[-0.4px] sm:text-[18px]">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="text-terre-600 mt-1.5 max-w-[540px] text-[12px] leading-[1.5] sm:text-[13px]">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
        </header>
      ) : null}
      <div className={bodyPaddingClass(padding, hasHeader)}>{children}</div>
    </section>
  );
}

/* ─── FormRow ───────────────────────────────────────────────────────────── */

export interface FormRowProps {
  /** Label affiché au-dessus du champ. */
  label: string;
  /** Texte d'aide sous le champ (11px terre-500). */
  helper?: string;
  /** Étoile rouge à côté du label. */
  required?: boolean;
  /** Largeur en colonnes du parent grid (1 ou 2). Défaut 1. */
  span?: 1 | 2;
  children: ReactNode;
}

export function FormRow({ label, helper, required, span = 1, children }: FormRowProps) {
  const colSpan = span === 2 ? 'md:col-span-2' : '';
  return (
    <div className={`flex flex-col gap-1.5 ${colSpan}`}>
      <label className="text-terre-700 inline-flex items-center gap-1 text-[13px] font-medium">
        {label}
        {required ? <span className="text-brique-600">*</span> : null}
      </label>
      {children}
      {helper ? <p className="text-terre-500 text-[11px] leading-[1.4]">{helper}</p> : null}
    </div>
  );
}

/* ─── SaveSuccessBanner ─────────────────────────────────────────────────── */

export interface SaveSuccessBannerProps {
  message?: ReactNode;
  whenAgo?: string;
}

export function SaveSuccessBanner({
  message = (
    <>
      <strong>Modifications enregistrées.</strong>{' '}
      <span className="text-palmeraie-600">Visibles immédiatement.</span>
    </>
  ),
  whenAgo,
}: SaveSuccessBannerProps) {
  return (
    <div className="border-palmeraie-200 bg-palmeraie-50 mb-4 flex items-center gap-3 rounded-xl border px-4 py-3">
      <span className="bg-palmeraie-400 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <div className="text-palmeraie-800 flex-1 text-[13px]">{message}</div>
      {whenAgo ? <span className="text-palmeraie-600 font-mono text-[11px]">{whenAgo}</span> : null}
    </div>
  );
}
