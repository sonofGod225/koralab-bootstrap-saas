/**
 * <BottomNav /> — Barre de navigation mobile fixée en bas.
 *
 * Structure :
 * - `BottomNav`     : conteneur h-[72px], bg-card, border-t, ombre haute légère,
 *                     répartit les items également (flex justify-around).
 * - `BottomNavItem` : bouton d'onglet avec icône + label 10px.
 *                     Actif → text-soleil-600 + ergot Soleil 400 en haut (3px × ~28px, arrondi bas).
 *                     Inactif → text-muted-foreground.
 *                     Badge numérique → pastille bg-brique-400 text-white.
 *
 * Exports :
 * - `BottomNav`
 * - `BottomNavItem`
 * - `BottomNavProps`
 * - `BottomNavItemProps`
 */

import * as React from 'react';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// BottomNav — conteneur de la barre inférieure
// ─────────────────────────────────────────────────────────────────────────────

export type BottomNavProps = React.HTMLAttributes<HTMLElement>;

/**
 * Barre de navigation mobile fixée en bas (h-[72px]).
 * Répartit les `BottomNavItem` uniformément sur toute la largeur.
 */
const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
  ({ className, children, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(
        'bg-card border-border',
        'fixed inset-x-0 bottom-0 z-20',
        'flex h-[72px] items-start justify-around',
        'border-t px-0 pt-[10px] pb-[14px]',
        // Ombre haute légère
        'shadow-[0_-1px_12px_rgba(42,26,15,0.04)]',
        className,
      )}
      {...props}
    >
      {children}
    </nav>
  ),
);
BottomNav.displayName = 'BottomNav';

// ─────────────────────────────────────────────────────────────────────────────
// BottomNavItem — onglet individuel
// ─────────────────────────────────────────────────────────────────────────────

export interface BottomNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icône React (ex : élément Lucide). */
  icon: React.ReactNode;
  /** Label affiché sous l'icône (10px). */
  label: string;
  /** Item actif — texte soleil-600 + ergot Soleil en haut. */
  active?: boolean;
  /** Badge numérique affiché en pastille rouge (brique-400). */
  badge?: number;
}

/**
 * Onglet de la BottomNav.
 * Actif : texte `text-soleil-600` + ergot Soleil 400 (3 × 28px) arrondi en bas, ancré en haut.
 * Inactif : texte `text-muted-foreground`.
 * Badge : pastille `bg-brique-400 text-white` en haut-droite de l'icône.
 */
const BottomNavItem = React.forwardRef<HTMLButtonElement, BottomNavItemProps>(
  ({ className, icon, label, active = false, badge, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex flex-1 flex-col items-center gap-1',
        'h-full border-none bg-transparent',
        'cursor-pointer font-sans text-[10px] font-medium tracking-[-0.1px]',
        'transition-colors duration-[120ms]',
        'focus-visible:ring-soleil-400/40 focus-visible:ring-2 focus-visible:outline-none',
        active ? 'text-soleil-600' : 'text-muted-foreground',
        className,
      )}
      {...props}
    >
      {/* Ergot actif Soleil 400 — 3px × 28px, arrondi bas, ancré en haut du bouton */}
      {active && (
        <span
          className="bg-soleil-400 absolute top-[-10px] left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-b-[4px]"
          aria-hidden="true"
        />
      )}

      {/* Icône avec badge optionnel */}
      <span className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span
            className={cn(
              'absolute top-[-4px] right-[-7px]',
              'inline-flex h-[14px] min-w-[14px] items-center justify-center px-1',
              'bg-brique-400 rounded-full text-white',
              'font-mono text-[9px] font-semibold',
              'ring-card ring-2',
            )}
            aria-label={`${badge} notifications`}
          >
            {badge}
          </span>
        )}
      </span>

      {/* Label */}
      <span>{label}</span>
    </button>
  ),
);
BottomNavItem.displayName = 'BottomNavItem';

export { BottomNav, BottomNavItem };
