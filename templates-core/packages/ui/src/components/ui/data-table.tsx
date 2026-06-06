/**
 * <DataTable /> — Tableau de données générique Base & Brand.
 *
 * Basé sur @tanstack/react-table v8 (headless). Fonctionnalités :
 * - Tri cliquable sur les en-têtes marqués `enableSorting`.
 * - Sélection de lignes contrôlée via `rowSelection` + `onRowSelectionChange`.
 * - Filtres colonne contrôlés via `columnFilters` + `onColumnFiltersChange`.
 * - Pagination contrôlée via `pagination` + `onPaginationChange`.
 * - Mode server-side : passer `manual` pour désactiver le tri/pagination côté client.
 * - Virtualisation automatique via @tanstack/react-virtual lorsque `data.length > 100`.
 * - Colonnes monétaires : si `column.columnDef.meta?.type === 'money'`, la valeur
 *   est rendue via `<MoneyDisplay>` avec la devise `column.columnDef.meta?.currency`.
 * - État `loading` → `<TableSkeleton>` (props via `skeletonProps`).
 * - État vide → `<EmptyState>` (props via `emptyState`).
 *
 * Module augmentation TanStack :
 * `ColumnMeta` est augmenté avec `type?: 'money' | 'text'` et `currency?`.
 * Voir la déclaration en bas de fichier — nécessaire car `verbatimModuleSyntax`
 * interdit les re-exports de types via `declare module` dans un import de type.
 */

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  PaginationState,
  OnChangeFn,
  Cell,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table';
import { Button } from './button';
import { TableSkeleton, type TableSkeletonProps } from './table-skeleton';
import { EmptyState, type EmptyStateProps } from './empty-state';
import { MoneyDisplay } from '../../primitives/money-display';
import type { Currency } from '@__SCOPE__/types';

// ─── Module augmentation @tanstack/react-table ────────────────────────────────
// POINT D'ATTENTION : cette déclaration étend l'interface `ColumnMeta` de TanStack
// Table. Elle doit vivre dans un fichier `.tsx` (module ES) pour que TypeScript la
// traite comme une augmentation de module et non une redéclaration.
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** 'money' active le rendu via <MoneyDisplay>. Défaut : 'text'. */
    type?: 'money' | 'text';
    /** Devise ISO 4217 — requise si type === 'money'. */
    currency?: Currency;
  }
}

// ─── Constante seuil virtualisation ──────────────────────────────────────────
const VIRTUALIZATION_THRESHOLD = 100;

// ─── Tri : icône selon l'état ─────────────────────────────────────────────────
function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ChevronUp className="ml-1 h-3 w-3 shrink-0" />;
  if (sorted === 'desc') return <ChevronDown className="ml-1 h-3 w-3 shrink-0" />;
  return <ChevronsUpDown className="text-muted-foreground/50 ml-1 h-3 w-3 shrink-0" />;
}

// ─── Props DataTable ──────────────────────────────────────────────────────────

export interface DataTableProps<TData> {
  /** Définitions des colonnes TanStack Table. */
  columns: ColumnDef<TData>[];
  /** Données à afficher. */
  data: TData[];
  /** Indicateur de chargement — affiche TableSkeleton. */
  loading?: boolean;
  /** Props transmises à TableSkeleton (ex : rows, columns count). */
  skeletonProps?: Omit<TableSkeletonProps, 'ref'>;
  /** Props transmises à EmptyState quand data est vide. */
  emptyState?: Omit<EmptyStateProps, 'ref'>;
  /** Tri contrôlé. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Filtres colonne contrôlés. */
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  /** Sélection de lignes contrôlée. */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  /** Pagination contrôlée. */
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  /**
   * Mode server-side : désactive le tri/pagination côté client
   * (manualSorting + manualPagination activés, rowCount requis).
   */
  manual?: boolean;
  /** Nombre total de lignes côté serveur (requis si manual). */
  rowCount?: number;
  /** Hauteur estimée d'une ligne pour la virtualisation (px). Défaut : 52. */
  estimatedRowHeight?: number;
  /** Classe CSS additionnelle sur le conteneur. */
  className?: string;
}

// ─── DataTable ────────────────────────────────────────────────────────────────

