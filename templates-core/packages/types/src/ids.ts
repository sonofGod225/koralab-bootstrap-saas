/**
 * Branded IDs — sécurité de typage forte pour les identifiants métier
 *
 * Pattern : `type FooId = Brand<string, 'FooId'>`
 * Empêche les confusions du genre `getInvoice(userId)` à la compilation.
 *
 * Conventions :
 * - Tous les IDs sont des UUID v7 (timestampés, ordonnables)
 * - Stockés en `text` dans Postgres (pas `uuid` natif pour pouvoir versionner le format)
 * - Convention de génération : `crypto.randomUUID()` dans une story 1.x (pour UUIDv7 quand stable)
 */

declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [__brand]: B };

// === Identity ===
export type OrganizationId = Brand<string, 'OrganizationId'>;
export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type MembershipId = Brand<string, 'MembershipId'>;

// === Constructors safe (à utiliser uniquement après validation) ===
export const OrganizationId = (value: string): OrganizationId => value as OrganizationId;
export const UserId = (value: string): UserId => value as UserId;
export const SessionId = (value: string): SessionId => value as SessionId;
export const MembershipId = (value: string): MembershipId => value as MembershipId;
