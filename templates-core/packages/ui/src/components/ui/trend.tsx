/**
 * <Trend /> — Indicateur de tendance Base & Brand.
 *
 * Affiche une valeur numérique ou texte accompagnée d'une icône
 * directionnelle et d'une couleur sémantique :
 * - `up`   → success-600 (succès)
 * - `down` → danger-600 (danger)
 * - `flat` → text-muted-foreground (neutre)
 *
 * Police `font-mono text-xs` pour l'alignement tabular dans les cartes KPI.
 */

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Valeur à afficher (ex: "+18%" ou 18). */
  value: string | number;
  /** Direction de la tendance. */
  direction: TrendDirection;
}

const directionConfig: Record<
  TrendDirection,
  { colorClass: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  up: { colorClass: 'text-success-600', Icon: TrendingUp },
  down: { colorClass: 'text-danger-600', Icon: TrendingDown },
  flat: { colorClass: 'text-muted-foreground', Icon: Minus },
};

const Trend = React.forwardRef<HTMLSpanElement, TrendProps>(
  ({ value, direction, className, ...props }, ref) => {
    const { colorClass, Icon } = directionConfig[direction];
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 font-mono text-xs font-medium',
          colorClass,
          className,
        )}
        {...props}
      >
        <Icon size={12} className="shrink-0" />
        {value}
      </span>
    );
  },
);
Trend.displayName = 'Trend';

export { Trend };
