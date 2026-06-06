/**
 * <LanguageSwitcher /> -- Selecteur de langue Base & Brand.
 *
 * Affiche les 4 locales __PROJECT_NAME__ avec leurs noms natifs. Au changement :
 *  1. persiste localStorage `budi_locale` + cookie `budi_locale` (1 an),
 *  2. recharge la page pour que SSR + composants relisent la nouvelle
 *     locale (strategie simple MVP, pas de context React).
 *
 * Pourquoi un reload plutot qu'un Context ? Tant qu'on est sur le stub
 * i18n maison (cf. lib/i18n.ts), pas de hot-swap signal-based. Quand on
 * migrera vers Paraglide v2 (Story 2.x), on remplacera ce composant par
 * un `<select>` qui appelle `setLocale()` reactif sans reload.
 */

import { useState } from 'react';
import { LOCALES, LOCALE_LABELS, setLocale, DEFAULT_LOCALE } from '../lib/i18n';
import type { Locale } from '../lib/i18n';

export interface LanguageSwitcherProps {
  /** Locale courante (pour SSR : passer la valeur detectee server-side). */
  currentLocale?: Locale;
  className?: string;
}

export function LanguageSwitcher({
  currentLocale = DEFAULT_LOCALE,
  className,
}: LanguageSwitcherProps) {
  const [value, setValue] = useState<Locale>(currentLocale);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as Locale;
    setValue(next);
    setLocale(next);
    // Reload pour que SSR + tous les composants relisent la nouvelle locale.
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  return (
    <label className={className}>
      <span className="sr-only">Langue</span>
      <select
        value={value}
        onChange={handleChange}
        className="border-base-200 bg-base-25 text-base-900 focus-visible:ring-brand-400/40 h-10 rounded-[12px] border px-3 text-sm focus:outline-none focus-visible:ring-2"
        aria-label="Choisir la langue"
      >
        {LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {LOCALE_LABELS[loc]}
          </option>
        ))}
      </select>
    </label>
  );
}
