/**
 * Observabilité in-app (Epic 25, Story 25.11) — lectures Axiom + Sentry.
 *
 * Intégrations **optionnelles** : si les credentials sont absents (ou si l'appel
 * échoue), on renvoie `{ available: false }` — JAMAIS de donnée fabriquée. Le
 * front affiche alors « indisponible » + des liens vers les dashboards.
 */
import type { RpcEnv } from '../context';

export interface AxiomMetrics {
  available: boolean;
  requests24h?: number;
  errors24h?: number;
  errorRate?: number;
  p95Ms?: number;
}

export interface SentryIssue {
  id: string;
  title: string;
  level: string;
  count: number;
  permalink: string;
  lastSeen: string;
}
export interface SentryResult {
  available: boolean;
  issues?: SentryIssue[];
}

/** Métriques requêtes 24h depuis Axiom (event `http.request`). */
export async function queryAxiomMetrics(env: RpcEnv): Promise<AxiomMetrics> {
  if (!env.AXIOM_TOKEN || !env.AXIOM_DATASET) return { available: false };
  try {
    const apl = `['${env.AXIOM_DATASET}'] | where ['event'] == 'http.request' | summarize requests = count(), errors = countif(toint(['status']) >= 500), p95 = percentile(['durationMs'], 95)`;
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const res = await fetch('https://api.axiom.co/v1/datasets/_apl?format=tabular', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.AXIOM_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ apl, startTime: start.toISOString(), endTime: end.toISOString() }),
    });
    if (!res.ok) return { available: false };
    const json = (await res.json()) as {
      tables?: Array<{ columns?: unknown[][]; fields?: Array<{ name: string }> }>;
    };
    const table = json.tables?.[0];
    const fields = table?.fields ?? [];
    const cols = table?.columns ?? [];
    const pick = (name: string): number | undefined => {
      const idx = fields.findIndex((f) => f.name === name);
      const v = idx >= 0 ? cols[idx]?.[0] : undefined;
      return typeof v === 'number' ? v : undefined;
    };
    const requests = pick('requests');
    const errors = pick('errors');
    const p95 = pick('p95');
    if (requests === undefined) return { available: false };
    return {
      available: true,
      requests24h: requests,
      errors24h: errors ?? 0,
      errorRate: requests > 0 ? (errors ?? 0) / requests : 0,
      p95Ms: p95,
    };
  } catch {
    return { available: false };
  }
}

/** Dernières issues non résolues depuis l'API Sentry. */
export async function querySentryIssues(env: RpcEnv): Promise<SentryResult> {
  if (!env.SENTRY_AUTH_TOKEN || !env.SENTRY_ORG_SLUG || !env.SENTRY_PROJECT_SLUG) {
    return { available: false };
  }
  try {
    const url = `https://sentry.io/api/0/projects/${env.SENTRY_ORG_SLUG}/${env.SENTRY_PROJECT_SLUG}/issues/?statsPeriod=24h&query=is:unresolved&limit=8`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${env.SENTRY_AUTH_TOKEN}` } });
    if (!res.ok) return { available: false };
    const json = (await res.json()) as Array<{
      id: string;
      title: string;
      level: string;
      count: string;
      permalink: string;
      lastSeen: string;
    }>;
    return {
      available: true,
      issues: json.map((i) => ({
        id: i.id,
        title: i.title,
        level: i.level,
        count: Number(i.count) || 0,
        permalink: i.permalink,
        lastSeen: i.lastSeen,
      })),
    };
  } catch {
    return { available: false };
  }
}
