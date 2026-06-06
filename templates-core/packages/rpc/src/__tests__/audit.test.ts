/**
 * Tests Story 1.15 — audit middleware.
 *
 * Vérifie :
 * - Une mutation auditée réussie déclenche un INSERT dans `audit_log`
 *   (action = procedure path, input redacté, user/org/session/ip/userAgent)
 * - Une query auditée ne déclenche PAS d'insertion (mutations only)
 * - Une mutation qui throw ne déclenche PAS d'insertion (success only)
 * - Les champs sensibles (`password`, `token`, etc.) sont redactés dans
 *   `details.input`
 *
 * Stratégie : on mock `ctx.db.insert(...).values(...)` pour capturer les
 * appels sans toucher à Neon. La table réelle est validée via mcp__Neon en
 * environnement intégré.
 */
import { describe, expect, it, vi } from 'vitest';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import type { RpcContext } from '../context';
import { auditMiddleware } from '../middleware/audit';

// Construit un faux ctx.db.insert(...).values(...) qui capture les inserts.
const buildFakeDb = (): {
  insertCalls: Array<{ table: unknown; values: unknown }>;
  db: RpcContext['db'];
} => {
  const insertCalls: Array<{ table: unknown; values: unknown }> = [];
  const db = {
    insert: (table: unknown) => ({
      values: (vals: unknown) => {
        insertCalls.push({ table, values: vals });
        return Promise.resolve(undefined);
      },
    }),
  } as unknown as RpcContext['db'];
  return { insertCalls, db };
};

const buildCtx = (overrides: Partial<RpcContext> = {}): RpcContext => {
  const { db } = buildFakeDb();
  return {
    env: {
      DATABASE_URL: 'postgres://fake',
      ENVIRONMENT: 'development',
    },
    db,
    ...overrides,
  } as RpcContext;
};

describe('auditMiddleware — Story 1.15', () => {
  it('insère un audit_log row sur mutation réussie avec action = procedure path', async () => {
    const { insertCalls, db } = buildFakeDb();
    const ctx = buildCtx({
      db,
      user: { id: 'user_001', email: 'u@example.com' },
      org: { id: 'org_001', slug: 'acme' },
      sessionId: 'sess_001',
      ip: '197.157.1.2',
      userAgent: 'Mozilla/5.0 (test)',
    });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure
      .use(auditMiddleware)
      .input(z.object({ name: z.string() }))
      .mutation(({ input }) => ({ id: 'res_001', echo: input.name }));

    const router = t.router({ test: t.router({ createThing: procedure }) });
    const caller = router.createCaller(ctx);

    const result = await caller.test.createThing({ name: 'Hello' });
    expect(result).toEqual({ id: 'res_001', echo: 'Hello' });
    expect(insertCalls).toHaveLength(1);

    const entry = insertCalls[0]?.values as Record<string, unknown>;
    expect(entry.action).toBe('test.createThing');
    expect(entry.organizationId).toBe('org_001');
    expect(entry.userId).toBe('user_001');
    expect(entry.sessionId).toBe('sess_001');
    expect(entry.ipAddress).toBe('197.157.1.2');
    expect(entry.userAgent).toBe('Mozilla/5.0 (test)');
    expect(entry.resourceId).toBe('res_001');
    expect(typeof entry.id).toBe('string');
    expect((entry.details as { input: unknown }).input).toEqual({ name: 'Hello' });
  });

  it("utilise '__system__' comme organizationId quand ctx.org est absent", async () => {
    const { insertCalls, db } = buildFakeDb();
    const ctx = buildCtx({ db });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure.use(auditMiddleware).mutation(() => ({ ok: true }));
    const router = t.router({ ping: procedure });
    const caller = router.createCaller(ctx);

    await caller.ping();
    expect(insertCalls).toHaveLength(1);
    const entry = insertCalls[0]?.values as Record<string, unknown>;
    expect(entry.organizationId).toBe('__system__');
    expect(entry.userId).toBeNull();
  });

  it('ne loggue PAS les queries (mutation only)', async () => {
    const { insertCalls, db } = buildFakeDb();
    const ctx = buildCtx({ db });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure.use(auditMiddleware).query(() => ({ data: 42 }));
    const router = t.router({ readThing: procedure });
    const caller = router.createCaller(ctx);

    await caller.readThing();
    expect(insertCalls).toHaveLength(0);
  });

  it('ne loggue PAS une mutation qui throw (success only)', async () => {
    const { insertCalls, db } = buildFakeDb();
    const ctx = buildCtx({ db });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure.use(auditMiddleware).mutation(() => {
      throw new Error('boom');
    });
    const router = t.router({ explode: procedure });
    const caller = router.createCaller(ctx);

    await expect(caller.explode()).rejects.toThrow('boom');
    expect(insertCalls).toHaveLength(0);
  });

  it('redacte les champs sensibles (password, token, etc.) dans details.input', async () => {
    const { insertCalls, db } = buildFakeDb();
    const ctx = buildCtx({ db });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure
      .use(auditMiddleware)
      .input(
        z.object({
          email: z.string(),
          password: z.string(),
          token: z.string(),
          mfaCode: z.string(),
        }),
      )
      .mutation(() => ({ ok: true }));
    const router = t.router({ signin: procedure });
    const caller = router.createCaller(ctx);

    await caller.signin({
      email: 'u@example.com',
      password: 'super-secret',
      token: 'abc123',
      mfaCode: '654321',
    });

    expect(insertCalls).toHaveLength(1);
    const entry = insertCalls[0]?.values as Record<string, unknown>;
    const details = entry.details as { input: Record<string, string> };
    // Story 3.12 — `redact()` masque aussi les emails dans les chaînes via
    // EMAIL_RE (cf. packages/db/src/redact.ts). Le test reflète ce comportement.
    expect(details.input.email).toBe('[REDACTED]');
    expect(details.input.password).toBe('[REDACTED]');
    expect(details.input.token).toBe('[REDACTED]');
    expect(details.input.mfaCode).toBe('[REDACTED]');
  });

  it("n'écroule pas la mutation si l'insertion audit échoue (best-effort)", async () => {
    // db.insert throw au lieu de succès
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const db = {
      insert: () => ({
        values: () => Promise.reject(new Error('db down')),
      }),
    } as unknown as RpcContext['db'];
    const ctx = buildCtx({ db });

    const t = initTRPC.context<RpcContext>().create();
    const procedure = t.procedure.use(auditMiddleware).mutation(() => ({ id: 'ok' }));
    const router = t.router({ thing: procedure });
    const caller = router.createCaller(ctx);

    const result = await caller.thing();
    expect(result).toEqual({ id: 'ok' });
    expect(errorSpy).toHaveBeenCalledWith(
      '[audit] insertion failed',
      expect.objectContaining({ path: 'thing' }),
    );
    errorSpy.mockRestore();
  });
});
