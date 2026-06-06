/**
 * Tests — procédure `organization.create`.
 *
 * Invariant central du nouveau flux d'onboarding : l'organisation n'est plus
 * créée à l'inscription mais via cet endpoint, qui doit TOUJOURS rattacher
 * l'utilisateur courant comme `owner`. On vérifie :
 *  1. insert org (nom dérivé de l'user, pays = user.country, devise XOF) +
 *     insert membership `owner` pour `ctx.user.id` ;
 *  2. fallbacks : pays `SN` si `user.country` absent ;
 *  3. priorité de l'input (`name` / `country`) sur les défauts.
 *
 * Stratégie : mock structurel de `ctx.db` (pattern aligné sur les autres tests
 * du package). La procédure chaîne `select` (lookup user) puis deux `insert`.
 */
import { describe, expect, it, vi } from 'vitest';
import type { RpcContext } from '../context';
import { organizationRouter } from '../routers/organization';

const buildFakeDb = (userRow: { name: string; country: string | null } | undefined) => {
  const insertSpy = vi.fn();
  const valuesSpy = vi.fn();
  const db = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(userRow ? [userRow] : []),
        }),
      }),
    }),
    insert: (...args: unknown[]) => {
      insertSpy(...args);
      return {
        values: (vals: unknown) => {
          valuesSpy(vals);
          return Promise.resolve([]);
        },
      };
    },
  } as unknown as RpcContext['db'];
  return { db, insertSpy, valuesSpy };
};

const buildCtx = (db: RpcContext['db']): RpcContext =>
  ({
    env: { DATABASE_URL: 'postgres://fake', ENVIRONMENT: 'development' },
    db,
    user: { id: 'user_1', email: 'u@example.com' },
  }) as RpcContext;

describe('organization.create', () => {
  it('crée une org + un membership owner et retourne organizationId', async () => {
    const { db, insertSpy, valuesSpy } = buildFakeDb({ name: 'Alice', country: 'CI' });
    const caller = organizationRouter.createCaller(buildCtx(db));

    const res = await caller.create();

    expect(res.organizationId).toBeTruthy();
    // org + membership owner + siège + affectation owner (bootstrap ADR 0012).
    expect(insertSpy).toHaveBeenCalledTimes(4);

    const orgValues = valuesSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(orgValues.name).toBe('Organisation de Alice');
    expect(orgValues.country).toBe('CI');
    expect(orgValues.currency).toBe('XOF');
    expect(orgValues.id).toBe(res.organizationId);

    const memberValues = valuesSpy.mock.calls[1]?.[0] as Record<string, unknown>;
    expect(memberValues.role).toBe('owner');
    expect(memberValues.userId).toBe('user_1');
    expect(memberValues.organizationId).toBe(res.organizationId);
  });

  it('bootstrap un établissement « siège » principal + affecte l’owner (ADR 0012)', async () => {
    const { db, valuesSpy } = buildFakeDb({ name: 'Alice', country: 'CI' });
    const caller = organizationRouter.createCaller(buildCtx(db));

    const res = await caller.create();

    // 3e insert : siège (is_primary, country hérité de l'org), 4e : affectation owner.
    const estValues = valuesSpy.mock.calls[2]?.[0] as Record<string, unknown>;
    expect(estValues.name).toBe('Siège');
    expect(estValues.isPrimary).toBe(true);
    expect(estValues.country).toBe('CI');
    expect(estValues.organizationId).toBe(res.organizationId);

    const assignValues = valuesSpy.mock.calls[3]?.[0] as Record<string, unknown>;
    expect(assignValues.userId).toBe('user_1');
    expect(assignValues.establishmentId).toBe(estValues.id);
    expect(assignValues.organizationId).toBe(res.organizationId);
  });

  it('applique le fallback pays=SN quand user.country est absent', async () => {
    const { db, valuesSpy } = buildFakeDb({ name: 'Bob', country: null });
    const caller = organizationRouter.createCaller(buildCtx(db));

    await caller.create();

    const orgValues = valuesSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(orgValues.name).toBe('Organisation de Bob');
    expect(orgValues.country).toBe('SN');
  });

  it('respecte le nom et le pays fournis en input', async () => {
    const { db, valuesSpy } = buildFakeDb({ name: 'Bob', country: 'CI' });
    const caller = organizationRouter.createCaller(buildCtx(db));

    await caller.create({ name: 'Ma Boîte', country: 'BJ' });

    const orgValues = valuesSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(orgValues.name).toBe('Ma Boîte');
    expect(orgValues.country).toBe('BJ');
  });
});
