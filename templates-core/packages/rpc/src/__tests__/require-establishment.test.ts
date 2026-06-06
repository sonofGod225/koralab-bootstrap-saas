/**
 * Tests Story 3.19 — middleware `requireEstablishment` (ADR 0012).
 *
 * Vérifie la résolution de l'établissement actif :
 *  - 0 accessible → FORBIDDEN ;
 *  - 1 accessible → choisi d'office (session null) ;
 *  - N accessibles, session null → siège (`is_primary`) ;
 *  - N accessibles, session = id accessible → respecté (invariant OK) ;
 *  - session = id NON accessible (autre org/supprimé) → ignoré + re-dérivé (invariant).
 *
 * `getAccessibleEstablishments` (service) est mocké pour piloter l'accessibilité
 * (owner/admin-traverse vs membre-borné est testé au niveau du service ailleurs).
 */
import { describe, expect, it, vi } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import type { RpcContext } from '../context';
import type { AccessibleEstablishment } from '../services/establishment-access';

vi.mock('../services/establishment-access', () => ({
  getAccessibleEstablishments: vi.fn(),
}));

import { getAccessibleEstablishments } from '../services/establishment-access';
import { requireEstablishment } from '../middleware/require-establishment';

const mockedAccess = vi.mocked(getAccessibleEstablishments);

/** Fake `ctx.db` dont `select(session)...limit()` retourne `[{ aeid }]` (ou []). */
const buildFakeDb = (aeid: string | null) =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(aeid === null ? [{ aeid: null }] : [{ aeid }]),
        }),
      }),
    }),
  }) as unknown as RpcContext['db'];

const buildCtx = (aeid: string | null): RpcContext =>
  ({
    env: { DATABASE_URL: 'postgres://fake', ENVIRONMENT: 'development' },
    db: buildFakeDb(aeid),
    user: { id: 'user_1', email: 'u@example.com' },
    org: { id: 'org_1', slug: 'acme' },
    sessionId: 'sess_1',
  }) as RpcContext;

const buildProc = () => {
  const t = initTRPC.context<RpcContext>().create();
  return t.procedure.use(requireEstablishment).query(({ ctx }) => ctx.establishment);
};

const invoke = (ctx: RpcContext): Promise<{ id: string } | undefined> =>
  (
    buildProc() as unknown as (opts: {
      ctx: RpcContext;
      type: 'query';
      path: string;
      input: undefined;
      getRawInput: () => Promise<undefined>;
    }) => Promise<{ id: string } | undefined>
  )({
    ctx,
    type: 'query',
    path: 'x.y',
    input: undefined,
    getRawInput: async () => undefined,
  });

const est = (id: string, isPrimary = false): AccessibleEstablishment => ({
  id,
  name: id,
  isPrimary,
});

describe('requireEstablishment', () => {
  it('0 accessible → FORBIDDEN', async () => {
    mockedAccess.mockResolvedValueOnce([]);
    await expect(invoke(buildCtx(null))).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('1 accessible → choisi d’office (session null)', async () => {
    mockedAccess.mockResolvedValueOnce([est('e1')]);
    const res = await invoke(buildCtx(null));
    expect(res).toEqual({ id: 'e1' });
  });

  it('N accessibles, session null → siège (is_primary)', async () => {
    mockedAccess.mockResolvedValueOnce([est('e1'), est('e2', true), est('e3')]);
    const res = await invoke(buildCtx(null));
    expect(res).toEqual({ id: 'e2' });
  });

  it('session = id accessible → respecté (invariant OK)', async () => {
    mockedAccess.mockResolvedValueOnce([est('e1'), est('e2', true)]);
    const res = await invoke(buildCtx('e1'));
    expect(res).toEqual({ id: 'e1' });
  });

  it('session = id NON accessible (autre org) → re-dérivé vers le siège', async () => {
    mockedAccess.mockResolvedValueOnce([est('e1'), est('e2', true)]);
    const res = await invoke(buildCtx('e_other_org'));
    expect(res).toEqual({ id: 'e2' });
  });

  it('lève TRPCError (type) quand aucun établissement', async () => {
    mockedAccess.mockResolvedValueOnce([]);
    await expect(invoke(buildCtx(null))).rejects.toBeInstanceOf(TRPCError);
  });
});
