/**
 * __PROJECT_NAME__ -- helpers de formatage localises.
 *
 * - `formatMoney` : reexport de `@__SCOPE__/ui/money-display` (single source
 *   of truth UX-DR6).
 * - `formatDate` : `Intl.DateTimeFormat` configure avec locale __PROJECT_NAME__.
 * - `formatNumber` : `Intl.NumberFormat` (utile hors monnaie : quantites, %).
 *
 * Les fonctions acceptent une `Locale` __PROJECT_NAME__ (`fr-fr`, `fr-af`, `en`,
 * `wo`) et mappent vers le tag BCP-47 approprie via `INTL_LOCALES`.
 */

import { formatMoney as formatMoneyBase } from '@__SCOPE__/ui/money-display';
import type { Currency } from '@__SCOPE__/types';
import type { Locale } from './i18n';
import { INTL_LOCALES, DEFAULT_LOCALE } from './i18n';

export function formatMoney(
  amount: bigint,
  currency: Currency,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return formatMoneyBase(amount, currency, INTL_LOCALES[locale]);
}

export function formatDate(
  date: Date | string | number,
  locale: Locale = DEFAULT_LOCALE,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const value = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], opts).format(value);
}

export function formatNumber(
  value: number | bigint,
  locale: Locale = DEFAULT_LOCALE,
  opts: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], opts).format(value);
}
