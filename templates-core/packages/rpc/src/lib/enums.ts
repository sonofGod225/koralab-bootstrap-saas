/**
 * Énumérations partagées entre routers RPC — source de vérité unique pour les
 * catalogues réutilisés par l'onboarding (Step 1 company, Step 7 prefs) et
 * `/settings/organization`. Un seul endroit à mettre à jour quand on ajoute
 * un pays, un secteur, etc.
 */

/** Pays supportés (UEMOA + CEMAC core). ISO 3166-1 alpha-2. */
export const COUNTRIES = ['SN', 'CI', 'BJ', 'TG', 'BF', 'ML', 'NE', 'GW', 'CM', 'GA'] as const;
export type CountryCode = (typeof COUNTRIES)[number];

/** Devises supportées (uppercase pour `organizations.currency` et ISO 4217). */
export const CURRENCIES = ['XOF', 'XAF', 'EUR', 'USD'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

/** Secteurs d'activité — alignés sur la grille du design V2 Step 1 onboarding. */
export const SECTORS = [
  'commerce',
  'services',
  'distribution',
  'resto',
  'artisanat',
  'tech',
] as const;
export type SectorCode = (typeof SECTORS)[number];

/** Taille d'entreprise — 3 paliers. */
export const SIZES = ['tpe', 'pme-growth', 'pme-struct'] as const;
export type SizeCode = (typeof SIZES)[number];
