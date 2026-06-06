/**
 * WorkersQueueEventBus — adapter Cloudflare Workers Queues.
 *
 * Production : sérialise l'event en JSON et l'enqueue sur `env.QUEUE_EVENTS`.
 * Le consumer (déclaré côté `apps/api/wrangler.toml` en Story 5.7) traitera
 * les events par batch (max 100 events / invocation) avec retry exponentiel
 * et DLQ.
 *
 * En Story 1.13, ce bus est un **squelette** : pas encore câblé sur un binding
 * réel. La méthode `on()` throw — la souscription côté queue se fait via le
 * `queue()` handler du Worker, pas via JS in-process.
 */

import type { BudiEventName, BudiEventPayload, __PROJECT_NAME__EventMap, EventHandler } from './types';
import type { EventBus } from './bus';

/**
 * Interface minimale du binding Cloudflare Queues utilisé par le bus.
 * On ne dépend pas de `@cloudflare/workers-types` ici pour ne pas alourdir
 * le package — chaque consumer (apps/api) injectera son binding typé.
 */
export interface QueueProducerLike {
  send(message: unknown, options?: { contentType?: string }): Promise<void>;
}

export interface WorkersQueueEventBusEnv {
  /** Binding Queues exposé via wrangler.toml. Câblé Story 5.7. */
  QUEUE_EVENTS?: QueueProducerLike;
}

const generateEventId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Bus prod qui sérialise sur Workers Queues. À utiliser quand `env.QUEUE_EVENTS`
 * est binding-ready (Story 5.7+). En attendant, instanciable pour tests de
 * sérialisation mais `on()` n'est pas supporté côté in-process.
 */
export class WorkersQueueEventBus implements EventBus {
  constructor(private readonly env: WorkersQueueEventBusEnv) {}

  async emit<TName extends BudiEventName>(
    name: TName,
    payload: BudiEventPayload<TName>,
  ): Promise<void> {
    const queue = this.env.QUEUE_EVENTS;
    if (!queue) {
      // Story 1.13 : binding pas encore câblé. On log et on no-op pour ne pas
      // bloquer les modules qui appellent emit() en dev.
      console.warn(
        `[WorkersQueueEventBus] QUEUE_EVENTS binding absent — event '${name}' non publié (sera câblé Story 5.7)`,
      );
      return;
    }

    const event = {
      name,
      payload,
      id: generateEventId(),
      occurredAt: new Date().toISOString(),
    } as __PROJECT_NAME__EventMap[TName];

    // Sérialisation JSON explicite ; Workers Queues accepte unknown mais on
    // garde le contrôle pour éviter les surprises avec BigInt (qui throw
    // sur JSON.stringify natif).
    const message = JSON.stringify(event);
    await queue.send(message, { contentType: 'json' });
  }

  /**
   * `on()` n'a pas de sens in-process pour un bus queue : la souscription se
   * fait via le handler `queue()` du Worker côté consumer.
   */
  on<TName extends BudiEventName>(_name: TName, _handler: EventHandler<TName>): () => void {
    throw new Error(
      '[WorkersQueueEventBus] on() not supported — define a queue() handler in apps/api worker instead (Story 5.7).',
    );
  }
}
