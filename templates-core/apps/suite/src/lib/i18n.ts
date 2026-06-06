/**
 * __PROJECT_NAME__ -- i18n minimal (Story 1.9).
 *
 * Strategie MVP : on import les 4 JSON locales directement (Vite supporte
 * `import x from './x.json'` nativement), on les expose via `t(key)` avec
 * fallback automatique vers `fr-fr`. Detection locale au boot :
 *  1. localStorage `budi_locale` (client uniquement)
 *  2. cookie `budi_locale` (SSR + client)
 *  3. header `accept-language` (SSR uniquement, hors scope MVP -> default)
 *  4. fallback `fr-fr`
 *
 * Dette tech : pour le tree-shaking type-safe (chaque message = 1 fonction
 * exportee), migrer vers @inlang/paraglide-js v2 + plugin Vite (Story 2.x).
 * La structure des fichiers `messages/{locale}.json` + `project.inlang/`
 * est deja compatible Paraglide v2 -- la migration consistera juste a
 * remplacer ce module par les helpers generes.
 *
 * Note : la regle "pays SN/CI -> fr-af automatique" attend Better-Auth
 * (Story 3.x) qui aura le profil user avec country.
 */

import frFr from '../../messages/fr-fr.json';
import frAf from '../../messages/fr-af.json';
import en from '../../messages/en.json';
import wo from '../../messages/wo.json';

export type Locale = 'fr-fr' | 'fr-af' | 'en' | 'wo';

export const LOCALES: ReadonlyArray<Locale> = ['fr-fr', 'fr-af', 'en', 'wo'];
export const DEFAULT_LOCALE: Locale = 'fr-fr';
export const COOKIE_NAME = 'budi_locale';
export const STORAGE_KEY = 'budi_locale';

/** Etiquettes natives pour le `<LanguageSwitcher />`. */
export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  'fr-fr': 'Français',
  'fr-af': 'Français (Afrique)',
  en: 'English',
  wo: 'Wolof',
};

/** Locale BCP-47 utilisable avec `Intl.*` (fr-fr et fr-af partagent `fr-FR`). */
export const INTL_LOCALES: Readonly<Record<Locale, string>> = {
  'fr-fr': 'fr-FR',
  'fr-af': 'fr-FR',
  en: 'en-US',
  wo: 'fr-FR',
};

type MessageBundle = Record<string, string>;

const messages: Readonly<Record<Locale, MessageBundle>> = {
  'fr-fr': frFr,
  'fr-af': frAf,
  en,
  wo,
};

/**
 * Resout une cle de message pour une locale donnee, avec fallback fr-fr.
 * Retourne la cle litterale si manquante partout (pour faciliter le debug).
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  const bundle = messages[locale];
  if (key in bundle && bundle[key]) {
    return bundle[key];
  }
  // Fallback fr-fr (sauf si on est deja dessus, evite la boucle).
  if (locale !== DEFAULT_LOCALE) {
    const fallback = messages[DEFAULT_LOCALE];
    if (key in fallback && fallback[key]) {
      return fallback[key];
    }
  }
  // Cle manquante partout -> retourne la cle pour visibilite dev.
  return key;
}

/** Verifie qu'une chaine arbitraire est une `Locale` reconnue. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as ReadonlyArray<string>).includes(value);
}

/**
 * Detection cote client (au boot ou apres hydratation).
 * Lit localStorage en priorite, puis cookie, puis navigator.language.
 */
export function detectClientLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // localStorage indisponible (Safari private mode, etc.) -> on continue.
  }

  const fromCookie = readCookie(document.cookie, COOKIE_NAME);
  if (isLocale(fromCookie)) return fromCookie;

  // navigator.language : "fr-FR" -> "fr-fr", "en-US" -> "en". On reste
  // conservateur : on ne devine pas fr-af automatiquement (ce sera fait
  // via le pays user post-Better-Auth).
  const nav = window.navigator.language.toLowerCase();
  if (nav.startsWith('fr')) return 'fr-fr';
  if (nav.startsWith('en')) return 'en';
  if (nav.startsWith('wo')) return 'wo';

  return DEFAULT_LOCALE;
}

/**
 * Detection cote serveur (SSR). On ne dispose pas de localStorage --
 * uniquement cookie + accept-language.
 */
export function detectServerLocale(opts: {
  cookieHeader?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  const fromCookie = readCookie(opts.cookieHeader ?? '', COOKIE_NAME);
  if (isLocale(fromCookie)) return fromCookie;

  const accept = opts.acceptLanguage?.toLowerCase() ?? '';
  if (accept.includes('fr')) return 'fr-fr';
  if (accept.includes('en')) return 'en';
  if (accept.includes('wo')) return 'wo';

  return DEFAULT_LOCALE;
}

/**
 * Persiste la locale cote client : localStorage + cookie 1 an.
 * Le cookie permet au SSR de la recuperer au prochain navigate.
 */
export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
  // Cookie 1 an, SameSite=Lax pour rester compatible avec les redirects OAuth futurs.
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${locale}; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
}

/** Helper minimal lecture de cookie (pas de dependance externe). */
function readCookie(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    if (key && key.trim() === name) {
      return rest.join('=').trim();
    }
  }
  return null;
}
