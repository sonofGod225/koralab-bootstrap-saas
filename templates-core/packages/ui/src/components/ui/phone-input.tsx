/**
 * <PhoneInput /> — Saisie téléphone internationale Base & Brand.
 *
 * Props :
 * - `value`          : string E.164 (ex: '+221781234567')
 * - `onValueChange`  : (value: string, isValid: boolean) => void
 * - `defaultCountry` : code ISO2 (défaut 'SN')
 * - `allowed?`       : liste ISO2 restreinte (si absent : tous pays autorisés)
 * + props input standard
 *
 * Interface :
 * - Sélecteur de pays (puce mono ISO2 + indicatif) via Popover + Command.
 * - Champ numéro formaté en live (AsYouType de libphonenumber-js).
 * - Valeur exposée toujours en E.164 ; `isValid` exposé dans le callback.
 * - Affichage pays : puce ISO2 `bg-muted rounded font-mono` — pas d'emoji
 *   (règle design system __PROJECT_NAME__).
 */

import * as React from 'react';
import {
  AsYouType,
  parsePhoneNumber,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
} from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from './input';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './command';

// ─── Dataset pays (tous les pays, Afrique francophone prioritaire) ──────────

interface CountryEntry {
  iso2: CountryCode;
  name: string;
}

/** Pays mis en tête de liste (marchés __PROJECT_NAME__). */
const PRIORITY: CountryCode[] = [
  'SN',
  'CI',
  'BJ',
  'BF',
  'ML',
  'TG',
  'GN',
  'NE',
  'CM',
  'GA',
  'CG',
  'CD',
  'MR',
  'GH',
  'NG',
  'FR',
];

/** Noms de pays localisés en français (fallback : code ISO2). */
const REGION_NAMES =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['fr'], { type: 'region' })
    : null;

function countryName(iso2: CountryCode): string {
  try {
    return REGION_NAMES?.of(iso2) ?? iso2;
  } catch {
    return iso2;
  }
}

/** Emoji drapeau dérivé de l'ISO2 (indicateurs régionaux Unicode). */
function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/[A-Z]/g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/**
 * Liste complète des pays (tous ceux connus de libphonenumber), pays
 * prioritaires en tête puis ordre alphabétique français.
 */
const COUNTRIES: CountryEntry[] = (() => {
  const all = getCountries().map((iso2) => ({ iso2, name: countryName(iso2) }));
  const priorityRank = new Map(PRIORITY.map((iso2, i) => [iso2, i]));
  return all.sort((a, b) => {
    const ra = priorityRank.get(a.iso2);
    const rb = priorityRank.get(b.iso2);
    if (ra !== undefined || rb !== undefined) {
      return (ra ?? Number.MAX_SAFE_INTEGER) - (rb ?? Number.MAX_SAFE_INTEGER);
    }
    return a.name.localeCompare(b.name, 'fr');
  });
})();

