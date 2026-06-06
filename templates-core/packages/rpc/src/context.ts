/**
 * tRPC Context — état partagé entre middleware + procedures
 *
 * Construit pour chaque requête tRPC entrante par `createContext` (mount Hono).
 * Référence : architecture.md step 5 (Hono middleware ordre canonique).
 *
 * Champs :
 * - `env`     — bindings Cloudflare Workers (DATABASE_URL, secrets PSP, etc.)
 * - `db`      — client Drizzle instancié pour cette requête
 * - `user`    — placeholder, peuplé par middleware auth (Story 3.1 Better-Auth)
 * - `org`     — placeholder, peuplé par middleware tenant (Story 3.6 multi-org)
 * - `sessionId` — placeholder, peuplé par middleware auth
 */
import { createDb, type Database } from '@__SCOPE__/db';

/**
 * Surface minimale du bucket R2 consommée par packages/rpc — évite une
 * dépendance directe à `@cloudflare/workers-types` (même parti-pris que
 * `SessionsKv`). Utilisé pour stager les payloads trop gros pour un message
 * Queue (Story 6.3 — import contacts).
 */
export interface R2LikeBucket {
  put(key: string, value: string | ArrayBuffer | ReadableStream): Promise<unknown>;
  get(key: string): Promise<{ text(): Promise<string> } | null>;
  delete(key: string): Promise<void>;
}

/** Surface minimale d'une Cloudflare Queue côté producteur. */
export interface ProducerQueue<T = unknown> {
  // Retour `unknown` : la vraie `Queue.send` de Cloudflare renvoie une
  // `QueueSendResponse`, qu'on ignore ici (on ne dépend pas de ses types).
  send(message: T, options?: { contentType?: string }): Promise<unknown>;
}

export interface RpcEnv {
  DATABASE_URL: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  /**
   * Story 1.16 — Upstash Ratelimit. Optionnels en dev (middleware no-op).
   * À set en staging/production via `wrangler secret put UPSTASH_REDIS_REST_URL`
   * et `wrangler secret put UPSTASH_REDIS_REST_TOKEN`.
   */
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  /**
   * Story 4.2 — toggle du middleware `requireActiveSubscription`.
   * `'true'` → bloque les procédures applicatives si subscription absente
   * ou pas dans (`active` | `trialing`). Toute autre valeur ou absent →
   * mode souple (log only). À activer post-Epic 4 stable.
   */
  STRICT_SUBSCRIPTION_GATE?: string;
  /**
   * Epic 4 Story 4.3 — URL publique de l'app suite, utilisée pour les
   * `success_url` et `cancel_url` du Stripe Checkout. Déclarée en `[vars]`
   * dans `apps/api/wrangler.toml`. Toujours définie en pratique mais marquée
   * optionnelle ici pour rester non-bloquante en tests unitaires.
   */
  APP_URL?: string;
  /**
   * Epic 4 Story 4.3 — secrets Stripe. Si absent, le router `billing.createCheckoutSession`
   * lève une erreur explicite ("STRIPE_SECRET_KEY missing") plutôt que de
   * crasher silencieusement. `STRIPE_PRICE_IDS_JSON` est validé au boot via
   * `assertPriceIdsComplete()` de `@__SCOPE__/payments/billing` à la première
   * utilisation pour fail-fast.
   */
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_IDS_JSON?: string;
  /**
   * Task #12 — Paystack billing. Optionnels. Si absents, le router billing
   * refuse les checkouts `method='paystack'` mais Stripe continue.
   * Cf. doc complète dans `apps/api/src/env.ts`.
   */
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_PLAN_CODES_JSON?: string;
  /**
   * Epic 25 — Observabilité (optionnels). Si présents, le routeur `status`
   * interroge Axiom (taux d'erreur / P95 / volume) et Sentry (issues). Absents
   * → dégradation gracieuse (`available: false`, jamais de fausse donnée).
   */
  AXIOM_TOKEN?: string;
  AXIOM_DATASET?: string;
  SENTRY_AUTH_TOKEN?: string;
  SENTRY_ORG_SLUG?: string;
  SENTRY_PROJECT_SLUG?: string;
  /**
   * Story 3.19 — KV des sessions Better-Auth. Comme les sessions vivent en KV
   * (`secondaryStorage`) et **pas** en Postgres, l'établissement actif est stocké
   * ici sous la clé `est:{sessionId}` (posé par `establishments.setActive`, lu par
   * `require-establishment`). Optionnel : absent en tests unitaires (repli colonne
   * `session.active_establishment_id`).
   */
  SESSIONS_KV?: SessionsKv;
  /**
   * Epic 5 (Files R2) — bucket pour stager les gros payloads. Story 6.3 :
   * lignes d'import contacts (un message Queue est plafonné à 128 KB). Optionnel
   * (absent en tests / dev sans R2) → `contacts.import` retombe en synchrone.
   */
  R2?: R2LikeBucket;
  // Extensions futures : Queues, secrets PSP/IA — ajoutés via apps/api bindings
}

