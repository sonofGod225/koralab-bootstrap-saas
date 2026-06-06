/**
 * <Section /> — Wrapper d'espacement vertical __PROJECT_NAME__.
 *
 * CVA prop `gap` :
 * - `section` (défaut) : space-y-8  (32px) — séparation entre blocs majeurs.
 * - `block`            : space-y-4  (16px) — séparation entre éléments internes.
 *
 * Props optionnels `title` et `description` pour afficher un en-tête de section.
 *
 * Exports :
 * - `Section`
 * - `sectionVariants` (CVA)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Variantes CVA
// ─────────────────────────────────────────────────────────────────────────────

const sectionVariants = cva('', {
  variants: {
    gap: {
      section: 'space-y-8',
      block: 'space-y-4',
    },
  },
  defaultVariants: {
    gap: 'section',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {
  /** Titre optionnel affiché en en-tête de la section. */
  title?: string;
  /** Description courte sous le titre. */
  description?: string;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, gap, title, description, children, ...props }, ref) => (
    <section ref={ref} className={cn(sectionVariants({ gap }), className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="font-display text-foreground text-lg font-medium tracking-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  ),
);
Section.displayName = 'Section';

export { Section, sectionVariants };
