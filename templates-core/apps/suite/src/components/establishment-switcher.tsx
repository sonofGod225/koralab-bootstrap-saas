/**
 * <EstablishmentSwitcher> — sélecteur d'établissement actif du header (Story 3.21).
 *
 * **Autorité serveur** : l'établissement actif vit dans la session
 * (`trpc.establishments.current`), pas dans un store client. Bascule via
 * `setActive` puis reload (le contexte serveur rebascule). Affichage :
 *  - ≥2 accessibles → dropdown (siège d'abord) ;
 *  - 1 accessible → label gris (pas de menu) ;
 *  - 0 / erreur → rien (mur invisible aux mono-sites).
 *
 * Construit sur `DropdownMenu` (calqué sur `<OrgSwitcher>`).
 */
import { useEffect, useState } from 'react';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@__SCOPE__/ui/dropdown-menu';
import { trpc } from '../lib/trpc-client';

interface Establishment {
  id: string;
  name: string;
  isPrimary: boolean;
}

export function EstablishmentSwitcher() {
  const [list, setList] = useState<Establishment[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      trpc.establishments.listMine.query().catch(() => [] as Establishment[]),
      trpc.establishments.current.query().catch(() => ({ id: null as string | null })),
    ]).then(([mine, current]) => {
      if (cancelled) return;
      setList(mine);
      setActiveId(current.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!list || list.length === 0) return null;

  const active = list.find((e) => e.id === activeId) ?? list[0];

  // Un seul établissement accessible → puce « Vue » sans menu.
  if (list.length === 1) {
    return (
      <span className="border-border bg-card inline-flex items-center gap-2 rounded-[10px] border py-1.5 pr-2.5 pl-2">
        <span className="bg-soleil-100 text-soleil-700 inline-flex h-[26px] w-[26px] items-center justify-center rounded-[8px]">
          <Building2 className="h-3.5 w-3.5" />
        </span>
        <span className="hidden flex-col items-start sm:flex">
          <span className="text-terre-500 text-[9px] leading-none font-semibold tracking-[1px] uppercase">
            Vue
          </span>
          <span className="text-terre-900 max-w-[160px] truncate text-[13px] leading-tight font-medium">
            {active?.name}
          </span>
        </span>
      </span>
    );
  }

  const select = async (id: string) => {
    if (id === active?.id) return;
    try {
      await trpc.establishments.setActive.mutate({ establishmentId: id });
      // Reload : le serveur rebascule le contexte établissement (autorité serveur).
      window.location.reload();
    } catch {
      // silencieux : l'utilisateur peut réessayer (pas de Toaster monté).
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="border-border bg-card hover:bg-terre-50 focus-visible:ring-soleil-400/40 inline-flex items-center gap-2 rounded-[10px] border py-1.5 pr-2.5 pl-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Changer d'établissement"
        >
          <span className="bg-soleil-100 text-soleil-700 inline-flex h-[26px] w-[26px] items-center justify-center rounded-[8px]">
            <Building2 className="h-3.5 w-3.5" />
          </span>
          <span className="hidden flex-col items-start sm:flex">
            <span className="text-terre-500 text-[9px] leading-none font-semibold tracking-[1px] uppercase">
              Vue
            </span>
            <span className="text-terre-900 max-w-[160px] truncate text-[13px] leading-tight font-medium">
              {active?.name ?? 'Établissement'}
            </span>
          </span>
          <ChevronsUpDown className="text-terre-500 h-3.5 w-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        {list.map((e) => (
          <DropdownMenuItem
            key={e.id}
            onSelect={() => void select(e.id)}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">
              {e.name}
              {e.isPrimary ? <span className="text-terre-400 text-[11px]"> · siège</span> : null}
            </span>
            {e.id === active?.id ? <Check className="text-soleil-600 h-4 w-4 shrink-0" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
