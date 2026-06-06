/**
 * apps/api — Hono app entry (Cloudflare Workers)
 *
 * Référence architecture.md step 4 (Hono pivot) + step 5 (Hono middleware ordre canonique)
 *
 * Stories à venir :
 *   - 1.2 : Hono middleware stack complet (auth, tenant, audit, rate-limit, error)
 *   - 1.6 : Mount packages/rpc sur /trpc/*
 *   - Epic 9 : webhooks PSP REST natifs /webhooks/*
 *   - Epic 13 : queue consumers FNE
 */
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';
import * as Sentry from '@sentry/cloudflare';

import { createDb, sql } from '@__SCOPE__/db';
import { appRouter, createContext, createCaller } from '@__SCOPE__/rpc';
import type { RpcEnv } from '@__SCOPE__/rpc';
import type { Bindings } from './env';

/** Mappe les bindings Worker vers l'`RpcEnv` consommé par packages/rpc. */
const toRpcEnv = (env: Bindings): RpcEnv => ({
  DATABASE_URL: env.DATABASE_URL,
  ENVIRONMENT: env.ENVIRONMENT,
  UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
  STRICT_SUBSCRIPTION_GATE: env.STRICT_SUBSCRIPTION_GATE,
  APP_URL: env.APP_URL,
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_IDS_JSON: env.STRIPE_PRICE_IDS_JSON,
  PAYSTACK_SECRET_KEY: env.PAYSTACK_SECRET_KEY,
  PAYSTACK_PLAN_CODES_JSON: env.PAYSTACK_PLAN_CODES_JSON,
  AXIOM_TOKEN: env.AXIOM_TOKEN,
  AXIOM_DATASET: env.AXIOM_DATASET,
  SENTRY_AUTH_TOKEN: env.SENTRY_AUTH_TOKEN,
  SENTRY_ORG_SLUG: env.SENTRY_ORG_SLUG,
  SENTRY_PROJECT_SLUG: env.SENTRY_PROJECT_SLUG,
  // Story 3.19 — KV des sessions : stocke aussi l'établissement actif (`est:{sessionId}`).
  SESSIONS_KV: env.SESSIONS_KV,
  // R2 bucket (generic infra; the core ships no import queues).
  R2: env.R2,
});
import { createLogger, type Logger } from './lib/axiom';
import { createAuth } from '@__SCOPE__/auth';
import { statusProbeCron } from './crons/status-probe';
import { runHealthChecks } from './lib/health-checks';
import { exampleRoute } from './routes/example';

type Variables = {
  // Story 1.6 — logger Axiom par requête, accessible via `c.get('logger')`.
  logger: Logger;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// === Middleware globaux (ordre canonique cf. architecture step 5) ===
app.use('*', logger());

// === Logger Axiom (Story 1.6) ===
// Un logger structuré est créé par requête, exposé via `c.get('logger')`.
// Chaque requête HTTP émet un event `http.request` ; le buffer est flushé
// vers Axiom via `ctx.waitUntil()` (réseau dispo uniquement dans le cycle
// de vie de la requête Worker).
app.use('*', async (c, next) => {
  const log = createLogger({
    token: c.env.AXIOM_TOKEN,
    dataset: c.env.AXIOM_DATASET,
    environment: c.env.ENVIRONMENT,
    service: 'api',
    version: c.env.APP_VERSION,
  });
  c.set('logger', log);

  const start = Date.now();
  try {
    await next();
  } finally {
    log.info('http.request', {
      method: c.req.method,
      path: c.req.path,
      status: c.res?.status ?? 500,
      durationMs: Date.now() - start,
    });
    c.executionCtx.waitUntil(log.flush());
  }
});
// `secureHeaders` global — sauf `/files/*`. Ces routes servent des images
// publiques destinées à l'embed `<img>` cross-origin depuis l'app suite ; le
// `Cross-Origin-Resource-Policy: same-origin` posé par défaut par secureHeaders
// écraserait le `cross-origin` défini par le handler (routes/files.ts) et
// casserait l'affichage de l'aperçu du logo.
const secure = secureHeaders();
app.use('*', async (c, next) => {
  if (c.req.path.startsWith('/files/')) return next();
  return secure(c, next);
});
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      // Liste blanche apps/suite + apps/admin (prod + staging + localhost dev).
      const allowed = [
        'http://localhost:9100',
        'http://localhost:9101',
        'https://__PROJECT_SLUG__.com',
        'https://app.__PROJECT_SLUG__.com',
        'https://staging.__PROJECT_SLUG__.com',
        'https://admin.__PROJECT_SLUG__.com',
        'https://admin.staging.__PROJECT_SLUG__.com',
      ];
      // Origine admin pilotée par l'env (couvre toute variante de domaine).
      if (c.env.ADMIN_APP_URL) allowed.push(c.env.ADMIN_APP_URL);
      if (allowed.includes(origin)) return origin;
      // En development uniquement : autorise toute origine localhost / 127.0.0.1
      // quel que soit le port. Couvre `127.0.0.1` vs `localhost` (origines
      // distinctes pour le navigateur) et le glissement de port du dev server
      // Vite. Jamais actif hors development.
      if (
        c.env.ENVIRONMENT === 'development' &&
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        return origin;
      }
      return null;
    },
    credentials: true,
  }),
);

