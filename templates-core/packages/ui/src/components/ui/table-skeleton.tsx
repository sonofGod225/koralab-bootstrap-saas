/**
 * <TableSkeleton /> / <CardSkeleton /> / <ListSkeleton /> — États de chargement.
 *
 * Variantes préfabriquées shimmer pour les différents contextes de chargement :
 * - `TableSkeleton` : lignes × colonnes dans une grille de tableau.
 * - `CardSkeleton`  : carte KPI avec label + valeur + meta.
 * - `ListSkeleton`  : liste d'items avec avatar + lignes de texte.
 *
 * Utilise le composant `Skeleton` de base (animate-pulse bg-subtle).
 */

import * as React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '../../lib/utils';

// ─── TableSkeleton ───────────────────────────────────────────────────────────

export interface TableSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nombre de lignes de données. Défaut : 10. */
  rows?: number;
  /** Nombre de colonnes. Défaut : 5. */
  columns?: number;
}

const TableSkeleton = React.forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({ rows = 10, columns = 5, className, ...props }, ref) => (
    <div ref={ref} className={cn('w-full overflow-auto', className)} {...props}>
      <table className="w-full text-sm">
        {/* Header */}
        <thead>
          <tr className="border-border border-b">
            {Array.from({ length: columns }).map((_, ci) => (
              <th key={ci} className="h-11 px-3 text-left align-middle">
                <Skeleton className="h-3 w-16 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        {/* Body */}
        <tbody>
          {Array.from({ length: rows }).map((_, ri) => (
            <tr key={ri} className="border-border border-b last:border-0">
              {Array.from({ length: columns }).map((_, ci) => (
                <td key={ci} className="p-3 align-middle">
                  <Skeleton
                    className={cn(
                      'h-4 rounded',
                      ci === 0 ? 'w-24' : ci === columns - 1 ? 'w-12' : 'w-full',
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
);
TableSkeleton.displayName = 'TableSkeleton';

// ─── CardSkeleton ─────────────────────────────────────────────────────────────

export type CardSkeletonProps = React.HTMLAttributes<HTMLDivElement>;

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-card border-border flex min-h-[140px] flex-col justify-between rounded-xl border p-5 shadow-xs',
        className,
      )}
      {...props}
    >
      {/* Label */}
      <Skeleton className="h-3 w-28 rounded" />
      <div className="flex flex-col gap-2">
        {/* Valeur principale */}
        <Skeleton className="h-8 w-36 rounded" />
        {/* Meta / trend */}
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
  ),
);
CardSkeleton.displayName = 'CardSkeleton';

// ─── ListSkeleton ─────────────────────────────────────────────────────────────

export interface ListSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nombre d'items à afficher. Défaut : 5. */
  items?: number;
}

const ListSkeleton = React.forwardRef<HTMLDivElement, ListSkeletonProps>(
  ({ items = 5, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col', className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="border-border flex items-center gap-3 border-b px-1 py-3 last:border-0"
        >
          {/* Avatar placeholder */}
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-2/5 rounded" />
            <Skeleton className="h-3 w-3/5 rounded" />
          </div>
          {/* Value placeholder */}
          <Skeleton className="h-4 w-16 shrink-0 rounded" />
        </div>
      ))}
    </div>
  ),
);
ListSkeleton.displayName = 'ListSkeleton';

export { TableSkeleton, CardSkeleton, ListSkeleton };
