/**
 * Labels FR + icônes pour les énumérations entreprise (pays, secteur, taille,
 * devise). Source unique pour `/onboarding/company` (Step 1) et
 * `/settings/organization`. Les codes correspondent à ceux exposés par
 * `packages/rpc/src/lib/enums.ts` (source de vérité côté serveur).
 */
import type { LucideIcon } from 'lucide-react';
import { Briefcase, Cpu, Hammer, ShoppingBag, Truck, Utensils } from 'lucide-react';

/**
 * Pays — liste complète (UEMOA + CEMAC core). Onboarding peut en exposer
 * un sous-ensemble selon le design ; settings expose tout.
 */
export const COUNTRY_OPTIONS = [
  { value: 'SN', label: '🇸🇳 Sénégal' },
  { value: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'TG', label: '🇹🇬 Togo' },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'ML', label: '🇲🇱 Mali' },
  { value: 'NE', label: '🇳🇪 Niger' },
  { value: 'GW', label: '🇬🇼 Guinée-Bissau' },
  { value: 'CM', label: '🇨🇲 Cameroun' },
  { value: 'GA', label: '🇬🇦 Gabon' },
] as const;

/** Codes pays dérivés de COUNTRY_OPTIONS (exhaustivité au compile-time). */
type CountryValue = (typeof COUNTRY_OPTIONS)[number]['value'];

/**
 * Identifiant légal d'entreprise par pays : nom officiel (libellé du champ),
 * nom du pays (pour l'aide) et placeholder indicatif. Le RCCM (registre OHADA)
 * reste accepté partout — rappelé via `legalIdHelper`. Saisie libre, la
 * vérification API (DGI/RCCM) viendra avec la Story KYC.
 */
type LegalIdMeta = { label: string; country: string; placeholder: string };

export const LEGAL_ID_META: Record<CountryValue, LegalIdMeta> = {
  SN: { label: 'NINEA', country: 'Sénégal', placeholder: '005112345' },
  CI: { label: 'NCC', country: "Côte d'Ivoire", placeholder: '1614770 N' },
  BJ: { label: 'IFU', country: 'Bénin', placeholder: '3201912345678' },
  TG: { label: 'NIF', country: 'Togo', placeholder: '1000123456' },
  BF: { label: 'IFU', country: 'Burkina Faso', placeholder: '00012345A' },
  ML: { label: 'NIF', country: 'Mali', placeholder: '0123456789' },
  NE: { label: 'NIF', country: 'Niger', placeholder: '1234567/A' },
  GW: { label: 'NIF', country: 'Guinée-Bissau', placeholder: '123456789' },
  CM: { label: 'NIU', country: 'Cameroun', placeholder: 'P012345678901A' },
  GA: { label: 'NIF', country: 'Gabon', placeholder: '123456 A' },
};

/** Métadonnées du champ `legalId` pour un pays (fallback SN si code inconnu). */
export function legalIdMeta(country: string): LegalIdMeta {
  return country in LEGAL_ID_META ? LEGAL_ID_META[country as CountryValue] : LEGAL_ID_META.SN;
}

/** Texte d'aide du champ `legalId` : rappelle le RCCM accepté + la saisie libre. */
export function legalIdHelper(country: string): string {
  const m = legalIdMeta(country);
  return `${m.label} (${m.country}) — ou RCCM. Saisie libre, vérification ultérieure.`;
}

/** Devises supportées (uppercase, ISO 4217). */
export const CURRENCY_OPTIONS = [
  { value: 'XOF', label: 'XOF — Franc CFA UEMOA' },
  { value: 'XAF', label: 'XAF — Franc CFA CEMAC' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — Dollar US' },
] as const;

/** Secteurs d'activité avec icône Lucide. Partagé avec RadioCardGrid onboarding. */
export const SECTOR_OPTIONS: ReadonlyArray<{
  value: 'commerce' | 'services' | 'distribution' | 'resto' | 'artisanat' | 'tech';
  label: string;
  icon: LucideIcon;
}> = [
  { value: 'commerce', label: 'Commerce & boutique', icon: ShoppingBag },
  { value: 'services', label: 'Services', icon: Briefcase },
  { value: 'distribution', label: 'Distribution', icon: Truck },
  { value: 'resto', label: 'Restauration', icon: Utensils },
  { value: 'artisanat', label: 'Artisanat', icon: Hammer },
  { value: 'tech', label: 'Tech & digital', icon: Cpu },
];

/** Taille d'entreprise — 3 paliers. */
export const SIZE_OPTIONS: ReadonlyArray<{
  value: 'tpe' | 'pme-growth' | 'pme-struct';
  label: string;
  description: string;
}> = [
  { value: 'tpe', label: 'TPE', description: '1 à 5 personnes' },
  { value: 'pme-growth', label: 'PME en croissance', description: '6 à 30 personnes' },
  { value: 'pme-struct', label: 'PME structurée', description: '30+ personnes' },
];