// === Epic 24 : IP whitelist back-office admin ===
// Restreint l'accès aux requêtes d'origine `admin.__PROJECT_SLUG__.com` (auth + tRPC)
// aux IP autorisées en staging/production. No-op en development et tant que
// `ADMIN_IP_WHITELIST` n'est pas configurée (bootstrap). Les requêtes d'autres
// origines (apps/suite) ne sont jamais affectées.
app.use('*', async (c, next) => {
  if (c.env.ENVIRONMENT === 'development') return next();
  const whitelist = (c.env.ADMIN_IP_WHITELIST ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (whitelist.length === 0) return next();

  const origin = c.req.header('origin') ?? c.req.header('referer') ?? '';
  const adminUrl = c.env.ADMIN_APP_URL ?? '';
  const isAdminOrigin = adminUrl ? origin.startsWith(adminUrl) : /\/\/admin\./.test(origin);
  if (!isAdminOrigin) return next();

  const ip = c.req.header('cf-connecting-ip') ?? '';
  if (!whitelist.includes(ip)) {
    c.get('logger')?.warn('admin.ip_denied', { ip, origin });
    return c.json(
      {
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Adresse IP non autorisée pour le back-office __PROJECT_NAME__.',
        },
      },
      403,
    );
  }
  return next();
});

// === Healthcheck (placé avant auth — public) ===
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: '__PROJECT_SLUG__-api',
    version: c.env.APP_VERSION ?? 'dev',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

// === DB healthcheck — ping Neon + retourne version Postgres ===
app.get('/health/db', async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const result = (await db.execute(sql`SELECT version() AS version`)) as unknown;
    // drizzle-orm/neon-http retourne soit un array, soit { rows: [...] } selon la version
    const rows: ReadonlyArray<{ version?: string }> = Array.isArray(result)
      ? (result as ReadonlyArray<{ version?: string }>)
      : ((result as { rows?: ReadonlyArray<{ version?: string }> }).rows ?? []);
    const version = rows[0]?.version ?? 'unknown';
    return c.json({
      status: 'ok',
      database: 'neon-postgres',
      version,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('DB healthcheck failed', err);
    return c.json(
      {
        status: 'error',
        database: 'neon-postgres',
        error: err instanceof Error ? err.message : 'unknown error',
      },
      503,
    );
  }
});

// === Health check complet (Epic 25 — Story 25.6) ===
// Exécute les sondes composants (DB/KV/queue/PSP/apps) en direct, sans
// persistance — utile pour debug + appelé par le cron `status-probe`.
app.get('/health/full', async (c) => {
  const checks = await runHealthChecks(c.env);
  const down = checks.filter((x) => x.status === 'down');
  return c.json(
    { status: down.length === 0 ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() },
    down.length === 0 ? 200 : 503,
  );
});

// === status.json public (Epic 25 — Story 25.14) ===
// Flux machine-readable du statut plateforme (composants publics, incidents,
// maintenances, uptime). Réutilise la procédure tRPC `status.public` via un
// caller serveur — aucune duplication de logique.
app.get('/status.json', async (c) => {
  const ctx = createContext({ env: toRpcEnv(c.env), req: c.req.raw });
  const data = await createCaller(ctx).status.public();
  return c.json(data);
});

// === Auth Better-Auth mount (Story 3.1 — ADR 0003) ===
// Toutes les routes d'auth (sign-up/in, OAuth callbacks, OTP, MFA, reset…)
// sont servies par le handler Better-Auth sous /api/auth/*. `createAuth` est
// une factory par requête : la connexion DB (Neon HTTP) et le namespace KV
// viennent de `c.env`.
// Le logger Axiom de la requête est passé à `createAuth` pour journaliser le
// coût des SMS OTP (Story 3.3).
app.on(['GET', 'POST'], '/api/auth/*', (c) =>
  createAuth(c.env, c.get('logger')).handler(c.req.raw),
);

// === tRPC mount (Story 1.12 — packages/rpc squelette) ===
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: async (_opts, c) => {
      // Story 3.1 — résolution de la session Better-Auth : seul apps/api a accès
      // à l'instance Better-Auth, packages/rpc consomme `user`/`sessionId` résolus.
      const auth = createAuth(c.env);
      const authSession = await auth.api.getSession({ headers: c.req.raw.headers });

      // Cast nécessaire : @hono/trpc-server type le retour comme Record<string, unknown>
      // tandis que notre RpcContext est strictement typé. Type-safety préservée côté tRPC
      // via initTRPC.context<RpcContext>().
      return createContext({
        env: toRpcEnv(c.env),
        req: c.req.raw,
        user: authSession
          ? {
              id: authSession.user.id,
              email: authSession.user.email,
              // Epic 24 — rôle plateforme (plugin admin) consommé par `requireStaffRole`.
              role: authSession.user.role ?? null,
              banned: authSession.user.banned ?? null,
            }
          : undefined,
        sessionId: authSession?.session.id,
        // Story 3.6 — organisation active de la session (plugin organization).
        activeOrganizationId: authSession?.session.activeOrganizationId ?? undefined,
      }) as unknown as Record<string, unknown>;
    },
  }),
);

