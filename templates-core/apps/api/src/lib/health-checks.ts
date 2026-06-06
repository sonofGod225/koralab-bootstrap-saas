/**
 * Health checks composants (Epic 25, Stories 25.2/25.6).
 *
 * `runHealthChecks` exécute les sondes réelles (DB, KV, queue, PSP, apps) et
 * retourne leur état. Partagé entre l'endpoint `/health/full` (apps/api) et le
 * cron `status-probe`. En `development`, les sondes externes (PSP/apps) sont
 * ignorées (pas d'appels réseau réels).
 */
import { createDb, sql } from '@__SCOPE__/db';
import type { Bindings } from '../env';

export interface ComponentCheck {
  key: string;
  status: 'up' | 'degraded' | 'down';
  latencyMs: number | null;
  detail: string | null;
}

const DEGRADED_MS = 1500;
const PROBE_TIMEOUT_MS = 4000;

async function timed(
  fn: () => Promise<unknown>,
): Promise<{ ms: number; ok: boolean; err?: string }> {
  const start = Date.now();
  try {
    await fn();
    return { ms: Date.now() - start, ok: true };
  } catch (e) {
    return { ms: Date.now() - start, ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

function classify(ok: boolean, ms: number): 'up' | 'degraded' | 'down' {
  if (!ok) return 'down';
  return ms > DEGRADED_MS ? 'degraded' : 'up';
}

export async function runHealthChecks(env: Bindings): Promise<ComponentCheck[]> {
  const isDev = env.ENVIRONMENT === 'development';
  const checks: ComponentCheck[] = [];

  // api — self : si ce code s'exécute, l'API répond.
  checks.push({ key: 'api', status: 'up', latencyMs: 0, detail: 'self' });

  // db — ping Neon.
  {
    const db = createDb(env.DATABASE_URL);
    const r = await timed(() => db.execute(sql`SELECT 1`));
    checks.push({
      key: 'db',
      status: classify(r.ok, r.ms),
      latencyMs: r.ms,
      detail: r.err ?? null,
    });
  }

  // kv — put/get test (cache sessions).
  if (env.SESSIONS_KV) {
    const r = await timed(async () => {
      await env.SESSIONS_KV.put('__health_probe__', '1', { expirationTtl: 60 });
      await env.SESSIONS_KV.get('__health_probe__');
    });
    checks.push({
      key: 'kv',
      status: classify(r.ok, r.ms),
      latencyMs: r.ms,
      detail: r.err ?? null,
    });
  }

  // Sondes externes (apps) — ignorées en dev (pas d'appels réseau).
  if (!isDev) {
    const externals: Array<{ key: string; url?: string }> = [
      { key: 'stripe', url: 'https://api.stripe.com' },
      { key: 'paystack', url: 'https://api.paystack.co' },
      { key: 'wave', url: 'https://api.wave.com' },
      { key: 'suite', url: env.APP_URL },
      { key: 'admin', url: env.ADMIN_APP_URL },
    ];
    for (const ext of externals) {
      if (!ext.url) continue;
      const url = ext.url;
      const r = await timed(async () => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
        try {
          // Toute réponse HTTP = joignable ; seule une erreur réseau = down.
          await fetch(url, { method: 'GET', signal: ctrl.signal });
        } finally {
          clearTimeout(t);
        }
      });
      checks.push({
        key: ext.key,
        status: classify(r.ok, r.ms),
        latencyMs: r.ms,
        detail: r.err ?? null,
      });
    }
  }

  return checks;
}
