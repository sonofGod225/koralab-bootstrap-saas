/**
 * Tests Story 1.13 — Event bus shell.
 *
 * Vérifie le contrat pub/sub : un handler enregistré sur `name` est invoqué
 * avec le bon payload quand `emit(name, payload)` est appelé.
 *
 * On utilise un event natif (`invoice.created`) pour rester aligné avec la
 * map typée publique. L'AC parle de `bus.emit('test.ping', {})` mais on
 * préfère un nom déclaré pour valider que le typage strict marche.
 */
import { describe, expect, it, vi } from 'vitest';
import type { EventHandler, InvoiceCreated, ModuleActivated } from '../types';
import { InMemoryEventBus } from '../bus';
import { WorkersQueueEventBus, type QueueProducerLike } from '../workers-queue-bus';

describe('InMemoryEventBus', () => {
  it('invoque le handler avec le payload exact quand emit() est appelé', async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn<EventHandler<'invoice.created'>>();

    bus.on('invoice.created', handler);

    await bus.emit('invoice.created', {
      invoiceId: 'inv_test_001',
      organizationId: 'org_test_001',
      customerId: 'cust_test_001',
      totalAmount: '150000',
      currency: 'XOF',
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const received = handler.mock.calls[0]?.[0] as InvoiceCreated;
    expect(received.name).toBe('invoice.created');
    expect(received.payload.invoiceId).toBe('inv_test_001');
    expect(received.payload.currency).toBe('XOF');
    expect(typeof received.id).toBe('string');
    expect(typeof received.occurredAt).toBe('string');
  });

  it("supporte plusieurs handlers pour le même event et n'en oublie aucun", async () => {
    const bus = new InMemoryEventBus();
    const h1 = vi.fn<EventHandler<'module.activated'>>();
    const h2 = vi.fn<EventHandler<'module.activated'>>();

    bus.on('module.activated', h1);
    bus.on('module.activated', h2);

    await bus.emit('module.activated', {
      organizationId: 'org_test',
      moduleId: 'facturation',
      activatedBy: 'user_test',
    });

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
    const ev = h1.mock.calls[0]?.[0] as ModuleActivated;
    expect(ev.payload.moduleId).toBe('facturation');
  });

  it("n'invoque pas un handler désinscrit via le retour de on()", async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn<EventHandler<'invoice.created'>>();

    const unsubscribe = bus.on('invoice.created', handler);
    unsubscribe();

    await bus.emit('invoice.created', {
      invoiceId: 'inv_test_002',
      organizationId: 'org_test_001',
      customerId: 'cust_test_001',
      totalAmount: '5000',
      currency: 'XOF',
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('no-op silencieux si aucun handler enregistré', async () => {
    const bus = new InMemoryEventBus();
    await expect(
      bus.emit('payment.confirmed', {
        paymentId: 'pay_test',
        organizationId: 'org_test',
        provider: 'wave',
        amount: '50000',
        currency: 'XOF',
      }),
    ).resolves.toBeUndefined();
  });
});

describe('WorkersQueueEventBus', () => {
  it("sérialise et envoie l'event sur le binding QUEUE_EVENTS quand présent", async () => {
    const sendMock = vi.fn<QueueProducerLike['send']>().mockResolvedValue(undefined);
    const queue: QueueProducerLike = { send: sendMock };
    const bus = new WorkersQueueEventBus({ QUEUE_EVENTS: queue });

    await bus.emit('invoice.created', {
      invoiceId: 'inv_q_001',
      organizationId: 'org_q_001',
      customerId: 'cust_q_001',
      totalAmount: '99000',
      currency: 'XOF',
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const [message, options] = sendMock.mock.calls[0] ?? [];
    expect(typeof message).toBe('string');
    expect(options).toEqual({ contentType: 'json' });
    const parsed = JSON.parse(message as string) as {
      name: string;
      payload: { invoiceId: string };
    };
    expect(parsed.name).toBe('invoice.created');
    expect(parsed.payload.invoiceId).toBe('inv_q_001');
  });

  it('no-op + warn si QUEUE_EVENTS absent (Story 5.7 pas encore câblée)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const bus = new WorkersQueueEventBus({});

    await bus.emit('invoice.created', {
      invoiceId: 'inv_001',
      organizationId: 'org_001',
      customerId: 'cus_001',
      totalAmount: '1000',
      currency: 'XOF',
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('on() throw (la subscription se fait via le handler queue() du Worker)', () => {
    const bus = new WorkersQueueEventBus({});
    expect(() => bus.on('invoice.created', () => undefined)).toThrow(/not supported/);
  });
});
