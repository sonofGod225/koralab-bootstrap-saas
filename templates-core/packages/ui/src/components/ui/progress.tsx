/**
 * <Progress /> — Radix Progress adapté Terre & Soleil.
 * <CircularProgress /> — Anneau SVG Soleil 400.
 *
 * Progress linéaire :
 * - track  : bg-terre-100, rounded-full
 * - indicateur : bg-terre-900, transition width
 * - tailles sm / md (défaut) / lg via className du conteneur
 *
 * CircularProgress :
 * - Anneau SVG, stroke soleil-400 sur fond terre-100
 * - Valeur % centrée en font-display
 */

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../lib/utils';

// ─── Progress linéaire ────────────────────────────────────────────────────

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('bg-subtle relative h-1.5 w-full overflow-hidden rounded-full', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="bg-primary h-full w-full flex-1 rounded-full transition-all duration-300 ease-in-out"
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// ─── CircularProgress SVG ─────────────────────────────────────────────────

export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Valeur de 0 à 100. */
  value?: number;
  /** Diamètre en px. Défaut : 56. */
  size?: number;
  /** Épaisseur du trait SVG. Défaut : 5. */
  strokeWidth?: number;
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ className, value = 0, size = 56, strokeWidth = 5, ...props }, ref) => {
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, value));
    const offset = circumference - (pct / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-subtle"
            strokeWidth={strokeWidth}
          />
          {/* Indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-soleil-400 transition-all duration-300 ease-in-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="font-display text-foreground absolute text-xs font-medium tracking-tight">
          {Math.round(pct)}%
        </span>
      </div>
    );
  },
);
CircularProgress.displayName = 'CircularProgress';

export { Progress, CircularProgress };
