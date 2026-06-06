/**
 * <AppShell /> — Grille 4 zones du layout applicatif __PROJECT_NAME__.
 *
 * Structure :
 * - Topbar (60px) sur toute la largeur en haut.
 * - En dessous : rail (SidebarRail, 64px) | sidebar (Sidebar, 256px) | content (flex-1).
 * - Seule la zone content scrolle verticalement.
 *
 * Responsive :
 * - `rail` masqué sous md (768px) — le consommateur gère l'overlay (ex: MobileDrawer).
 * - `sidebar` masquée sous lg (1024px) — idem.
 *
 * Exports :
 * - `AppShell`        : shell complet (topbar + sous-grille).
 * - `AppShellContent` : wrapper simple pour la zone scrollable (usage direct).
 */

import * as React from 'react';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// AppShellContent
// ─────────────────────────────────────────────────────────────────────────────

export interface AppShellContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Classe du conteneur centré interne. Défaut :
   * `mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8` — le contenu reste
   * centré, plafonné à 1536px et progressivement plus padded sur grands écrans
   * pour rester lisible sans étirer les composants. Passer p.ex. `max-w-none`
   * pour un écran pleine largeur ou `max-w-3xl` pour un wrapper étroit.
   */
  contentClassName?: string;
}

/** Wrapper centré par défaut — borné à 1800px pour rester lisible tout en
 * exploitant les grands écrans 1920px+ (marges latérales naturelles au-delà).
 * Padding responsive 4→6→8 sous cette limite. */
const DEFAULT_CONTENT_CLASSNAME = 'mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8';

const AppShellContent = React.forwardRef<HTMLDivElement, AppShellContentProps>(
  ({ className, contentClassName, children, ...props }, ref) => (
    <main
      ref={ref}
      className={cn('bg-background flex-1 overflow-x-hidden overflow-y-auto', className)}
      {...props}
    >
      {/* Conteneur centré à largeur plafonnée — le fond <main> reste pleine
          largeur, seul le contenu est borné pour ne pas étirer les composants. */}
      <div className={cn(DEFAULT_CONTENT_CLASSNAME, contentClassName)}>{children}</div>
    </main>
  ),
);
AppShellContent.displayName = 'AppShellContent';

// ─────────────────────────────────────────────────────────────────────────────
// AppShell
// ─────────────────────────────────────────────────────────────────────────────

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Contenu de la barre supérieure (60px). */
  topbar: React.ReactNode;
  /** Rail d'icônes (64px). Masqué sous md. */
  rail?: React.ReactNode;
  /** Panneau de sous-navigation (256px). Masqué sous lg. */
  sidebar?: React.ReactNode;
  /**
   * Override de la classe du wrapper centré dans le content area. Défaut :
   * `mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8`. Passer
   * `max-w-none` pour pleine largeur, ou `max-w-3xl` pour un wrapper étroit.
   */
  contentClassName?: string;
  /** Zone principale scrollable. */
  children: React.ReactNode;
}

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ className, topbar, rail, sidebar, contentClassName, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-background flex h-dvh flex-col overflow-hidden', className)}
      {...props}
    >
      {/* Zone Topbar */}
      {topbar}

      {/* Sous-grille : rail | sidebar | content */}
      <div className="flex min-h-0 flex-1">
        {/* Rail 64px — masqué sous md */}
        {rail && <div className="hidden w-16 shrink-0 flex-col md:flex">{rail}</div>}

        {/* Sidebar 256px — masquée sous lg */}
        {sidebar && <div className="hidden w-64 shrink-0 flex-col lg:flex">{sidebar}</div>}

        {/* Content — seule zone scrollable */}
        <AppShellContent contentClassName={contentClassName}>{children}</AppShellContent>
      </div>
    </div>
  ),
);
AppShell.displayName = 'AppShell';

export { AppShell, AppShellContent };
