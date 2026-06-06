/**
 * <Pagination /> — navigation paginée adaptée Base & Brand.
 *
 * Implémentation shadcn/ui new-york sans Radix (markup HTML natif).
 * Utilise `buttonVariants` de `./button` pour le style de base des liens.
 *
 * Style :
 * - Page active : bg-base-900 text-base-25, carrée 36 × 36 px, rounded-lg.
 * - Pages inactives : ghost, hover bg-base-50.
 * - Précédent / Suivant : outline ghost avec icône Lucide ChevronLeft/Right.
 * - Ellipsis : simple point médian base-400.
 */

import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { buttonVariants } from './button';

/* ─── Pagination (nav wrapper) ──────────────────────────────────────────── */

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}
Pagination.displayName = 'Pagination';

/* ─── PaginationContent ─────────────────────────────────────────────────── */

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentPropsWithoutRef<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-row items-center gap-0.5', className)} {...props} />
  ),
);
PaginationContent.displayName = 'PaginationContent';

/* ─── PaginationItem ────────────────────────────────────────────────────── */

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn('', className)} {...props} />,
);
PaginationItem.displayName = 'PaginationItem';

/* ─── PaginationLink ────────────────────────────────────────────────────── */

export type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentPropsWithoutRef<'a'>;

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        buttonVariants({ variant: isActive ? 'default' : 'ghost', size: 'icon' }),
        'h-9 w-9 rounded-lg text-sm font-medium',
        isActive
          ? 'bg-primary text-primary-foreground hover:bg-primary'
          : 'text-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}
PaginationLink.displayName = 'PaginationLink';

/* ─── PaginationPrevious ────────────────────────────────────────────────── */

function PaginationPrevious({ className, ...props }: React.ComponentPropsWithoutRef<'a'>) {
  return (
    <a
      aria-label="Aller à la page précédente"
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon' }),
        'text-foreground hover:bg-muted hover:text-foreground h-9 w-9 rounded-lg',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
    </a>
  );
}
PaginationPrevious.displayName = 'PaginationPrevious';

/* ─── PaginationNext ────────────────────────────────────────────────────── */

function PaginationNext({ className, ...props }: React.ComponentPropsWithoutRef<'a'>) {
  return (
    <a
      aria-label="Aller à la page suivante"
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon' }),
        'text-foreground hover:bg-muted hover:text-foreground h-9 w-9 rounded-lg',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
    </a>
  );
}
PaginationNext.displayName = 'PaginationNext';

/* ─── PaginationEllipsis ────────────────────────────────────────────────── */

function PaginationEllipsis({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      aria-hidden="true"
      className={cn('text-muted-foreground flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Plus de pages</span>
    </span>
  );
}
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
