/**
 * @__SCOPE__/events — Event bus typé pub/sub
 *
 * Foundation Story 1.13. Wiring production (Cloudflare Queues binding) en Story 5.7.
 *
 * Exports :
 * - Types : `BudiEvent`, `BudiEventName`, `__PROJECT_NAME__EventMap`, `EventHandler`, `EventId`
 * - Implems : `InMemoryEventBus` (tests/dev), `WorkersQueueEventBus` (prod)
 */
export type {
  BaseEvent,
  BudiEvent,
  BudiEventName,
  BudiEventPayload,
  __PROJECT_NAME__EventMap,
  EventHandler,
  InvoiceCreated,
  PaymentConfirmed,
  ModuleActivated,
} from './types';
export { EventId } from './types';

export type { EventBus } from './bus';
export { InMemoryEventBus } from './bus';

export type { QueueProducerLike, WorkersQueueEventBusEnv } from './workers-queue-bus';
export { WorkersQueueEventBus } from './workers-queue-bus';