/** Retourne l'indicatif international (+XXX) pour un pays ISO2. */
function dialCode(iso2: CountryCode): string {
  try {
    return `+${getCountryCallingCode(iso2)}`;
  } catch {
    return '';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Formate un numéro en live avec AsYouType (national, sans indicatif).
 * Si le numéro est vide ou invalide, retourne `raw` tel quel.
 */
function formatAsYouType(raw: string, country: CountryCode): string {
  if (!raw) return '';
  const formatter = new AsYouType(country);
  return formatter.input(raw);
}

/**
 * Convertit la saisie nationale + pays en E.164.
 * Retourne null si le parse échoue.
 */
function toE164(nationalNumber: string, country: CountryCode): string | null {
  try {
    const parsed = parsePhoneNumber(nationalNumber, country);
    return parsed.format('E.164');
  } catch {
    return null;
  }
}

/**
 * Extrait le numéro national depuis une valeur E.164.
 * Ex: '+221781234567' → '781234567' pour SN.
 */
function fromE164(e164: string, country: CountryCode): string {
  if (!e164) return '';
  try {
    const parsed = parsePhoneNumber(e164, country);
    return parsed.nationalNumber;
  } catch {
    // Supprime l'indicatif brut si le parse échoue
    const code = dialCode(country);
    if (e164.startsWith(code)) return e164.slice(code.length);
    return e164.replace(/^\+/, '');
  }
}

// ─── Puce pays ────────────────────────────────────────────────────────────

function Flag({ iso2 }: { iso2: string }) {
  return (
    <span className="text-[17px] leading-none" aria-hidden="true">
      {flagEmoji(iso2)}
    </span>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────

export interface PhoneInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  /** Numéro de téléphone au format E.164. */
  value: string;
  /** Callback — reçoit le numéro E.164 et un booléen de validité. */
  onValueChange: (value: string, isValid: boolean) => void;
  /** Pays sélectionné par défaut (code ISO2). Défaut : 'SN'. */
  defaultCountry?: CountryCode;
  /** Si fourni, restreint les pays disponibles dans le sélecteur. */
  allowed?: CountryCode[];
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      defaultCountry = 'SN',
      allowed,
      disabled,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedby,
      placeholder,
      ...props
    },
    ref,
  ) => {
    const [country, setCountry] = React.useState<CountryCode>(defaultCountry);
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    // Numéro national affiché dans le champ
    const [display, setDisplay] = React.useState<string>(() =>
      value ? fromE164(value, defaultCountry) : '',
    );

    // Re-dérive le numéro national affiché quand `value` (E.164) ou le pays change.
    React.useEffect(() => {
      setDisplay(value ? fromE164(value, country) : '');
    }, [value, country]);

    const filteredCountries = React.useMemo(() => {
      const list = allowed ? COUNTRIES.filter((c) => allowed.includes(c.iso2)) : COUNTRIES;
      if (!search) return list;
      const q = search.toLowerCase();
      return list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.iso2.toLowerCase().includes(q) ||
          dialCode(c.iso2).includes(q),
      );
    }, [allowed, search]);

    const handleCountrySelect = (iso2: CountryCode) => {
      setCountry(iso2);
      setOpen(false);
      setSearch('');
      // Re-parse le numéro avec le nouveau pays
      const e164 = toE164(display, iso2);
      const valid = e164 ? isValidPhoneNumber(e164) : false;
      onValueChange(e164 ?? '', valid);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Formate en live
      const formatted = formatAsYouType(raw, country);
      setDisplay(formatted);

      const e164 = toE164(formatted, country);
      const valid = e164 ? isValidPhoneNumber(e164) : false;
      onValueChange(e164 ?? '', valid);
    };

    return (
      <div className="flex items-center gap-1">
        {/* Sélecteur pays */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="Sélectionner le pays"
              className={cn(
                'border-border bg-card text-foreground focus-visible:ring-brand-400/40 flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] border px-2.5 text-sm transition-shadow focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <Flag iso2={country} />
              <span className="text-muted-foreground text-xs tabular-nums">
                {dialCode(country)}
              </span>
              <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Rechercher un pays…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                <CommandGroup>
                  {filteredCountries.map((c) => (
                    <CommandItem
                      key={c.iso2}
                      value={`${c.iso2} ${c.name} ${dialCode(c.iso2)}`}
                      onSelect={() => handleCountrySelect(c.iso2)}
                      className="flex items-center gap-2"
                    >
                      <Flag iso2={c.iso2} />
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {dialCode(c.iso2)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Champ numéro */}
        <Input
          ref={ref}
          type="tel"
          inputMode="tel"
          className={cn('flex-1', className)}
          value={display}
          placeholder={placeholder ?? `ex: ${dialCode(country)} 78 123 45 67`}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          onChange={handleNumberChange}
          {...props}
        />
      </div>
    );
  },
);
PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
