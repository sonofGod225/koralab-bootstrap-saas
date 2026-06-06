/**
 * <MoneyInput /> — Saisie monétaire Terre & Soleil.
 *
 * Accepte la saisie libre : "145000", "145 000", "145,000".
 * Normalise vers bigint (unités mineures) : XOF/XAF → 0 décimale,
 * EUR/USD → 2 décimales (centimes).
 * Affiche le montant groupé avec espace fine insécable (U+202F) + suffixe devise.
 *
 * Props :
 * - `value`         : bigint (unités mineures)
 * - `onValueChange` : (value: bigint) => void
 * - `currency`      : devise ISO 4217 (défaut 'XOF')
 * - `min?`/`max?`   : bigint, bornes optionnelles
 * + toutes les props HTML input standard (sauf `type`, `value`, `onChange`)
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Input } from './input';

// Espace fine insécable U+202F (thin no-break space) — évite le collapse CSS.
const TNBSP = ' ';

/** Nombre de décimales par devise (miroir de @__SCOPE__/types pour éviter la dépendance croisée). */
const DECIMALS: Record<string, number> = {
  XOF: 0,
  XAF: 0,
  EUR: 2,
  USD: 2,
};

/** Suffixe d'affichage par devise. */
const SUFFIX: Record<string, string> = {
  XOF: 'FCFA',
  XAF: 'FCFA',
  EUR: '€',
  USD: '$',
};

/**
 * Parse une chaîne saisie par l'utilisateur en bigint (unités mineures).
 * Accepte : "145000", "145 000", "145,000", "145.00", "1 450,50".
 * Supprime les séparateurs de milliers (espaces/tirets insécables, virgules comme
 * séparateur de groupe) puis interprète la virgule/point terminal comme décimale.
 */
function parseMoneyInput(raw: string, decimals: number): bigint | null {
  // Normalise les séparateurs de groupes : espaces variantes + tirets insécables
  const s = raw.replace(/\s/g, '');

  // Détecte la position du séparateur décimal (dernier . ou , si suivi de chiffres)
  const dotIdx = s.lastIndexOf('.');
  const commaIdx = s.lastIndexOf(',');

  let integerPart: string;
  let fractionalPart = '';

  const decSepIdx = Math.max(dotIdx, commaIdx);
  if (decSepIdx !== -1) {
    const afterDec = s.slice(decSepIdx + 1);
    // C'est un séparateur décimal si la partie après est courte (≤ decimals chiffres)
    if (afterDec.length <= Math.max(decimals, 2)) {
      integerPart = s.slice(0, decSepIdx).replace(/[.,]/g, '');
      fractionalPart = afterDec;
    } else {
      // Sinon c'est un séparateur de milliers → tout supprimer
      integerPart = s.replace(/[.,]/g, '');
    }
  } else {
    integerPart = s;
  }

  // Nettoie le reste
  integerPart = integerPart.replace(/[^0-9]/g, '');
  fractionalPart = fractionalPart.replace(/[^0-9]/g, '');

  if (integerPart === '' && fractionalPart === '') return null;

  if (decimals === 0) {
    return BigInt(integerPart || '0');
  }

  // Complète ou tronque la partie fractionnaire
  const frac = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const combined = `${integerPart || '0'}${frac}`;
  return BigInt(combined);
}

/**
 * Formate un bigint en chaîne d'affichage groupée + suffixe devise.
 * Exemples : 145000n XOF → "145 000 FCFA", 14500n EUR → "145,00 €"
 */
function formatMoneyInput(value: bigint, currency: string, locale = 'fr-FR'): string {
  const decimals = DECIMALS[currency] ?? 0;
  const suffix = SUFFIX[currency] ?? currency;

  let major: bigint;
  let minor = 0n;

  if (decimals === 0) {
    major = value < 0n ? -value : value;
  } else {
    const divisor = BigInt(10 ** decimals);
    const abs = value < 0n ? -value : value;
    major = abs / divisor;
    minor = abs % divisor;
  }

  const majorStr = new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(major);

  const numberStr =
    decimals === 0 ? majorStr : `${majorStr},${minor.toString().padStart(decimals, '0')}`;

  const sign = value < 0n ? '-' : '';

  if (currency === 'USD') {
    return `${sign}$${numberStr}`;
  }
  return `${sign}${numberStr}${TNBSP}${suffix}`;
}

export interface MoneyInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'min' | 'max'
> {
  /** Montant en unités mineures (0 décimale pour XOF/XAF, centimes pour EUR/USD). */
  value: bigint;
  /** Callback déclenché à chaque changement valide. */
  onValueChange: (value: bigint) => void;
  /** Devise ISO 4217. Défaut : 'XOF'. */
  currency?: string;
  /** Valeur minimale (unités mineures). */
  min?: bigint;
  /** Valeur maximale (unités mineures). */
  max?: bigint;
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      currency = 'XOF',
      min,
      max,
      disabled,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedby,
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const decimals = DECIMALS[currency] ?? 0;

    // État local : chaîne affichée dans le champ (saisie brute ou formatée)
    const [displayValue, setDisplayValue] = React.useState<string>(() =>
      value === 0n ? '' : formatMoneyInput(value, currency),
    );
    const [focused, setFocused] = React.useState(false);

    // Synchronise l'affichage si la prop `value` change depuis l'extérieur
    React.useEffect(() => {
      if (!focused) {
        setDisplayValue(value === 0n ? '' : formatMoneyInput(value, currency));
      }
    }, [value, currency, focused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setDisplayValue(raw);

      const parsed = parseMoneyInput(raw, decimals);
      if (parsed === null) return;

      let clamped = parsed;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;

      onValueChange(clamped);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      // En focus : affiche le montant brut sans formatage pour faciliter la saisie
      if (value !== 0n) {
        const decimals_ = DECIMALS[currency] ?? 0;
        if (decimals_ === 0) {
          setDisplayValue(value.toString());
        } else {
          const divisor = BigInt(10 ** decimals_);
          const major = value / divisor;
          const minor = value % divisor;
          setDisplayValue(`${major},${minor.toString().padStart(decimals_, '0')}`);
        }
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      // À la sortie : re-formate proprement
      setDisplayValue(value === 0n ? '' : formatMoneyInput(value, currency));
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        className={cn('tabular-nums', className)}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        {...props}
      />
    );
  },
);
MoneyInput.displayName = 'MoneyInput';

export { MoneyInput, parseMoneyInput, formatMoneyInput };
