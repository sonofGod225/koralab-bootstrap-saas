/**
 * <Breadcrumb /> — fil d'Ariane sémantique adapté Terre & Soleil.
 *
 * Implémentation shadcn/ui new-york sans Radix (markup HTML natif).
 * Séparateur par défaut : point médian `·` en terre-300 (cf. design navigation.jsx).
 * - Liens intermédiaires : terre-500, hover terre-700 underline.
 * - Page courante : terre-900 font-medium (non cliquable).
 * - Ellipsis : terre-400, aria-hidden.
 */

import * as React from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ─── Breadcrumb (nav wrapper) ──────────────────────────────────────────── */

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<'nav'> & { separator?: React.ReactNode }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />);
Breadcrumb.displayName = 'Breadcrumb';

/* ─── BreadcrumbList ────────────────────────────────────────────────────── */

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<'ol'>>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words',
        className,
      )}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = 'BreadcrumbList';

/* ─── BreadcrumbItem ────────────────────────────────────────────────────── */

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
  ),
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

/* ─── BreadcrumbLink ────────────────────────────────────────────────────── */

export interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  asChild?: boolean;
}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, asChild: _asChild, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        'text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 underline-offset-4 transition-colors hover:underline',
        className,
      )}
      {...props}
    />
  ),
);
BreadcrumbLink.displayName = 'BreadcrumbLink';

/* ─── BreadcrumbPage ────────────────────────────────────────────────────── */

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('text-foreground font-medium', className)}
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

/* ─── BreadcrumbSeparator ───────────────────────────────────────────────── */

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('text-border select-none', className)}
      {...props}
    >
      {children ?? (
        <span aria-hidden="true" className="text-border">
          ·
        </span>
      )}
    </li>
  );
}
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

/* ─── BreadcrumbEllipsis ────────────────────────────────────────────────── */

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('text-muted-foreground flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Plus de pages</span>
    </span>
  );
}
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

/* ─── Unused named export kept for consumers who want ChevronRight ──────── */
export { ChevronRight as BreadcrumbChevron };

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
