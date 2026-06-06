/**
 * <KPI /> — Indicateur clé Base & Brand.
 *
 * Layout :
 * - Label en petite capitale espacée (base 500, uppercase, tracking widest).
 *   Note : "uppercase" ici est *typographique* (caps small) acceptable car
 *   c'est un label de KPI, pas une phrase. Cf. SKILL.md règle sentence case.
 * - Valeur en Fraunces light 3xl Base 900.
 * - Trend optionnel (haut/bas/plat) avec icône Lucide + couleur sémantique.
 */

import type { ReactNode } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

export interface KPITrend {
  direction: 'up' | 'down' | 'flat';
  /** Texte affiché à côté de l'icône (ex: "+12 %"). */
  value: string;
}

export interface KPIProps {
  label: string;
  value: ReactNode;
  trend?: KPITrend;
  className?: string;
}

const trendStyles: Record<KPITrend['direction'], { color: string; Icon: typeof TrendingUp }> = {
  up: { color: 'text-success-600', Icon: TrendingUp },
  down: { color: 'text-danger-600', Icon: TrendingDown },
  flat: { color: 'text-muted-foreground', Icon: Minus },
};

export function KPI({ label, value, trend, className }: KPIProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-muted-foreground text-xs tracking-widest uppercase">{label}</span>
      <span className="font-display text-foreground text-3xl leading-none font-light">{value}</span>
      {trend ? <TrendBadge trend={trend} /> : null}
    </div>
  );
}

function TrendBadge({ trend }: { trend: KPITrend }) {
  const { color, Icon } = trendStyles[trend.direction];
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', color)}>
      <Icon size={14} aria-hidden="true" />
      <span>{trend.value}</span>
    </span>
  );
}
