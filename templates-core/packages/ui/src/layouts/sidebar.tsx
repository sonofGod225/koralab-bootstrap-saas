/**
 * Sidebar — Primitives de navigation latérale __PROJECT_NAME__.
 *
 * Exports :
 * - `SidebarRail`    : rail d'icônes 64px (Sidebar1 dans le design).
 * - `NavIcon`        : bouton 44×44 avec ergot actif Soleil 400.
 * - `Sidebar`        : panneau de sous-navigation 256px (Sidebar2).
 * - `SidebarHeader`  : en-tête avec filet accent 3px + eyebrow + titre.
 * - `SidebarSection` : groupe d'items avec label en petite capitale.
 * - `SidebarItem`    : ligne de navigation avec icône, label, badge optionnel.
 *
 * Données de navigation (modules, items) : toujours fournies par le consommateur,
 * jamais codées en dur dans ces primitives.
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

/** Transition douce partagée par les indicateurs actifs animés (ergot rail + surface item). */
const ACTIVE_SPRING = { type: 'spring', stiffness: 500, damping: 40 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// SidebarRail — 64px, bg-card, border-r
// ─────────────────────────────────────────────────────────────────────────────

export type SidebarRailProps = React.HTMLAttributes<HTMLElement>;

const SidebarRail = React.forwardRef<HTMLElement, SidebarRailProps>(
  ({ className, children, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        'bg-card border-border flex h-full w-16 flex-col items-center border-r',
        'gap-1.5 py-3.5',
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  ),
);
SidebarRail.displayName = 'SidebarRail';

// ─────────────────────────────────────────────────────────────────────────────
// NavIcon — bouton 44×44, ergot actif Soleil 400 à droite
// ─────────────────────────────────────────────────────────────────────────────

export interface NavIconBadge {
  /** Valeur numérique affichée dans le badge. */
  value: number;
}

export interface NavIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icône Lucide à rendre (élément React). */
  icon: React.ReactNode;
  /** Libellé accessible (aria-label). */
  label: string;
  /** Item actif — fond couleur signature + ergot Soleil. */
  active?: boolean;
  /**
   * Couleur de signature du module (ex: `var(--color-soleil-400)` ou classe Tailwind arbitraire).
   * Utilisée comme fond du bouton quand actif, et comme couleur d'icône quand inactif.
   */
  signatureColor?: string;
  /** Badge numérique affiché en haut-droite de l'icône (masqué si actif). */
  badge?: NavIconBadge;
}

const NavIcon = React.forwardRef<HTMLButtonElement, NavIconProps>(
  ({ className, icon, label, active = false, signatureColor, badge, style, ...props }, ref) => {
    // Le fond actif utilise la couleur signature via style inline (valeur dynamique inconnue de Tailwind).
    const activeStyle: React.CSSProperties =
      active && signatureColor ? { backgroundColor: signatureColor, color: '#fff' } : {};

    return (
      <div className="relative flex justify-center">
        <button
          ref={ref}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          style={{ ...activeStyle, ...style }}
          className={cn(
            'relative inline-flex items-center justify-center',
            'h-11 w-11 rounded-[12px] border-none',
            'cursor-pointer transition-colors duration-[120ms]',
            'focus-visible:ring-soleil-400/40 focus-visible:ring-2 focus-visible:outline-none',
            // Inactif : fond transparent, hover bg-muted
            !active && 'hover:bg-muted text-muted-foreground hover:text-foreground bg-transparent',
            className,
          )}
          {...props}
        >
          {/* Icône — le consommateur passe un élément Lucide avec sa taille et strokeWidth */}
          {icon}

          {/* Badge numérique — masqué si actif */}
          {badge && !active && (
            <span
              className={cn(
                'absolute top-[7px] right-[7px]',
                'h-4 min-w-4 rounded-full px-1',
                'bg-soleil-400 text-terre-900',
                'font-mono text-[10px] font-semibold',
                'inline-flex items-center justify-center',
                'ring-card ring-2',
              )}
            >
              {badge.value}
            </span>
          )}
        </button>

        {/* Ergot actif — glisse d'une icône active à l'autre (motion layout). */}
        {active && (
          <motion.span
            layoutId="nav-rail-ergot"
            transition={ACTIVE_SPRING}
            className="bg-soleil-400 absolute top-[10px] right-[-8px] h-6 w-1 rounded-l-[4px]"
            aria-hidden="true"
          />
        )}
      </div>
    );
  },
);
NavIcon.displayName = 'NavIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar — panneau de sous-navigation 256px
// ─────────────────────────────────────────────────────────────────────────────

export type SidebarProps = React.HTMLAttributes<HTMLElement>;

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, children, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        'bg-background border-border flex h-full w-64 flex-col overflow-hidden border-r',
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  ),
);
Sidebar.displayName = 'Sidebar';

