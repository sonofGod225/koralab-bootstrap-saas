/**
 * Types fondamentaux du bus d'événements __PROJECT_NAME__.
 *
 * Convention : chaque event a un `name` au format `entity.action` (kebab.dot).
 * Chaque module métier (example modules, etc.) étendra
 * cette union via **declaration merging** sur le namespace `__PROJECT_NAME__Events`
 * exporté ci-dessous. Voir `packages/events/src/events/<module>.ts` (à venir
 * Story 5.7+ pour les modules métier).
 *
 * Pour Story 1.13, on définit les 4 events MVP critiques :
 * - `invoice.created`           — émis quand une facture passe en draft (Epic 8)
 * - `payment.confirmed`         — émis quand un paiement PSP est confirmé webhook (Epic 9)
 * - `module.activated`          — émis quand un onboarding module est complété (Epic 7)
 *
 * Référence : architecture.md step 5 "Event Bus convention".
 */

import type { Brand } from '@__SCOPE__/types';

/**
 * Événements identifiables uniformément. Le `name` est un string littéral
 * discriminant ; le `payload` est typé selon le `name`.
 */
export interface BaseEvent<TName extends string, TPayload> {
  /** Nom de l'événement, format `entity.action`. */
  readonly name: TName;
  /** Payload typé spécifique à cet event. */
  readonly payload: TPayload;
  /** ID unique de l'event (UUID v7 généré côté émetteur). Pour idempotence consumers. */
  readonly id: string;
  /** Timestamp d'émission ISO-8601. */
  readonly occurredAt: string;
}

// === 4 events MVP critiques (Story 1.13) ===

export type InvoiceCreated = BaseEvent<
  'invoice.created',
  {
    invoiceId: string;
    organizationId: string;
    customerId: string;
    /** Montant en plus petite unité (bigint sérialisé en string pour JSON Workers Queues). */
    totalAmount: string;
    currency: string;
  }
>;

export type PaymentConfirmed = BaseEvent<
  'payment.confirmed',
  {
    paymentId: string;
    organizationId: string;
    /** Invoice optionnellement liée (paiement direct sans facture possible). */
    invoiceId?: string;
    /** Provider PSP : wave, paystack, stripe, flutterwave. */
    provider: string;
    amount: string;
    currency: string;
  }
>;

export type ModuleActivated = BaseEvent<
  'module.activated',
  {
    organizationId: string;
    /** Identifiant du module : 'facturation', 'encaissements', 'crm', etc. */
    moduleId: string;
    /** User ayant complété l'onboarding du module. */
    activatedBy: string;
  }
>;

/**
 * Union des events natifs Story 1.13. Les modules futurs étendent ce type via
 * declaration merging sur `__PROJECT_NAME__EventMap` ci-dessous.
 */
export type BudiEvent = InvoiceCreated | PaymentConfirmed | ModuleActivated;

/**
 * Carte name → event complet. Utilisé pour typer `emit()` et `on()` de manière
 * stricte (le nom détermine le payload).
 *
 * Pour étendre : chaque module ajoute son event dans `packages/events/src/events/<module>.ts`
 * et fait du `declare module '@__SCOPE__/events' { interface __PROJECT_NAME__EventMap { ... } }`.
 */
export interface __PROJECT_NAME__EventMap {
  'invoice.created': InvoiceCreated;
  'payment.confirmed': PaymentConfirmed;
  'module.activated': ModuleActivated;
}

/**
 * Nom d'événement valide — calculé à partir de la map.
 */
export type BudiEventName = keyof __PROJECT_NAME__EventMap;

/**
 * Payload associé à un nom d'event donné.
 */
export type BudiEventPayload<TName extends BudiEventName> = __PROJECT_NAME__EventMap[TName]['payload'];

/**
 * Handler typé pour un event particulier.
 */
export type EventHandler<TName extends BudiEventName> = (
  event: __PROJECT_NAME__EventMap[TName],
) => void | Promise<void>;

/**
 * Brand ID pour traçabilité event (utile pour idempotence et tracing).
 */
export type EventId = Brand<string, 'EventId'>;
export const EventId = (value: string): EventId => value as EventId;
