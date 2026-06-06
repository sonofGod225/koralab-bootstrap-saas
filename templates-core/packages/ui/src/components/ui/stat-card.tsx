/**
 * <StatCard /> — Carte KPI (indicateur clé de performance) Terre & Soleil.
 *
 * Deux variantes :
 * - `default` : fond bg-card, bordure border-border, shadow-xs — usage courant.
 * - `hero`    : fond terre-900 + texte terre-100 + cercle Soleil décoratif
 *               (réservé au KPI principal de la vue, ≤ 1 par page).
 *
 * Props :
 * - `label`   : libellé de l'indicateur (texte court, uppercase small-caps).
 * - `value`   : valeur principale (font-display, tabular-nums).
 * - `unit`    : unité optionnelle affichée après la valeur.
 * - `meta`    : texte contextuel (période de comparaison, médiane…).
 * - `trend`   : composant `<Trend>` ou tout autre ReactNode.
 * - `icon`    : icône lucide-react optionnelle affichée en haut à droite.
 *
 * Réf visuelle : docs/ui-designs/epic-design-system/story-2.7-layouts/project/dashboard-layout.jsx
 * (KpiHeroCard + KpiCard).
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const statCardVariants = cva(
  'relative flex flex-col justify-between overflow-hidden rounded-xl border p-5',
  {
    variants: {
      variant: {
        default: 'bg-card border-border shadow-xs text-foreground min-h-[140px]',
        hero: 'bg-terre-900 border-transparent shadow-md text-terre-100 min-h-[200px]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statCardVariants> {
  /** Libellé de l'indicateur. */
  label: string;
  /** Valeur principale. */
  value: React.ReactNode;
  /** Unité affichée après la valeur (ex : "FCFA", "%"). */
  unit?: string;
  /** Texte contextuel sous la valeur (période, médiane…). */
  meta?: React.ReactNode;
  /** Indicateur de tendance — typiquement un `<Trend>`. */
  trend?: React.ReactNode;
  /** Icône lucide-react affichée en haut à droite. */
  icon?: React.ReactNode;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, unit, meta, trend, icon, variant, className, ...props }, ref) => {
    const isHero = variant === 'hero';
    return (
      <div ref={ref} className={cn(statCardVariants({ variant }), className)} {...props}>
        {/* Cercle décoratif Soleil — hero uniquement */}
        {isHero && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full opacity-35"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, var(--color-soleil-400), transparent 70%)',
            }}
          />
        )}

        {/* Haut : label + icône */}
        <div className="relative flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-xs font-semibold tracking-widest uppercase',
              isHero ? 'text-soleil-300' : 'text-muted-foreground',
            )}
          >
            {label}
          </p>
          {icon && (
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                isHero ? 'text-soleil-300' : 'text-muted-foreground bg-muted',
              )}
            >
              {icon}
            </span>
          )}
        </div>

        {/* Bas : valeur + meta + trend */}
        <div className="relative flex flex-col gap-2">
          {/* Valeur principale */}
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'font-display tracking-display leading-none font-light tabular-nums',
                isHero ? 'text-terre-100 text-5xl' : 'text-foreground text-3xl',
              )}
            >
              {value}
            </span>
            {unit && (
              <span className={cn('text-xs', isHero ? 'text-soleil-300' : 'text-muted-foreground')}>
                {unit}
              </span>
            )}
          </div>

          {/* Trend + meta */}
          {(trend || meta) && (
            <div
              className={cn(
                'flex flex-wrap items-center gap-1.5 text-xs',
                isHero ? 'text-soleil-200' : 'text-muted-foreground',
              )}
            >
              {trend}
              {meta && <span>{meta}</span>}
            </div>
          )}
        </div>
      </div>
    );
  },
);
StatCard.displayName = 'StatCard';

export { StatCard, statCardVariants };