function DataTable<TData>({
  columns,
  data,
  loading = false,
  skeletonProps,
  emptyState,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  rowSelection,
  onRowSelectionChange,
  pagination,
  onPaginationChange,
  manual = false,
  rowCount,
  estimatedRowHeight = 52,
  className,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      ...(sorting !== undefined && { sorting }),
      ...(columnFilters !== undefined && { columnFilters }),
      ...(rowSelection !== undefined && { rowSelection }),
      ...(pagination !== undefined && { pagination }),
    },
    // Server-side
    manualSorting: manual,
    manualPagination: manual,
    manualFiltering: manual,
    rowCount: manual && rowCount !== undefined ? rowCount : undefined,
    // Handlers
    onSortingChange,
    onColumnFiltersChange,
    onRowSelectionChange,
    onPaginationChange,
    // Row models
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: rowSelection !== undefined,
  });

  // ── Virtualisation ──────────────────────────────────────────────────────────
  const shouldVirtualize = data.length > VIRTUALIZATION_THRESHOLD;
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? rows.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 8,
    enabled: shouldVirtualize,
  });

  // ── État loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <TableSkeleton columns={columns.length} {...skeletonProps} />
      </div>
    );
  }

  // ── Rendu d'une cellule (avec gestion money) ────────────────────────────────
  function renderCell(cell: Cell<TData, unknown>) {
    const meta = cell.column.columnDef.meta;
    if (meta?.type === 'money') {
      const raw = cell.getValue();
      const currency = meta.currency ?? ('XOF' as Currency);
      if (typeof raw === 'bigint') {
        return <MoneyDisplay amount={raw} currency={currency} />;
      }
      // Fallback : bigint encodé en string ou number
      if (typeof raw === 'string' || typeof raw === 'number') {
        try {
          return <MoneyDisplay amount={BigInt(raw)} currency={currency} />;
        } catch {
          // continue to default render
        }
      }
    }
    return flexRender(cell.column.columnDef.cell, cell.getContext());
  }

  // ── Rendu corps du tableau ──────────────────────────────────────────────────
  function renderBody() {
    // État vide
    if (rows.length === 0) {
      const colSpan = table.getAllColumns().length;
      const emptyProps: EmptyStateProps = {
        title: 'Aucun résultat',
        description: 'Aucune donnée ne correspond à vos critères.',
        ...emptyState,
      };
      return (
        <tr>
          <td colSpan={colSpan} className="p-0">
            <EmptyState {...emptyProps} />
          </td>
        </tr>
      );
    }

    if (shouldVirtualize) {
      const virtualItems = rowVirtualizer.getVirtualItems();
      const totalSize = rowVirtualizer.getTotalSize();
      const paddingTop = virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
      const paddingBottom =
        virtualItems.length > 0 ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0) : 0;

      return (
        <>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: paddingTop }} colSpan={table.getAllColumns().length} />
            </tr>
          )}
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;
            return (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>{renderCell(cell)}</TableCell>
                ))}
              </TableRow>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: paddingBottom }} colSpan={table.getAllColumns().length} />
            </tr>
          )}
        </>
      );
    }

    return rows.map((row) => (
      <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
        {row.getAllCells().map((cell) => (
          <TableCell key={cell.id}>{renderCell(cell)}</TableCell>
        ))}
      </TableRow>
    ));
  }

  // ── Pagination ──────────────────────────────────────────────────────────────
  const showPagination = pagination !== undefined || table.getPageCount() > 1;
  const currentPage = table.getState().pagination?.pageIndex ?? 0;
  const pageCount = table.getPageCount();

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {/* Conteneur tableau — ref pour virtualiser.
          `overflow-x-auto` est toujours actif pour que les tables larges scrollent
          horizontalement sur mobile sans casser le layout parent (cf. settings
          mobile <lg : les DataTable team/sessions/audit-log débordent du
          viewport 375px sans ça). En mode virtualisé, on ajoute aussi
          `overflow-y-auto` pour le scroll vertical (avec maxHeight 600px). */}
      <div
        ref={shouldVirtualize ? parentRef : undefined}
        className={cn('overflow-x-auto', shouldVirtualize && 'overflow-y-auto')}
        style={shouldVirtualize ? { maxHeight: 600 } : undefined}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'hover:text-foreground inline-flex cursor-pointer items-center gap-0 transition-colors',
                            sorted ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon sorted={sorted} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-1">
          <p className="text-muted-foreground text-xs">
            Page <span className="text-foreground font-medium">{currentPage + 1}</span>
            {pageCount > 0 && (
              <>
                {' '}
                sur <span className="text-foreground font-medium">{pageCount}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

DataTable.displayName = 'DataTable';

export { DataTable };
export type { ColumnDef, SortingState, ColumnFiltersState, RowSelectionState, PaginationState };
