/**
 * <MoneyDisplay /> -- Affichage monetaire localise Terre & Soleil.
 *
 * Regles UX (cf. docs/design-system/project/SKILL.md, UX-DR6) :
 * - XOF/XAF : 0 decimale, thin no-break space U+202F entre groupes
 *   de 3 chiffres -> "145 000 FCFA".
 * - EUR/USD : 2 decimales, virgule decimale francaise -> "145,00 EUR".
 * - Police `tabular-nums` pour aligner verticalement dans les tableaux.
 *
 * Stockage source : `bigint` (centimes pour EUR/USD, unite entiere pour
 * XOF/XAF). Voir `packages/types/src/money.ts`.
 */

import type { Currency } from '@__SCOPE__/types';
import { currencyDecimals } from '@__SCOPE__/types';
import { cn } from '../lib/utils';

// Espace insecable normale (U+00A0). On evite d'inserer des caracteres
// "irreguliers" directement dans la source — eslint `no-irregular-whitespace`
// les bloque dans les commentaires et template strings.
const NBSP = ' ';

export interface MoneyDisplayProps {
  /** Montant en plus petite unite (centimes pour EUR/USD, unite pour XOF/XAF). */
  amount: bigint;
  /** Devise ISO 4217. */
  currency: Currency;
  /** Locale BCP-47 (default `fr-FR` pour fr-fr/fr-af). */
  locale?: string;
  /** Taille typographique. */
  size?: 'sm' | 'md' | 'lg';
  /** Classes additionnelles. */
  className?: string;
}

const sizeClasses: Record<NonNullable<MoneyDisplayProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
};

/**
 * Formate un montant bigint dans sa locale + devise.
 * Helper reutilisable hors du composant React (cf. apps/suite/src/lib/format.ts).
 */
export function formatMoney(amount: bigint, currency: Currency, locale = 'fr-FR'): string {
  const decimals = currencyDecimals[currency];
  // Pour XOF/XAF : on affiche tel quel (unite entiere).
  // Pour EUR/USD : on divise par 100 en gardant la precision via string.
  let major: bigint;
  let minor = 0n;
  if (decimals === 0) {
    major = amount;
  } else {
    const divisor = BigInt(10 ** decimals);
    major = amount / divisor;
    minor = amount < 0n ? -amount % divisor : amount % divisor;
  }

  const sign = amount < 0n ? '-' : '';
  const majorAbs = amount < 0n ? -major : major;
  // `Intl.NumberFormat` ne gere pas `bigint` avec decimales artificielles --
  // on construit la chaine nous-memes pour preserver la precision. Le
  // formatteur Intl insere deja une NBSP (U+202F ou U+00A0) entre les groupes
  // de 3 chiffres en locale `fr-FR`, c'est l'effet recherche (UX-DR6).
  const majorStr = new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(majorAbs);

  const numberStr =
    decimals === 0 ? majorStr : `${majorStr},${minor.toString().padStart(decimals, '0')}`;

  // Suffixe devise selon convention africaine francophone :
  // XOF/XAF -> "FCFA" suffixe (jamais "F CFA" ni "CFA").
  // EUR     -> "EUR" suffixe (symbole U+20AC). USD -> "$" prefixe.
  if (currency === 'XOF' || currency === 'XAF') {
    return `${sign}${numberStr}${NBSP}FCFA`;
  }
  if (currency === 'EUR') {
    return `${sign}${numberStr}${NBSP}€`;
  }
  // USD : prefixe.
  return `${sign}$${numberStr}`;
}

export function MoneyDisplay({
  amount,
  currency,
  locale = 'fr-FR',
  size = 'md',
  className,
}: MoneyDisplayProps) {
  const formatted = formatMoney(amount, currency, locale);
  return (
    <span
      className={cn('tabular-nums', sizeClasses[size], className)}
      // Preserve les espaces fines insecables face a d'eventuels collapses CSS.
      style={{ whiteSpace: 'nowrap' }}
    >
      {formatted}
    </span>
  );
}
