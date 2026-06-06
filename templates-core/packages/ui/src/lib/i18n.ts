/**
 * @__SCOPE__/ui — i18n des primitives (Story 2.15).
 *
 * Les primitives @__SCOPE__/ui exposent un petit jeu de chaînes (placeholders,
 * aria-labels, messages de validation) traduites dans les 4 locales __PROJECT_NAME__ :
 * `fr-fr`, `fr-af` (Français d'Afrique), `en`, `wo` (Wolof).
 *
 * Ce module est **pur** (aucune dépendance React) : il expose les bundles
 * importés depuis `packages/ui/messages/{locale}.json` + un resolver
 * `translateUI()`. Le hook React `useUIMessages()` vit dans `./use-ui-messages`.
 *
 * Stratégie alignée sur `apps/suite/src/lib/i18n.ts` (Story 1.9) : runtime
 * minimal au-dessus du format de messages inlang, fallback automatique vers
 * `fr-fr`. La migration vers le compilateur Paraglide JS reste une dette
 * commune documentée côté app.
 *
 * Note Wolof : la couverture `wo` est MVP best-effort — révision par un
 * linguiste wolof à prévoir (cf. `packages/ui/CHANGELOG.md`).
 */

import frFr from '../../messages/fr-fr.json';
import frAf from '../../messages/fr-af.json';
import en from '../../messages/en.json';
import wo from '../../messages/wo.json';

export type UILocale = 'fr-fr' | 'fr-af' | 'en' | 'wo';

export const UI_LOCALES: ReadonlyArray<UILocale> = ['fr-fr', 'fr-af', 'en', 'wo'];
export const DEFAULT_UI_LOCALE: UILocale = 'fr-fr';

/** Locale BCP-47 pour `Intl.*` (fr-fr, fr-af et wo partagent `fr-FR`). */
export const UI_INTL_LOCALES: Readonly<Record<UILocale, string>> = {
  'fr-fr': 'fr-FR',
  'fr-af': 'fr-FR',
  en: 'en-US',
  wo: 'fr-FR',
};

/** Clés de message disponibles — dérivées du bundle de base `fr-fr`. */
export type UIMessageKey = keyof typeof frFr;

export type UIMessageParams = Readonly<Record<string, string | number>>;

const BUNDLES: Readonly<Record<UILocale, Readonly<Record<string, string>>>> = {
  'fr-fr': frFr,
  'fr-af': frAf,
  en,
  wo,
};

/** Interpole les placeholders `{nom}` d'un message avec `params`. */
function interpolate(template: string, params?: UIMessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match: string, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/**
 * Résout une clé de message pour une locale, avec fallback `fr-fr` puis la
 * clé littérale (pour visibilité en dev si une clé est absente partout).
 */
export function translateUI(
  key: UIMessageKey,
  locale: UILocale = DEFAULT_UI_LOCALE,
  params?: UIMessageParams,
): string {
  const raw = BUNDLES[locale][key] ?? BUNDLES[DEFAULT_UI_LOCALE][key] ?? (key as string);
  return interpolate(raw, params);
}

/** Garde de type : `value` est-elle une `UILocale` reconnue ? */
export function isUILocale(value: unknown): value is UILocale {
  return typeof value === 'string' && (UI_LOCALES as ReadonlyArray<string>).includes(value);
}
