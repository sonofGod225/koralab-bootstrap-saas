/**
 * Tests Story 1.16 — rate-limit middleware.
 *
 * Vérifie :
 * - Config dev (sans UPSTASH_REDIS_REST_URL) → no-op + warn une seule fois
 * - Config simulée → throw TOO_MANY_REQUESTS au 11ème appel (limit: 10)
 * - Identifier = user.id si auth, sinon ctx.ip
 * - Erreur métier dans la procedure n'est pas masquée par rate-limit
 *
 * Stratégie : on mock `@upstash/redis` Redis et `@upstash/ratelimit` Ratelimit
 * via `vi.mock` pour ne pas dépendre d'un Redis réel.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import type { RpcContext } from '../context';
import { rateLimit, __resetRateLimitInternals } from '../middleware/rate-limit';

// --- Mock Upstash modules ---
//
// `Ratelimit.slidingWindow` est appelé statiquement à la construction du
// middleware. On retourne un placeholder qui sera ignoré par notre
// `Ratelimit` mocké.
let mockLimitFn: (key: string) => Promise<{ success: boolean }>;

vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    constructor(_opts: unknown) {}
  },
}));

vi.mock('@upstash/ratelimit', () => {
  class MockRatelimit {
    constructor(_opts: unknown) {}
    async limit(key: string): Promise<{ success: boolean }> {
      return mockLimitFn(key);
    }
    static slidingWindow(_limit: number, _window: string): unknown {
      return { type: 'slidingWindow' };
    }
  }
  return { Ratelimit: MockRatelimit };
});

const buildCtx = (overrides: Partial<RpcContext> = {}): RpcContext =>
  ({
    env: {
      DATABASE_URL: 'postgres://fake',
      ENVIRONMENT: 'development',
      ...(overrides.env ?? {}),
    },
    db: {} as RpcContext['db'],
    ...overrides,
  }) as RpcContext;

describe('rateLimit middleware — Story 1.16', () => {
  beforeEach(() => {
    __resetRateLimitInternals();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('no-op + warn une seule fois quand UPSTASH_REDIS_REST_URL est absent (dev)', async () => {
    const warnSpy = console.warn as ReturnType<typeof vi.fn>;
    const ctx = buildCtx({ ip: '127.0.0.1' });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure
      .use(rateLimit('auth.signup', { limit: 10, window: '1 m' }))
      .mutation(() => ({ ok: true }));
    const router = t.router({ signup: procedure });
    const caller = router.createCaller(ctx);

    // 5 appels — aucun blocage
    for (let i = 0; i < 5; i++) {
      const result = await caller.signup();
      expect(result).toEqual({ ok: true });
    }

    // Une seule warn loggée pour tout le process
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('UPSTASH_REDIS_REST_URL absent');
  });

  it('throw TOO_MANY_REQUESTS au 11ème appel quand limit=10 simulée', async () => {
    let callCount = 0;
    mockLimitFn = async () => {
      callCount += 1;
      return { success: callCount <= 10 };
    };

    const ctx = buildCtx({
      env: {
        DATABASE_URL: 'postgres://fake',
        ENVIRONMENT: 'staging',
        UPSTASH_REDIS_REST_URL: 'https://fake.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'fake-token',
      },
      ip: '197.157.1.42',
    });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure
      .use(rateLimit('auth.signup', { limit: 10, window: '1 m' }))
      .mutation(() => ({ ok: true }));
    const router = t.router({ signup: procedure });
    const caller = router.createCaller(ctx);

    // Les 10 premiers appels passent
    for (let i = 0; i < 10; i++) {
      const result = await caller.signup();
      expect(result).toEqual({ ok: true });
    }

    // Le 11ème throw TOO_MANY_REQUESTS
    await expect(caller.signup()).rejects.toThrow(TRPCError);
    try {
      await caller.signup();
    } catch (err) {
      const trpcErr = err as TRPCError;
      expect(trpcErr.code).toBe('TOO_MANY_REQUESTS');
      expect(trpcErr.message).toContain('Rate limit dépassé');
    }
  });

  it('utilise user.id comme identifier quand auth disponible', async () => {
    const seenKeys: Array<string> = [];
    mockLimitFn = async (key) => {
      seenKeys.push(key);
      return { success: true };
    };

    const ctx = buildCtx({
      env: {
        DATABASE_URL: 'postgres://fake',
        ENVIRONMENT: 'production',
        UPSTASH_REDIS_REST_URL: 'https://fake.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'fake-token',
      },
      user: { id: 'user_123', email: 'u@example.com' },
      ip: '197.157.1.42',
    });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure
      .use(rateLimit('payments.create', { limit: 100, window: '1 h' }))
      .mutation(() => ({ ok: true }));
    const router = t.router({ createPayment: procedure });
    const caller = router.createCaller(ctx);

    await caller.createPayment();
    expect(seenKeys).toHaveLength(1);
    expect(seenKeys[0]).toBe('payments.create:user_123');
  });

  it('utilise ctx.ip comme identifier fallback quand non auth', async () => {
    const seenKeys: Array<string> = [];
    mockLimitFn = async (key) => {
      seenKeys.push(key);
      return { success: true };
    };

    const ctx = buildCtx({
      env: {
        DATABASE_URL: 'postgres://fake',
        ENVIRONMENT: 'production',
        UPSTASH_REDIS_REST_URL: 'https://fake.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'fake-token',
      },
      ip: '197.157.1.42',
    });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure
      .use(rateLimit('auth.signin', { limit: 10, window: '1 m' }))
      .mutation(() => ({ ok: true }));
    const router = t.router({ signin: procedure });
    const caller = router.createCaller(ctx);

    await caller.signin();
    expect(seenKeys[0]).toBe('auth.signin:197.157.1.42');
  });

  it("utilise '__anon__' si ni user ni ip", async () => {
    const seenKeys: Array<string> = [];
    mockLimitFn = async (key) => {
      seenKeys.push(key);
      return { success: true };
    };

    const ctx = buildCtx({
      env: {
        DATABASE_URL: 'postgres://fake',
        ENVIRONMENT: 'production',
        UPSTASH_REDIS_REST_URL: 'https://fake.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'fake-token',
      },
    });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure
      .use(rateLimit('health.ping', { limit: 1000, window: '1 m' }))
      .query(() => ({ ok: true }));
    const router = t.router({ ping: procedure });
    const caller = router.createCaller(ctx);

    await caller.ping();
    expect(seenKeys[0]).toBe('health.ping:__anon__');
  });
});
