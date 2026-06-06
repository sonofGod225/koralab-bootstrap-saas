/**
 * <PetalSymbol /> — Logo __PROJECT_NAME__ (4 pétales).
 *
 * Design Terre & Soleil v3.0 :
 * - 3 pétales Terre 900 (#2A1A0F) : haut-gauche, haut-droit, bas-gauche.
 * - 1 pétale Soleil 400 (#E89B5A) : bas-droit (signature ≤ 15% surface).
 *
 * Utilisé partout : favicon, en-têtes, splash, etc.
 *
 * Note : couleurs hardcodées exprès — le SVG est utilisé hors-contexte
 * (icones, manifest, emails) où les variables CSS Tailwind ne sont pas
 * toujours disponibles.
 */

import type { CSSProperties } from 'react';

export interface PetalSymbolProps {
  /** Taille en pixels (largeur = hauteur). Default : 56. */
  size?: number;
  /** Classes Tailwind additionnelles. */
  className?: string;
  /** Style inline (rare, préférer className). */
  style?: CSSProperties;
  /** Label accessible. Default : "__PROJECT_NAME__". */
  'aria-label'?: string;
}

export function PetalSymbol({
  size = 56,
  className,
  style,
  'aria-label': ariaLabel = '__PROJECT_NAME__',
}: PetalSymbolProps) {
  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      className={className}
      style={style}
      role="img"
      aria-label={ariaLabel}
    >
      <path d="M 8 28 L 8 18 Q 8 8 18 8 L 28 8 L 28 28 Z" fill="#2A1A0F" />
      <path d="M 30 28 L 30 8 L 48 8 Q 48 8 48 18 L 48 28 Z" fill="#2A1A0F" />
      <path d="M 8 30 L 28 30 L 28 48 L 18 48 Q 8 48 8 38 Z" fill="#2A1A0F" />
      <path d="M 30 30 L 48 30 L 48 38 Q 48 48 38 48 L 30 48 Z" fill="#E89B5A" />
    </svg>
  );
}
