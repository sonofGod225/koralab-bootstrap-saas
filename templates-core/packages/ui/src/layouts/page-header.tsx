/**
 * <PageHeader /> — En-tête de page __PROJECT_NAME__.
 *
 * Composition :
 * - Eyebrow : petite capitale 11px tracking-[1.4px] text-muted-foreground.
 * - Titre   : Fraunces font-light text-4xl tracking-tight text-foreground.
 *             Accepte un ReactNode pour les fragments éditoriaux (ex: <em> italique cuivre).
 * - Subtitle : prose 14px text-muted-foreground.
 * - Actions : slot droit, aligné en bas du bloc titre.
 *
 * Layout : titre à gauche, actions à droite, alignés en bas via items-end.
 *
 * Exports :
 * - `PageHeader`
 */

import * as React from 'react';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// PageHeader
// ─────────────────────────────────────────────────────────────────────────────

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Surtitre technique — affiché uppercase 11px text-muted-foreground. */
  eyebrow?: string;
  /**
   * Titre principal — Fraunces light 40px.
   * Accepte un ReactNode pour inclure des fragments <em> éditoriaux.
   */
  title?: React.ReactNode;
  /** Sous-titre descriptif — 14px text-muted-foreground. */
  subtitle?: string;
  /** Slot d'actions — boutons, menus, etc. Ancré à droite, aligné en bas. */
  actions?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, eyebrow, title, subtitle, actions, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-7 flex items-end justify-between gap-5', className)}
      {...props}
    >
      {/* Bloc titre */}
      <div>
        {eyebrow && (
          <div className="text-muted-foreground mb-2.5 text-[11px] font-semibold tracking-[1.4px] uppercase">
            {eyebrow}
          </div>
        )}

        {(title || children) && (
          <h1 className="font-display text-foreground m-0 max-w-[560px] text-4xl leading-[1.05] font-light tracking-tight">
            {title ?? children}
          </h1>
        )}

        {subtitle && (
          <p className="text-muted-foreground mt-3 mb-0 text-sm leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* Slot actions — aligné en bas grâce à items-end sur le parent */}
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  ),
);
PageHeader.displayName = 'PageHeader';

export { PageHeader };
