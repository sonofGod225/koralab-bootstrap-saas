/**
 * <PaginationBar> — pagination numérotée serveur, style canonique __PROJECT_NAME__.
 *
 * Source unique du bloc « Précédent / Page X/Y / Suivant / N sur Total » utilisé
 * sous les `GridTable` (`/contacts`, `/catalogue`, pages Paramètres). Composant
 * « contrôlé » : l'appelant détient le state `page` (0-indexé) et le `total`.
 * Ne rend rien si `total === 0`.
 */
import { Button } from '@__SCOPE__/ui/button';

export interface PaginationBarProps {
  /** Page courante, 0-indexée. */
  page: number;
  pageSize: number;
  /** Total (filtré) — pilote le nombre de pages et le libellé. */
  total: number;
  /** Nombre de lignes affichées sur la page courante (« N sur Total »). */
  shown: number;
  /** Nom singulier/pluriel pour le libellé (défaut générique). */
  noun?: [string, string];
  onPageChange: (page: number) => void;
}

export function PaginationBar({
  page,
  pageSize,
  total,
  shown,
  noun = ['élément', 'éléments'],
  onPageChange,
}: PaginationBarProps) {
  if (total === 0) return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-base-500 text-[12.5px]">
        {shown} sur {total} {total > 1 ? noun[1] : noun[0]}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
        >
          Précédent
        </Button>
        <span className="text-base-600 text-[12.5px]">
          Page {page + 1} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
