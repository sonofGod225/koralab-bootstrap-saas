/**
 * Tests du router `member` (page `/settings/team`).
 *
 * Vérifie le filtrage **backend** + la sérialisation :
 *  - `list` mappe les lignes (`createdAt` → ISO, `user` imbriqué), renvoie
 *    `availableRoles` triés et le `total` (taille réelle de l'équipe).
 *  - `listInvitations` mappe les invitations (dates → ISO).
 *  - La permission `identity:member:read` est exigée (FORBIDDEN sinon).
 *
 * Stratégie : `ctx.db` est un faux Drizzle qui **dispatche** la réponse selon la
 * table/jointure de la requête (et non l'ordre d'appel), ce qui couvre aussi les
 * requêtes des middlewares `requireOrg` (member⋈organizations) et
 * `requirePermission` (member⋈roles⋈role_permissions) sans coupler le test à
 * leur séquencement.
 */
import { describe, expect, it } from 'vitest';
import { invitation, member, organizations, roles, user } from '@__SCOPE__/db';
import type { RpcContext } from '../context';
import { createCallerFactory } from '../trpc';
import { memberRouter } from '../routers/member';

const createCaller = createCallerFactory(memberRouter);

interface Seed {
  membership: Array<{ slug: string }>;
  rules: Array<{ effect: string; permission: string }>;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    createdAt: Date;
    name: string;
    email: string;
    image: string | null;
  }>;
  distinctRoles: Array<{ role: string }>;
  count: Array<{ value: number }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string | null;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  }>;
}

/** Faux ctx.db : un query-builder thenable qui résout selon la table sondée. */
function buildDb(seed: Seed): RpcContext['db'] {
  function makeBuilder(distinct: boolean) {
    const state = { from: null as unknown, joins: [] as unknown[], distinct };
    const dispatch = (): unknown[] => {
      if (state.distinct) return seed.distinctRoles;
      if (state.from === member && state.joins.includes(organizations)) return seed.membership;
      if (state.from === member && state.joins.includes(roles)) return seed.rules;
      if (state.from === member && state.joins.includes(user)) return seed.members;
      if (state.from === member) return seed.count; // select count() from member
      if (state.from === invitation) return seed.invitations;
      return [];
    };
    const b = {
      from(t: unknown) {
        state.from = t;
        return b;
      },
      innerJoin(t: unknown) {
        state.joins.push(t);
        return b;
      },
      leftJoin(t: unknown) {
        state.joins.push(t);
        return b;
      },
      where() {
        return b;
      },
      orderBy() {
        return b;
      },
      limit() {
        return b;
      },
      offset() {
        return b;
      },
      then(onF: (v: unknown[]) => unknown, onR?: (e: unknown) => unknown) {
        return Promise.resolve(dispatch()).then(onF, onR);
      },
    };
    return b;
  }
  return {
    select: () => makeBuilder(false),
    selectDistinct: () => makeBuilder(true),
    insert: () => ({ values: () => Promise.resolve(undefined) }),
  } as unknown as RpcContext['db'];
}

const ALLOW_READ = [{ effect: 'allow', permission: 'identity:member:read' }];

function buildCtx(seed: Seed): RpcContext {
  return {
    env: { DATABASE_URL: 'postgres://fake', ENVIRONMENT: 'development' },
    db: buildDb(seed),
    user: { id: 'user_1', email: 'owner@acme.sn' },
    activeOrganizationId: 'org_1',
    sessionId: 'sess_1',
    ip: '197.0.0.1',
    userAgent: 'test',
  } as unknown as RpcContext;
}

const baseSeed = (): Seed => ({
  membership: [{ slug: 'acme' }],
  rules: ALLOW_READ,
  members: [
    {
      id: 'mem_2',
      userId: 'user_2',
      role: 'admin',
      createdAt: new Date('2026-02-01T10:00:00.000Z'),
      name: 'Awa Diop',
      email: 'awa@acme.sn',
      image: null,
    },
    {
      id: 'mem_1',
      userId: 'user_1',
      role: 'owner',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      name: 'Modou Fall',
      email: 'modou@acme.sn',
      image: 'https://img/m.png',
    },
  ],
  distinctRoles: [{ role: 'owner' }, { role: 'admin' }, { role: 'member' }],
  count: [{ value: 2 }],
  invitations: [
    {
      id: 'inv_1',
      email: 'invite@acme.sn',
      role: 'member',
      status: 'pending',
      expiresAt: new Date('2026-02-10T10:00:00.000Z'),
      createdAt: new Date('2026-02-03T10:00:00.000Z'),
    },
  ],
});

describe('memberRouter.list', () => {
  it('mappe les membres (createdAt ISO + user imbriqué), trie availableRoles et expose total', async () => {
    const caller = createCaller(buildCtx(baseSeed()));
    const res = await caller.list({});

    expect(res.items).toEqual([
      {
        id: 'mem_2',
        userId: 'user_2',
        role: 'admin',
        createdAt: '2026-02-01T10:00:00.000Z',
        user: { name: 'Awa Diop', email: 'awa@acme.sn', image: null },
      },
      {
        id: 'mem_1',
        userId: 'user_1',
        role: 'owner',
        createdAt: '2026-01-01T10:00:00.000Z',
        user: { name: 'Modou Fall', email: 'modou@acme.sn', image: 'https://img/m.png' },
      },
    ]);
    expect(res.availableRoles).toEqual(['admin', 'member', 'owner']); // trié
    expect(res.total).toBe(2);
  });

  it('accepte les filtres search + role sans erreur (filtrage délégué au SQL)', async () => {
    const caller = createCaller(buildCtx(baseSeed()));
    const res = await caller.list({ search: 'awa', role: 'admin' });
    expect(res.items).toHaveLength(2); // le fake ne filtre pas — on valide le contrat d'entrée
    expect(res.total).toBe(2);
  });

  it('refuse sans la permission identity:member:read (FORBIDDEN)', async () => {
    const seed = baseSeed();
    seed.rules = []; // aucun droit
    const caller = createCaller(buildCtx(seed));
    await expect(caller.list({})).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('memberRouter.listInvitations', () => {
  it('mappe les invitations (expiresAt/createdAt ISO) avec statut pending par défaut', async () => {
    const caller = createCaller(buildCtx(baseSeed()));
    const res = await caller.listInvitations({});

    expect(res.items).toEqual([
      {
        id: 'inv_1',
        email: 'invite@acme.sn',
        role: 'member',
        status: 'pending',
        expiresAt: '2026-02-10T10:00:00.000Z',
        createdAt: '2026-02-03T10:00:00.000Z',
      },
    ]);
  });

  it('refuse sans la permission identity:member:read (FORBIDDEN)', async () => {
    const seed = baseSeed();
    seed.rules = [];
    const caller = createCaller(buildCtx(seed));
    await expect(caller.listInvitations({ status: 'accepted' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
