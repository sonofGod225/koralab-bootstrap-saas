/**
 * Tests Epic 24 — middleware `requireStaffRole`.
 *
 * Vérifie :
 *  - UNAUTHORIZED si pas d'utilisateur (anonyme)
 *  - FORBIDDEN si `role !== 'admin'` (+ audit `staff.authorization_failed`)
 *  - FORBIDDEN si banni même avec role admin
 *  - `next()` appelé quand `role === 'admin'` et non banni
 */
import { describe, expect, it, vi } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import type { RpcContext } from '../context';
import { requireStaffRole } from '../middleware/require-staff-role';

const buildCtx = (user: RpcContext['user'], insertSpy?: () => void): RpcContext =>
  ({
    env: { DATABASE_URL: 'postgres://fake', ENVIRONMENT: 'development' },
    db: {
      insert: () => ({
        values: () => {
          insertSpy?.();
          return Promise.resolve();
        },
      }),
    } as unknown as RpcContext['db'],
    user,
    sessionId: 'sess_1',
    ip: '127.0.0.1',
    userAgent: 'test',
  }) as RpcContext;

const buildProc = () => {
  const t = initTRPC.context<RpcContext>().create();
  return t.procedure.use(requireStaffRole).query(() => 'ok');
};

const call = (ctx: RpcContext) =>
  buildProc()({
    ctx,
    type: 'query',
    path: 'admin.overview',
    input: undefined,
    getRawInput: async () => undefined,
  } as never);

describe('requireStaffRole', () => {
  it('UNAUTHORIZED si anonyme', async () => {
    await expect(call(buildCtx(undefined))).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('FORBIDDEN + audit si role non-admin', async () => {
    const insertSpy = vi.fn();
    const ctx = buildCtx({ id: 'u1', email: 'u@x.com', role: 'user' }, insertSpy);
    await expect(call(ctx)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(insertSpy).toHaveBeenCalledOnce();
  });

  it('FORBIDDEN si banni même admin', async () => {
    const ctx = buildCtx({ id: 'u1', email: 'u@x.com', role: 'admin', banned: true });
    await expect(call(ctx)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('next() quand role=admin non banni', async () => {
    const ctx = buildCtx({ id: 'staff1', email: 's@__PROJECT_SLUG__.com', role: 'admin', banned: false });
    await expect(call(ctx)).resolves.toBe('ok');
  });

  it("propage l'erreur TRPCError typée", async () => {
    try {
      await call(buildCtx({ id: 'u1', email: 'u@x.com', role: 'user' }));
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
    }
  });
});
