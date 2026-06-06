/**
 * <CountrySelect /> — Sélection de pays Base & Brand.
 *
 * Combobox recherchable (Popover + Command) affichant une puce ISO2 mono
 * et le nom du pays en français. Pas d'emoji — règle design system __PROJECT_NAME__.
 *
 * Props :
 * - `value`         : code ISO2 sélectionné (ex: 'SN')
 * - `onValueChange` : (iso2: string) => void
 * - `ordered?`      : liste ISO2 prioritaires en tête (défaut : priorités __PROJECT_NAME__)
 * - `placeholder`   : texte du trigger quand rien n'est sélectionné
 * + props div standard
 *
 * Dataset interne : ≈ 30 pays couvrant l'Afrique de l'Ouest/Centrale francophone
 * + quelques pays supplémentaires (Maghreb, Europe, Amériques).
 * Dialcode inclus pour l'affichage secondaire.
 */

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from './command';

// ─── Dataset interne ──────────────────────────────────────────────────────

export interface CountryData {
  iso2: string;
  name: string;
  dialCode: string;
}

/**
 * Dataset pays : Afrique de l'Ouest/Centrale francophone + pays prioritaires
 * __PROJECT_NAME__ + quelques pays non-africains pertinents.
 * Noms en français. Dialcodes sans le '+'.
 */
const COUNTRY_DATA: CountryData[] = [
  // Afrique de l'Ouest francophone (UEMOA)
  { iso2: 'SN', name: 'Sénégal', dialCode: '221' },
  { iso2: 'CI', name: "Côte d'Ivoire", dialCode: '225' },
  { iso2: 'BJ', name: 'Bénin', dialCode: '229' },
  { iso2: 'BF', name: 'Burkina Faso', dialCode: '226' },
  { iso2: 'ML', name: 'Mali', dialCode: '223' },
  { iso2: 'TG', name: 'Togo', dialCode: '228' },
  { iso2: 'GN', name: 'Guinée', dialCode: '224' },
  { iso2: 'GW', name: 'Guinée-Bissau', dialCode: '245' },
  { iso2: 'MR', name: 'Mauritanie', dialCode: '222' },
  { iso2: 'NE', name: 'Niger', dialCode: '227' },
  // Afrique Centrale (CEMAC)
  { iso2: 'CM', name: 'Cameroun', dialCode: '237' },
  { iso2: 'GA', name: 'Gabon', dialCode: '241' },
  { iso2: 'CG', name: 'Congo', dialCode: '242' },
  { iso2: 'CD', name: 'RD Congo', dialCode: '243' },
  { iso2: 'CF', name: 'Rép. centrafricaine', dialCode: '236' },
  { iso2: 'TD', name: 'Tchad', dialCode: '235' },
  { iso2: 'GQ', name: 'Guinée équatoriale', dialCode: '240' },
  // Afrique de l'Est
  { iso2: 'RW', name: 'Rwanda', dialCode: '250' },
  { iso2: 'BI', name: 'Burundi', dialCode: '257' },
  { iso2: 'KE', name: 'Kenya', dialCode: '254' },
  { iso2: 'TZ', name: 'Tanzanie', dialCode: '255' },
  // Afrique de l'Ouest anglophone
  { iso2: 'NG', name: 'Nigeria', dialCode: '234' },
  { iso2: 'GH', name: 'Ghana', dialCode: '233' },
  { iso2: 'GM', name: 'Gambie', dialCode: '220' },
  { iso2: 'SL', name: 'Sierra Leone', dialCode: '232' },
  { iso2: 'LR', name: 'Liberia', dialCode: '231' },
  // Afrique Australe
  { iso2: 'ZA', name: 'Afrique du Sud', dialCode: '27' },
  // Océan Indien
  { iso2: 'MG', name: 'Madagascar', dialCode: '261' },
  { iso2: 'MU', name: 'Maurice', dialCode: '230' },
  { iso2: 'KM', name: 'Comores', dialCode: '269' },
  // Maghreb
  { iso2: 'MA', name: 'Maroc', dialCode: '212' },
  { iso2: 'DZ', name: 'Algérie', dialCode: '213' },
  { iso2: 'TN', name: 'Tunisie', dialCode: '216' },
  // Europe
  { iso2: 'FR', name: 'France', dialCode: '33' },
  { iso2: 'BE', name: 'Belgique', dialCode: '32' },
  { iso2: 'CH', name: 'Suisse', dialCode: '41' },
  { iso2: 'LU', name: 'Luxembourg', dialCode: '352' },
  { iso2: 'GB', name: 'Royaume-Uni', dialCode: '44' },
  { iso2: 'DE', name: 'Allemagne', dialCode: '49' },
  { iso2: 'ES', name: 'Espagne', dialCode: '34' },
  { iso2: 'IT', name: 'Italie', dialCode: '39' },
  { iso2: 'PT', name: 'Portugal', dialCode: '351' },
  // Amériques
  { iso2: 'US', name: 'États-Unis', dialCode: '1' },
  { iso2: 'CA', name: 'Canada', dialCode: '1' },
];