// === Endpoint test Sentry (Story 1.6) ===
// Permet de valider la capture d'erreurs côté Sentry. Volontairement gardé
// (utile pour les checks futurs) mais désactivé en production pour ne pas
// exposer une route qui throw.
app.get('/debug/sentry-test', (c) => {
  if (c.env.ENVIRONMENT === 'production') {
    return c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Route introuvable.',
        },
      },
      404,
    );
  }
  throw new Error('Sentry test error — __PROJECT_NAME__ apps/api');
});

// === Endpoint test Axiom (Story 1.6) ===
// Émet un event structuré de validation vers le dataset `__PROJECT_SLUG__-logs`.
// Désactivé en production (route de debug).
app.get('/debug/axiom-test', (c) => {
  if (c.env.ENVIRONMENT === 'production') {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Route introuvable.' } }, 404);
  }
  c.get('logger').info('axiom.debug.test', {
    note: 'Event de validation Story 1.6 — volet Axiom',
    randomId: crypto.randomUUID(),
  });
  return c.json({ status: 'ok', message: 'Event Axiom émis — voir dataset __PROJECT_SLUG__-logs.' });
});

// === Example vertical REST route (duplicate per vertical; add webhooks here too) ===
app.route('/example', exampleRoute);

// === Error handler global ===
// Format unifié : { error: { code, message, details? } } (cf. Story 1.2 AC)
app.onError((err, c) => {
  console.error('Unhandled error', err);
  // Story 1.6 : remontée Sentry. No-op si SENTRY_DSN absent (init non effectuée).
  Sentry.captureException(err);
  // Story 1.6 : log structuré Axiom. Ajouté au buffer de la requête, flushé
  // par le middleware logger (son `finally` s'exécute après onError).
  c.get('logger')?.error('http.error', {
    method: c.req.method,
    path: c.req.path,
    message: err.message,
    name: err.name,
  });
  // Si l'erreur a une cause structurée (AppError de @__SCOPE__/types), on expose les détails non-sensibles
  const details =
    err.cause && typeof err.cause === 'object' && 'code' in err.cause
      ? { budiCode: (err.cause as { code: string }).code }
      : undefined;
  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Une erreur inattendue est survenue. Veuillez réessayer.',
        ...(details ? { details } : {}),
      },
    },
    500,
  );
});

// === 404 handler ===
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'Route introuvable.',
      },
    },
    404,
  );
});

// === Worker handlers (Epic 4 — Stories 4.4/4.8/4.9) ===
// Le Worker expose désormais 3 entry points :
//   - `fetch`     : routing HTTP Hono (existant)
//   - `queue`     : consumer Workers Queue (billing events, Story 4.4)
//   - `scheduled` : cron daily (billing trial/retry, Stories 4.8/4.9)
// La doc Workers (et Hono) impose un `export default { fetch, queue, scheduled }`
// dès qu'il y a plusieurs handlers — l'export d'`app` seul ne suffit plus.
// Multiplex des crons (Epic 25) : Cloudflare appelle un unique handler
// `scheduled` pour tous les triggers — on route sur `event.cron`.
//   `0 6 * * *`    → billing-daily (Stories 4.8/4.9)
//   `0 7 * * *`    → invoicing-reminders (Story 8.12)
//   `*/5 * * * *`  → status-probe (Story 25.6)
const scheduledHandler = (
  event: ScheduledController,
  env: Bindings,
  ctx: ExecutionContext,
): void => {
  // Core ships one cron (status probe). Route additional crons on event.cron.
  if (event.cron === '*/5 * * * *') {
    void statusProbeCron(event, env, ctx);
  }
};

const handler = {
  fetch: app.fetch.bind(app),
  scheduled: scheduledHandler,
} satisfies ExportedHandler<Bindings>;

// === Sentry (Story 1.6) ===
// Wrapper `withSentry` : instrumente le Worker (capture exceptions, traces).
// La config est dérivée de l'env Worker à chaque requête. Si `SENTRY_DSN`
// est absent (dev sans .dev.vars, ou secret non set), le SDK reste no-op.
// `withSentry` accepte un `ExportedHandler` complet (fetch + queue + scheduled),
// donc l'instrumentation couvre aussi le queue consumer et le cron.
export default Sentry.withSentry<Bindings>(
  (env: Bindings) => ({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT,
    // MVP : échantillonnage complet des traces. À ajuster (0.1–0.2) en prod
    // une fois le volume de trafic significatif (Story d'optimisation future).
    tracesSampleRate: 1.0,
    // Pas de PII par défaut (RGPD / données clients sensibles __PROJECT_NAME__).
    sendDefaultPii: false,
  }),
  handler,
);
