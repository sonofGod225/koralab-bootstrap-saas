/**
 * <Spinner /> — Indicateur de chargement SVG Base & Brand.
 *
 * Anneau SVG `animate-spin` : cercle de fond opaque 20% + arc avant.
 * Prop `size` contrôle le diamètre en px (défaut 16).
 * La couleur hérite de `currentColor` — posez la couleur sur le parent.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /** Diamètre en px. Défaut : 16. */
  size?: number;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 16, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Chargement…"
      role="status"
      className={cn('animate-spin', className)}
      {...props}
    >
      {/* Fond de l'anneau */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      {/* Arc animé */}
      <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
);
Spinner.displayName = 'Spinner';

export { Spinner };