/** Ordre par défaut des pays prioritaires en tête de liste. */
const DEFAULT_ORDERED: string[] = [
  'SN',
  'CI',
  'BJ',
  'BF',
  'ML',
  'TG',
  'GN',
  'CM',
  'GA',
  'RW',
  'KE',
  'NG',
  'GH',
  'ZA',
];

// ─── Puce pays ────────────────────────────────────────────────────────────

function CountryBadge({ iso2 }: { iso2: string }) {
  return (
    <span className="bg-muted text-foreground shrink-0 rounded px-1 py-0.5 font-mono text-xs tracking-wider">
      {iso2}
    </span>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────

export interface CountrySelectProps {
  /** Code ISO2 sélectionné. */
  value: string;
  /** Callback déclenché à chaque changement. */
  onValueChange: (iso2: string) => void;
  /** Pays affichés en tête (par ordre de priorité). */
  ordered?: string[];
  /** Texte du trigger quand rien n'est sélectionné. */
  placeholder?: string;
  /** Classes additionnelles. */
  className?: string;
  /** Désactivé. */
  disabled?: boolean;
  /** aria-invalid. */
  'aria-invalid'?: boolean | 'true' | 'false';
  /** aria-describedby. */
  'aria-describedby'?: string;
}

const CountrySelect = React.forwardRef<HTMLDivElement, CountrySelectProps>(
  (
    {
      value,
      onValueChange,
      ordered = DEFAULT_ORDERED,
      placeholder = 'Sélectionner un pays',
      className,
      disabled,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedby,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    const selected = COUNTRY_DATA.find((c) => c.iso2 === value);

    // Sépare pays prioritaires et le reste
    const { priority, rest } = React.useMemo(() => {
      const orderedSet = new Set(ordered);

      const priorityList = ordered
        .map((iso2) => COUNTRY_DATA.find((c) => c.iso2 === iso2))
        .filter((c): c is CountryData => c !== undefined);

      const restList = COUNTRY_DATA.filter((c) => !orderedSet.has(c.iso2));

      return { priority: priorityList, rest: restList };
    }, [ordered]);

    /** Filtre une liste selon la recherche. */
    const filterList = (list: CountryData[]) => {
      if (!search) return list;
      const q = search.toLowerCase();
      return list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.iso2.toLowerCase().includes(q) ||
          c.dialCode.includes(q),
      );
    };

    const filteredPriority = filterList(priority);
    const filteredRest = filterList(rest);
    const hasResults = filteredPriority.length > 0 || filteredRest.length > 0;

    const handleSelect = (iso2: string) => {
      onValueChange(iso2);
      setOpen(false);
      setSearch('');
    };

    return (
      <div ref={ref} className={cn('inline-flex', className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedby}
              disabled={disabled}
              className={cn(
                'border-border bg-background text-foreground justify-between rounded-[12px] px-3.5 font-normal',
                !selected && 'text-muted-foreground',
              )}
            >
              {selected ? (
                <span className="flex items-center gap-2">
                  <CountryBadge iso2={selected.iso2} />
                  <span className="truncate">{selected.name}</span>
                </span>
              ) : (
                <span>{placeholder}</span>
              )}
              <ChevronsUpDown className="text-muted-foreground ml-2 h-4 w-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Rechercher un pays…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                {!hasResults && <CommandEmpty>Aucun pays trouvé.</CommandEmpty>}

                {/* Pays prioritaires */}
                {filteredPriority.length > 0 && (
                  <CommandGroup heading="Pays prioritaires">
                    {filteredPriority.map((c) => (
                      <CommandItem
                        key={c.iso2}
                        value={`${c.iso2} ${c.name} ${c.dialCode}`}
                        onSelect={() => handleSelect(c.iso2)}
                        className="flex items-center gap-2"
                      >
                        <CountryBadge iso2={c.iso2} />
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          +{c.dialCode}
                        </span>
                        {value === c.iso2 && <Check className="text-brand-600 h-4 w-4 shrink-0" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Séparateur si les deux groupes ont des résultats */}
                {filteredPriority.length > 0 && filteredRest.length > 0 && <CommandSeparator />}

                {/* Reste des pays */}
                {filteredRest.length > 0 && (
                  <CommandGroup heading="Tous les pays">
                    {filteredRest.map((c) => (
                      <CommandItem
                        key={c.iso2}
                        value={`${c.iso2} ${c.name} ${c.dialCode}`}
                        onSelect={() => handleSelect(c.iso2)}
                        className="flex items-center gap-2"
                      >
                        <CountryBadge iso2={c.iso2} />
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          +{c.dialCode}
                        </span>
                        {value === c.iso2 && <Check className="text-brand-600 h-4 w-4 shrink-0" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
CountrySelect.displayName = 'CountrySelect';

export { CountrySelect, COUNTRY_DATA };
