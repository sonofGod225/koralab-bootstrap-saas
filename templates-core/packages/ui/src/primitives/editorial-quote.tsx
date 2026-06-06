/**
 * <EditorialQuote /> — Citation éditoriale Fraunces italic Soleil 600.
 *
 * Règle non-négociable (docs/design-system/project/SKILL.md) :
 * **maximum 2 occurrences par page**. C'est un accent éditorial, pas
 * un style courant. Si tu en mets 3, tu déséquilibres la signature
 * Soleil 400 ≤ 15%.
 *
 * Usage typique : tagline marketing, intro de section, mise en avant
 * de citation client. Pas pour du texte courant (qui reste Inter).
 */

import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface EditorialQuoteProps {
  children: ReactNode;
  /** Attribution optionnelle (auteur, source). Affichée en sous-ligne. */
  attribution?: string;
  className?: string;
}

export function EditorialQuote({ children, attribution, className }: EditorialQuoteProps) {
  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      <blockquote className="font-display text-soleil-600 text-2xl leading-snug tracking-tight italic">
        {children}
      </blockquote>
      {attribution ? (
        <figcaption className="text-muted-foreground text-sm tracking-wide">
          — {attribution}
        </figcaption>
      ) : null}
    </figure>
  );
}