/** Surface minimale du binding KV consommée par packages/rpc (évite une dép `@cloudflare/workers-types`). */
export interface SessionsKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface RpcContext {
  readonly env: RpcEnv;
  readonly db: Database;
  /**
   * Story 3.1+ : peuplé par require-auth middleware.
   * `role`/`banned` (Epic 24) viennent du plugin `admin` Better-Auth — utilisés
   * par `require-staff-role` pour le gating du back-office cross-tenant.
   */
  readonly user?: { id: string; email: string; role?: string | null; banned?: boolean | null };
  /** Story 3.6+ : peuplé par require-org middleware */
  readonly org?: { id: string; slug: string };
  /** Story 3.19+ : établissement actif (résolu + validé par require-establishment). */
  readonly establishment?: { id: string };
  /** Story 3.1+ : peuplé par require-auth */
  readonly sessionId?: string;
  /**
   * Story 3.6 : organisation active de la session (non vérifiée) — source du
   * middleware `require-org` qui valide l'appartenance et peuple `org`.
   */
  readonly activeOrganizationId?: string;
  /**
   * Story 1.15+ / 1.16+ : IP cliente extraite du header `cf-connecting-ip`.
   * Utilisé par audit middleware (log) + rate-limit middleware (clé fallback).
   */
  readonly ip?: string;
  /** Story 1.15+ : User-Agent brut, utilisé par audit middleware. */
  readonly userAgent?: string;
}

export interface CreateContextOptions {
  env: RpcEnv;
  req: Request;
  /**
   * Story 3.1 — session Better-Auth résolue par le caller (apps/api), qui seul
   * a accès à l'instance Better-Auth. `packages/rpc` reste agnostique de l'auth :
   * il consomme `user`/`sessionId` déjà résolus. `undefined` = requête anonyme.
   */
  user?: { id: string; email: string; role?: string | null; banned?: boolean | null };
  sessionId?: string;
  /**
   * Story 3.6 — organisation active de la session (`session.activeOrganizationId`,
   * plugin `organization`). Identifiant **non vérifié** ; le middleware
   * `require-org` valide l'appartenance avant de peupler `ctx.org`.
   */
  activeOrganizationId?: string;
}

export const createContext = ({
  env,
  req,
  user,
  sessionId,
  activeOrganizationId,
}: CreateContextOptions): RpcContext => {
  // Extraction des headers Cloudflare pour audit + rate-limit.
  // `cf-connecting-ip` est ajouté par le edge CF avant le Worker.
  // Fallback `x-forwarded-for` pour dev local + tests.
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    undefined;
  const userAgent = req.headers.get('user-agent') ?? undefined;

  return {
    env,
    db: createDb(env.DATABASE_URL),
    ip,
    userAgent,
    user,
    sessionId,
    activeOrganizationId,
    // `org` (vérifié) est peuplé par le middleware require-org
  };
};