// ─────────────────────────────────────────────────────────────────────────────
// SidebarHeader — filet 3px accent + eyebrow 10px uppercase + titre display 20px
// ─────────────────────────────────────────────────────────────────────────────

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Texte de surtitre, affiché uppercase en couleur accent. */
  eyebrow?: string;
  /** Titre du panneau en Fraunces 20px. */
  title?: string;
  /**
   * Couleur du filet supérieur 3px et de l'eyebrow.
   * Valeur CSS arbitraire (ex: `var(--color-soleil-400)` ou `#E89B5A`).
   */
  accent?: string;
}

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, eyebrow, title, accent, children, ...props }, ref) => (
    <div ref={ref} className={cn('relative px-5 pt-[22px] pb-3.5', className)} {...props}>
      {/* Filet accent 3px en haut */}
      {accent && (
        <span
          className="absolute top-0 right-0 left-0 h-[3px]"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        />
      )}

      {/* Eyebrow */}
      {eyebrow && (
        <div
          className="mb-1.5 text-[10px] font-semibold tracking-[1.4px] uppercase"
          style={accent ? { color: accent } : undefined}
        >
          {eyebrow}
        </div>
      )}

      {/* Titre */}
      {title && (
        <div className="font-display text-foreground text-xl leading-snug font-medium tracking-tight">
          {title}
        </div>
      )}

      {children}
    </div>
  ),
);
SidebarHeader.displayName = 'SidebarHeader';

// ─────────────────────────────────────────────────────────────────────────────
// SidebarSection — groupe d'items avec label
// ─────────────────────────────────────────────────────────────────────────────

export interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label de section — rendu uppercase 10px text-muted-foreground. */
  label?: string;
}

const SidebarSection = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, label, children, ...props }, ref) => (
    <div ref={ref} className={cn('pt-3.5 pb-1', className)} {...props}>
      {label && (
        <div className="text-muted-foreground px-[22px] pb-2 text-[10px] font-semibold tracking-[1.2px] uppercase">
          {label}
        </div>
      )}
      {children}
    </div>
  ),
);
SidebarSection.displayName = 'SidebarSection';

// ─────────────────────────────────────────────────────────────────────────────
// SidebarItem — ligne de navigation
// ─────────────────────────────────────────────────────────────────────────────

export type SidebarItemBadgeTone = 'pending' | 'late' | 'default';

export interface SidebarItemBadge {
  value: number;
  tone?: SidebarItemBadgeTone;
}

export interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icône Lucide (élément React). */
  icon?: React.ReactNode;
  /** Libellé de l'item. */
  label: string;
  /** Item actif — fond bg-card shadow-xs. */
  active?: boolean;
  /** Badge numérique avec ton sémantique. */
  badge?: SidebarItemBadge;
  /**
   * Couleur signature utilisée pour coloriser l'icône quand actif.
   * Valeur CSS arbitraire.
   */
  signatureColor?: string;
}

const sidebarItemBadgeVariants = cva(
  'font-mono text-[10px] font-semibold px-1.5 py-px rounded-full',
  {
    variants: {
      tone: {
        late: 'bg-brique-50 text-brique-800',
        pending: 'bg-soleil-50 text-soleil-800',
        default: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'default' },
  },
);

const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  ({ className, icon, label, active = false, badge, signatureColor, style, ...props }, ref) => {
    // La couleur d'icône active est dynamique — on passe via style inline.
    const iconWrapStyle: React.CSSProperties =
      active && signatureColor ? { color: signatureColor } : {};

    return (
      <button
        ref={ref}
        aria-current={active ? 'page' : undefined}
        style={style}
        className={cn(
          'relative mx-2 mb-0.5 w-[calc(100%-16px)]',
          'flex items-center gap-2.5',
          'cursor-pointer rounded-lg border-none px-3 py-2',
          'text-[13px] tracking-[-0.1px] transition-colors duration-[120ms]',
          'focus-visible:ring-soleil-400/40 focus-visible:ring-2 focus-visible:outline-none',
          active
            ? 'text-foreground font-medium'
            : 'text-muted-foreground hover:bg-card/50 hover:text-foreground bg-transparent font-normal',
          className,
        )}
        {...props}
      >
        {/* Surface active — glisse d'un item à l'autre (motion layout). */}
        {active && (
          <motion.span
            layoutId="sidebar-active-bg"
            transition={ACTIVE_SPRING}
            className="bg-card absolute inset-0 z-0 rounded-lg shadow-xs"
            aria-hidden="true"
          />
        )}

        {/* Icône */}
        {icon && (
          <span
            className={cn('relative z-10 shrink-0', !active && 'text-muted-foreground')}
            style={iconWrapStyle}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}

        {/* Label */}
        <span className="relative z-10 flex-1 text-left">{label}</span>

        {/* Badge */}
        {badge && (
          <span
            className={cn(
              'relative z-10',
              sidebarItemBadgeVariants({ tone: badge.tone ?? 'default' }),
            )}
          >
            {badge.value}
          </span>
        )}
      </button>
    );
  },
);
SidebarItem.displayName = 'SidebarItem';

export { SidebarRail, NavIcon, Sidebar, SidebarHeader, SidebarSection, SidebarItem };
