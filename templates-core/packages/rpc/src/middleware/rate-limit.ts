/**
 * Rate-limit middleware — Story 1.16.
 *
 * Factory `rateLimit(key, options)` qui retourne un middleware tRPC :
 * - Si `ctx.env.UPSTASH_REDIS_REST_URL` absent (dev local) → no-op + warn une
 *   seule fois par process. Aucune procédure bloquée
 * - Sinon : instancie Upstash Ratelimit (singleton cache par key), check, et
 *   throw `TRPCError({ code: 'TOO_MANY_REQUESTS' })` si dépassement
 *
 * Clé : `${key}:${ctx.user?.id ?? ctx.ip ?? '__anon__'}` — par-user si auth,
 * par-IP sinon. Fallback `__anon__` si ni user ni ip (impossible en prod
 * derrière Cloudflare, possible en dev/tests).
 *
 * Story 14.x ajoutera des règles avancées (sliding window distributed, audit
 * log `rate_limit.exceeded`, Sentry alert > 50/h, allowlist par plan).
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { RpcContext } from '../context';

const t = initTRPC.context<RpcContext>().create();

/**
 * Format de la fenêtre temporelle accepté par `Ratelimit.slidingWindow`.
 * Exemples : "1 m", "10 s", "1 h", "1 d".
 */
export type Duration = `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`;

export interface RateLimitOptions {
  /** Nombre max de requêtes autorisées dans la fenêtre. */
  readonly limit: number;
  /** Fenêtre temporelle (sliding window). Ex: '1 m', '1 h'. */
  readonly window: Duration;
}

/**
 * Flag de warn dev unique par process. Évite le spam log si plusieurs
 * middleware rateLimit() sont instanciés (signin, signup, payments, etc.).
 */
let devWarnLogged = false;

/**
 * Cache de l'instance Upstash Ratelimit par clé (singleton process-wide).
 * Permet de réutiliser la connexion + le cache TTL côté `@upstash/ratelimit`.
 */
const limiterCache = new Map<string, Ratelimit>();

const getLimiter = (
  url: string,
  token: string,
  key: string,
  options: RateLimitOptions,
): Ratelimit => {
  const cacheKey = `${url}|${key}|${options.limit}|${options.window}`;
  const existing = limiterCache.get(cacheKey);
  if (existing) {
    return existing;
  }
  const redis = new Redis({ url, token });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.limit, options.window),
    analytics: false,
    prefix: `__PROJECT_SLUG__:rl:${key}`,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
};

/**
 * Test-only : vide le cache Ratelimit + reset le warn flag. Pratique pour
 * isoler des tests sans polluer l'état global du process.
 */
export const __resetRateLimitInternals = (): void => {
  limiterCache.clear();
  devWarnLogged = false;
};

/**
 * Factory : crée un middleware tRPC appliquant la règle de rate-limit donnée.
 *
 * @example
 *   // Story 3.1+ — limit signup à 10 req/min par IP
 *   const signupProcedure = publicProcedure
 *     .use(rateLimit('auth.signup', { limit: 10, window: '1 m' }))
 *     .input(...).mutation(...);
 */
export const rateLimit = (key: string, options: RateLimitOptions) =>
  t.middleware(async ({ ctx, next }) => {
    const url = ctx.env.UPSTASH_REDIS_REST_URL;
    const token = ctx.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      if (!devWarnLogged) {
        console.warn(
          '[rateLimit] UPSTASH_REDIS_REST_URL absent — middleware no-op (dev only). Set wrangler secrets en staging/prod.',
        );
        devWarnLogged = true;
      }
      return next();
    }

    const identifier = ctx.user?.id ?? ctx.ip ?? '__anon__';
    const limiter = getLimiter(url, token, key, options);
    const result = await limiter.limit(`${key}:${identifier}`);

    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit dépassé. Réessayez dans quelques secondes.',
      });
    }

    return next();
  });
