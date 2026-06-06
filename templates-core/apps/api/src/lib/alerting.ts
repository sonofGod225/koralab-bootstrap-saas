/**
 * Alerting opérationnel (Epic 25, Story 25.16).
 *
 * `raiseAlert` envoie une alerte vers Sentry + un email ops (Resend), avec un
 * **cooldown** via KV pour éviter le spam (1 alerte / clé / fenêtre). Toutes les
 * intégrations sont optionnelles : absentes → log console uniquement (jamais de
 * crash, jamais de fausse alerte).
 */
import * as Sentry from '@sentry/cloudflare';
import type { Bindings } from '../env';

const DEFAULT_COOLDOWN_S = 3600; // 1h par clé d'alerte

export type AlertLevel = 'warning' | 'critical';

export async function raiseAlert(
  env: Bindings,
  key: string,
  level: AlertLevel,
  title: string,
  detail: Record<string, unknown> = {},
  cooldownSeconds = DEFAULT_COOLDOWN_S,
): Promise<void> {
  // Cooldown best-effort via KV (binding sessions réutilisé).
  if (env.SESSIONS_KV) {
    try {
      const seen = await env.SESSIONS_KV.get(`alert:${key}`);
      if (seen) return;
      await env.SESSIONS_KV.put(`alert:${key}`, '1', { expirationTtl: cooldownSeconds });
    } catch {
      /* KV indispo → on continue (mieux vaut alerter en double que pas du tout) */
    }
  }

  console.error('[alert]', { key, level, title, ...detail });

  // Sentry — capture du message (le Worker est instrumenté via withSentry).
  try {
    Sentry.captureMessage(`[alert] ${title}`, {
      level: level === 'critical' ? 'error' : 'warning',
      extra: { alertKey: key, ...detail },
    });
  } catch {
    /* no-op si Sentry non initialisé */
  }

  // Email ops via Resend (direct, sans coupler le système de templates).
  if (env.ALERTS_EMAIL && env.RESEND_API_KEY) {
    try {
      const from = env.RESEND_FROM_EMAIL ?? '__PROJECT_NAME__ <noreply@__PROJECT_SLUG__.com>';
      const lines = Object.entries(detail)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join('\n');
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: env.ALERTS_EMAIL,
          subject: `[__PROJECT_NAME__ ${level.toUpperCase()}] ${title}`,
          text: `${title}\n\n${lines}\n\nEnvironnement : ${env.ENVIRONMENT}`,
        }),
      });
    } catch {
      /* échec d'envoi → déjà loggé + Sentry */
    }
  }
}
