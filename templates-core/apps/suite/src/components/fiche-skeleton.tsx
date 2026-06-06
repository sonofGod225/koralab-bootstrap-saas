/**
 * FicheSkeleton — squelette de chargement des fiches 360° (contact & produit).
 *
 * Reproduit la silhouette de la fiche (breadcrumb, header avatar + titre + méta,
 * barre d'onglets, grille 2 colonnes de cartes) pendant que `trpc.*.get` charge,
 * pour éviter le saut de mise en page une fois les données arrivées.
 */
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@__SCOPE__/ui/skeleton';

const FIELD_KEYS = ['a', 'b', 'c', 'd', 'e', 'f'];

function SkeletonCard({ fields = 0, textarea = false }: { fields?: number; textarea?: boolean }) {
  return (
    <div className="border-border-subtle bg-card rounded-[18px] border-[0.5px] p-[22px]">
      <Skeleton className="h-4 w-32" />
      {textarea ? (
        <Skeleton className="mt-4 h-20 w-full rounded-md" />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {FIELD_KEYS.slice(0, fields).map((k) => (
            <div key={k} className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FicheSkeleton({
  breadcrumb,
  tabs,
  avatarRounded,
}: {
  breadcrumb: string;
  tabs: string[];
  avatarRounded: string;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-8">
      <nav className="text-terre-500 mb-4 flex items-center gap-1.5 text-[12px]">
        <span>{breadcrumb}</span>
        <ChevronRight className="text-terre-400 h-3 w-3" />
        <Skeleton className="h-3.5 w-32" />
      </nav>

      <header className="mb-[22px] flex items-center gap-4">
        <Skeleton className={`h-16 w-16 ${avatarRounded}`} />
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-9 w-56" />
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      </header>

      <div className="border-border-subtle mb-5 flex gap-6 border-b-[0.5px] pb-2.5">
        {tabs.map((t) => (
          <Skeleton key={t} className="h-4 w-16" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="flex flex-col gap-5">
          <SkeletonCard fields={4} />
          <SkeletonCard fields={2} />
          <SkeletonCard textarea />
        </div>
        <div className="flex flex-col gap-5">
          <SkeletonCard fields={1} />
          <SkeletonCard fields={1} />
        </div>
      </div>
    </main>
  );
}
