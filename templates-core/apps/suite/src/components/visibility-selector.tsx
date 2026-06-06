/**
 * VisibilitySelector — choix de visibilité hybride (édition), design v3 §VisibilitySelector.
 *
 * Deux options : « Visible par tous les établissements » (org-wide, recommandé) ou
 * « Restreindre à un établissement » (Select). Émet `null` (org-wide) ou un id.
 * Source des établissements : `trpc.establishments.listMine`.
 */
import { Building2, Globe2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@__SCOPE__/ui/select';
import { useEstablishments } from '../lib/queries';

export interface VisibilitySelectorProps {
  /** `null` = visible org-wide ; sinon id de l'établissement restreint. */
  value: string | null;
  onChange: (establishmentId: string | null) => void;
}

function RadioMark({ on }: { on: boolean }) {
  return (
    <span
      className={[
        'bg-card inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[0.5px]',
        on ? 'border-brand-500' : 'border-border',
      ].join(' ')}
    >
      {on && <span className="bg-brand-500 h-[9px] w-[9px] rounded-full" />}
    </span>
  );
}

export function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  const establishments = useEstablishments().data ?? [];
  const orgWide = value === null;
  const defaultEstablishment = establishments.at(0)?.id;

  return (
    <div className="border-border bg-base-25 overflow-hidden rounded-[14px] border-[0.5px]">
      {/* Option org-wide */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`flex w-full items-center gap-2.5 p-3 text-left transition-colors ${orgWide ? 'bg-brand-50' : 'bg-transparent'}`}
      >
        <span
          className={`inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] ${orgWide ? 'bg-brand-100 text-brand-700' : 'bg-base-100 text-base-600'}`}
        >
          <Globe2 className="h-[15px] w-[15px]" />
        </span>
        <div className="flex-1">
          <div className="text-base-900 text-[13px] font-medium">
            Visible par tous les établissements
          </div>
          <div className="text-base-500 mt-px text-[11px]">
            Recommandé · l'organisation partage ce contact partout
          </div>
        </div>
        <RadioMark on={orgWide} />
      </button>

      <div className="bg-border h-px" />

      {/* Option restreinte */}
      <div
        className={`flex items-center gap-2.5 p-3 ${!orgWide ? 'bg-brand-50' : 'bg-transparent'}`}
      >
        <span
          className={`inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] ${!orgWide ? 'bg-brand-100 text-brand-700' : 'bg-base-100 text-base-600'}`}
        >
          <Building2 className="h-[15px] w-[15px]" />
        </span>
        <div className="flex-1">
          <div className={`text-base-900 text-[13px] font-medium ${!orgWide ? 'mb-2' : ''}`}>
            Restreindre à un établissement
          </div>
          {!orgWide && (
            <Select value={value} onValueChange={(v) => onChange(v)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Choisir un établissement…" />
              </SelectTrigger>
              <SelectContent>
                {establishments.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {orgWide ? (
          <button
            type="button"
            onClick={() => onChange(defaultEstablishment ?? null)}
            disabled={!defaultEstablishment}
            className="text-brand-700 shrink-0 text-[12px] font-medium disabled:opacity-40"
          >
            Choisir
          </button>
        ) : (
          <RadioMark on />
        )}
      </div>
    </div>
  );
}
