/**
 * <Topbar /> — Barre supérieure applicative __PROJECT_NAME__.
 *
 * Hauteur fixe 60px, bg-card, border-b border-border.
 * Trois slots via props :
 * - `start`  : contenu ancré à gauche (ex: OrgSwitcher, logo).
 * - `center` : contenu centré flex-1 (ex: CommandPalette).
 * - `end`    : contenu ancré à droite (ex: icônes d'action, avatar).
 *
 * Position : sticky top-0 z-10 pour rester visible lors du scroll de la zone content.
 *
 * Exports :
 * - `Topbar`
 */

import * as React from 'react';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Topbar
// ─────────────────────────────────────────────────────────────────────────────

export interface TopbarProps extends React.HTMLAttributes<HTMLElement> {
  /** Slot gauche — ex: OrgSwitcher, logo mobile. */
  start?: React.ReactNode;
  /** Slot centre — ex: barre de recherche / command palette. */
  center?: React.ReactNode;
  /** Slot droit — ex: icônes d'action, avatar. */
  end?: React.ReactNode;
}

const Topbar = React.forwardRef<HTMLElement, TopbarProps>(
  ({ className, start, center, end, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        'sticky top-0 z-10',
        'flex h-[60px] items-center justify-between gap-3',
        'bg-card border-border border-b',
        'px-5',
        className,
      )}
      {...props}
    >
      {/* Slot start */}
      {start && <div className="flex shrink-0 items-center gap-3.5">{start}</div>}

      {/* Slot center — prend l'espace disponible, contenu centré */}
      {center && <div className="flex flex-1 justify-center">{center}</div>}

      {/* Slot end */}
      {end && <div className="flex shrink-0 items-center gap-1.5">{end}</div>}

      {/* children de secours si le consommateur préfère composer librement */}
      {children}
    </header>
  ),
);
Topbar.displayName = 'Topbar';

export { Topbar };
