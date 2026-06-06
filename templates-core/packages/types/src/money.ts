/**
 * Money — représentation des montants monétaires
 *
 * Règle d'or : **JAMAIS de float pour de l'argent**. On utilise `bigint` (entier centimes).
 * Référence : architecture.md step 5 patterns + Dinero.js v2 (Story 1.x quand on attaque facturation).
 *
 * Conventions OHADA (UEMOA + CEMAC) :
 * - XOF (FCFA Afrique de l'Ouest, BCEAO) : 0 décimale, donc la "subunit" = 1 XOF
 * - XAF (FCFA Afrique Centrale, BEAC) : 0 décimale, idem
 * - EUR, USD : 2 décimales, subunit = centime
 *
 * Stockage Postgres : colonne `bigint` (jamais `numeric`/`decimal` pour éviter les conversions JS).
 */

export type Currency = 'XOF' | 'XAF' | 'EUR' | 'USD';

export interface Money {
  /** Montant en plus petite unité (centimes pour EUR/USD, XOF entier pour XOF/XAF) */
  readonly amount: bigint;
  readonly currency: Currency;
}

/**
 * Nombre de décimales par devise (= log10 du subunit).
 * XOF/XAF n'ont pas de décimales (1 FCFA = 1 subunit).
 */
export const currencyDecimals: Readonly<Record<Currency, number>> = {
  XOF: 0,
  XAF: 0,
  EUR: 2,
  USD: 2,
};

export const money = (amount: bigint, currency: Currency): Money => ({ amount, currency });
