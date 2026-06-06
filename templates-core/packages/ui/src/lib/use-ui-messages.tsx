/**
 * @__SCOPE__/ui — i18n React : `<UILocaleProvider>` + `useUIMessages()` (Story 2.15).
 *
 * Les apps consommatrices restent maîtresses de la locale active : elles
 * l'injectent une fois, en racine, via `<UILocaleProvider locale={…}>`.
 * Sans provider, les primitives retombent sur `fr-fr` (locale de base).
 *
 * `useUIMessages()` expose :
 * - `t(key, params?)`    — message traduit + interpolation `{param}`
 * - `formatNumber(n)`    — `Intl.NumberFormat` câblé sur la locale active
 * - `formatDate(d)`      — `Intl.DateTimeFormat` câblé sur la locale active
 * - `locale` / `intlLocale`
 *
 * Ce barrel ré-exporte aussi l'API pure de `./i18n`, donc
 * `import { … } from '@__SCOPE__/ui/i18n'` suffit côté apps.
 */

import * as React from 'react';
import {
  DEFAULT_UI_LOCALE,
  UI_INTL_LOCALES,
  translateUI,
  type UILocale,
  type UIMessageKey,
  type UIMessageParams,
} from './i18n';

export * from './i18n';

const UILocaleContext = React.createContext<UILocale>(DEFAULT_UI_LOCALE);

export interface UILocaleProviderProps {
  /** Locale active — pilotée par l'app (cf. `apps/suite/src/lib/i18n.ts`). */
  locale: UILocale;
  children: React.ReactNode;
}

/** Fournit la locale active à toutes les primitives `@__SCOPE__/ui` descendantes. */
function UILocaleProvider({ locale, children }: UILocaleProviderProps) {
  return <UILocaleContext.Provider value={locale}>{children}</UILocaleContext.Provider>;
}
UILocaleProvider.displayName = 'UILocaleProvider';

/** Locale active courante (défaut `fr-fr` hors provider). */
function useUILocale(): UILocale {
  return React.useContext(UILocaleContext);
}

export interface UIMessages {
  locale: UILocale;
  intlLocale: string;
  t: (key: UIMessageKey, params?: UIMessageParams) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
}

/**
 * Hook i18n des primitives. Mémoïsé sur la locale active.
 *
 * @example
 * const { t, formatNumber } = useUIMessages();
 * <span>{t('form.amountMin', { min: formatNumber(1000) })}</span>
 */
function useUIMessages(): UIMessages {
  const locale = useUILocale();
  return React.useMemo<UIMessages>(() => {
    const intlLocale = UI_INTL_LOCALES[locale];
    return {
      locale,
      intlLocale,
      t: (key, params) => translateUI(key, locale, params),
      formatNumber: (value, options) => new Intl.NumberFormat(intlLocale, options).format(value),
      formatDate: (value, options) => new Intl.DateTimeFormat(intlLocale, options).format(value),
    };
  }, [locale]);
}

export { UILocaleProvider, useUILocale, useUIMessages };
