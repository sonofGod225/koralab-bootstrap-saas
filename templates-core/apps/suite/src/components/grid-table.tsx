/**
 * <GridTable> — tableau « liste » CSS-grid, style canonique __PROJECT_NAME__.
 *
 * Source unique du style des listes `/contacts`, `/catalogue` et des pages
 * Paramètres (établissements, équipe, sessions, journal d'audit). Reproduit le
 * pattern d'origine (`features/contacts/contacts-list-page.tsx`) :
 *  - conteneur `rounded-[14px] border-[0.5px]` ;
 *  - en-tête `bg-base-25` 10px uppercase tracking 1px ;
 *  - lignes filet `border-t-[0.5px]`, `hover:bg-base-25`, densité compacte ;
 *  - skeleton calqué sur la grille ; vue cartes `<lg` via `mobileCard`.
 *
 * Sélection / liens / actions = cellules fournies par l'appelant (Checkbox,
 * `<Link>`, `<DropdownMenu>`). Pagination / empty-state / toolbars restent gérés
 * par la page (hors composant).
 */
import type { ReactNode } from 'react';
import { Skeleton } from '@__SCOPE__/ui/skeleton';

export interface GridColumn<T> {
  id: string;
  /** Libellé d'en-tête. Omis → cellule d'en-tête vide (colonnes avatar / actions). */
  header?: ReactNode;
  /** Piste CSS-grid : `'2fr'` | `'110px'` | `'40px'`… */
  width: string;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  /** Skeleton de chargement pour cette colonne (défaut : une ligne). */
  skeleton?: ReactNode;
}

export interface GridTableProps<T> {
  columns: GridColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
  /** Densité des lignes : `compact` = py-[11px] (contacts), `cozy` = py-3 (catalogue). */
  density?: 'compact' | 'cozy';
  /** Padding horizontal des lignes/en-tête (défaut `px-4` ; catalogue `px-[18px]`). */
  px?: string;
  /** Classe de ligne — **remplace** le hover par défaut (sélection, état inactif…). */
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Si fourni : split responsive (`hidden lg:block` desktop + `lg:hidden` cartes). */
  mobileCard?: (row: T) => ReactNode;
  mobileSkeletonClassName?: string;
  className?: string;
}

export function GridTable<T>({
  columns,
  data,
  getRowId,
  loading = false,
  skeletonRows = 8,
  density = 'compact',
  px = 'px-4',
  rowClassName,
  onRowClick,
  mobileCard,
  mobileSkeletonClassName = 'h-[76px] rounded-2xl',
  className,
}: GridTableProps<T>) {
  const template = columns.map((c) => c.width).join(' ');
  const py = density === 'cozy' ? 'py-3' : 'py-[11px]';
  const gridBase = `grid items-center gap-3.5 ${px}`;

  const desktop = (
    <div
      className={`border-border-subtle bg-card overflow-hidden rounded-[14px] border-[0.5px] ${className ?? ''}`}
    >
      {/* En-tête */}
      <div
        className={`text-base-500 bg-base-25 ${gridBase} py-[11px] text-[10px] font-semibold tracking-[1px] uppercase`}
        style={{ gridTemplateColumns: template }}
      >
        {columns.map((c) => (
          <span key={c.id} className={c.headerClassName}>
            {c.header ?? null}
          </span>
        ))}
      </div>

      {loading
        ? Array.from({ length: skeletonRows }).map((_, i) => (
            <div
              key={i}
              className={`border-border-subtle ${gridBase} border-t-[0.5px] ${py}`}
              style={{ gridTemplateColumns: template }}
            >
              {columns.map((c) => (
                <div key={c.id} className="min-w-0">
                  {c.skeleton ?? <Skeleton className="h-3.5 w-full rounded" />}
                </div>
              ))}
            </div>
          ))
        : data.map((row) => {
            const rc = rowClassName?.(row) ?? 'hover:bg-base-25';
            return (
              <div
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-border-subtle ${gridBase} border-t-[0.5px] ${py} transition-colors ${rc} ${onRowClick ? 'cursor-pointer' : ''}`}
                style={{ gridTemplateColumns: template }}
              >
                {columns.map((c) => (
                  <div key={c.id} className={`min-w-0 ${c.cellClassName ?? ''}`}>
                    {c.cell(row)}
                  </div>
                ))}
              </div>
            );
          })}
    </div>
  );

  if (!mobileCard) return desktop;

  return (
    <>
      <div className="hidden lg:block">{desktop}</div>
      <div className="flex flex-col gap-2.5 lg:hidden">
        {loading
          ? Array.from({ length: Math.min(skeletonRows, 6) }).map((_, i) => (
              <Skeleton key={i} className={mobileSkeletonClassName} />
            ))
          : data.map((row) => <div key={getRowId(row)}>{mobileCard(row)}</div>)}
      </div>
    </>
  );
}
