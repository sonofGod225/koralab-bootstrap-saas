/**
 * EventBus — interface pub/sub typée + implémentation in-memory.
 *
 * - `InMemoryEventBus` : synchrone, conserve les handlers dans une Map.
 *   Utilisé pour tests unitaires et dev local sans Cloudflare Queues binding.
 * - `WorkersQueueEventBus` : voir `./workers-queue-bus.ts` (adapter prod).
 *
 * Convention `name = entity.action` (ex: `invoice.created`). Le compilateur
 * empêche les noms non déclarés grâce à `BudiEventName`.
 */

import type { BudiEventName, BudiEventPayload, __PROJECT_NAME__EventMap, EventHandler } from './types';

/**
 * Interface publique du bus d'événements. Toute implémentation (in-memory,
 * Workers Queues, Redis pub/sub futur) doit satisfaire ce contrat.
 */
export interface EventBus {
  /**
   * Émet un événement. Les handlers enregistrés via `on()` sont invoqués
   * (synchrone in-memory, async via queue en prod).
   *
   * @param name    Nom de l'event (typé via union `BudiEventName`)
   * @param payload Payload typé selon le nom
   */
  emit<TName extends BudiEventName>(name: TName, payload: BudiEventPayload<TName>): Promise<void>;

  /**
   * Enregistre un handler pour un nom d'event donné. Retourne une fonction
   * `unsubscribe()` pour le retirer.
   */
  on<TName extends BudiEventName>(name: TName, handler: EventHandler<TName>): () => void;
}

/**
 * Génère un ID d'événement minimal (Web Crypto si dispo, fallback Math.random).
 * Pas un UUIDv7 strict, suffisant pour la traçabilité in-memory dev/tests.
 */
const generateEventId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback non-cryptographique pour environnements sans Web Crypto
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Implémentation synchrone in-memory. Idéale pour tests unitaires + dev local.
 *
 * Les handlers sont stockés dans une `Map<name, Set<handler>>` pour permettre
 * plusieurs subscribers par event et retrait O(1).
 */
export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<BudiEventName, Set<EventHandler<BudiEventName>>>();

  async emit<TName extends BudiEventName>(
    name: TName,
    payload: BudiEventPayload<TName>,
  ): Promise<void> {
    const subs = this.handlers.get(name);
    if (!subs || subs.size === 0) {
      return;
    }
    // Construction de l'event complet
    const event = {
      name,
      payload,
      id: generateEventId(),
      occurredAt: new Date().toISOString(),
    } as __PROJECT_NAME__EventMap[TName];

    // On itère sur une copie pour permettre aux handlers de s'unsubscribe sans
    // perturber l'itération en cours.
    const handlersSnapshot = Array.from(subs);
    for (const handler of handlersSnapshot) {
      // Typage interne forcé car la map stocke des handlers généralisés.
      const typed = handler as EventHandler<TName>;
      // On await pour propager les erreurs asynchrones (tests deterministes)
      await typed(event);
    }
  }

  on<TName extends BudiEventName>(name: TName, handler: EventHandler<TName>): () => void {
    let subs = this.handlers.get(name);
    if (!subs) {
      subs = new Set();
      this.handlers.set(name, subs);
    }
    // Typage interne : on accepte de stocker un handler généralisé
    const generic = handler as EventHandler<BudiEventName>;
    subs.add(generic);

    return () => {
      const current = this.handlers.get(name);
      if (current) {
        current.delete(generic);
        if (current.size === 0) {
          this.handlers.delete(name);
        }
      }
    };
  }

  /**
   * Helper test-only : vide tous les handlers. Pratique pour isoler des tests.
   */
  clear(): void {
    this.handlers.clear();
  }
}
