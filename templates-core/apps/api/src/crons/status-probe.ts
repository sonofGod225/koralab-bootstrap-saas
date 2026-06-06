/**
 * apps/api — Cron `status-probe` (Epic 25, Story 25.6).
 *
 * Déclencheur : cron Cloudflare toutes les 5 minutes (cf. wrangler.toml
 * `[triggers]`). Exécute les
 * sondes santé (`runHealthChecks`), persiste chaque résultat dans
 * `health_check_runs` (base de l'uptime, NFR47) et met à jour
 * `service_components.current_status`. Les composants en maintenance active
 * sont forcés au statut `maintenance`.
 */
import {
  and,
  createDb,
  eq,
  gte,
  lte,
  healthCheckRuns,
  maintenanceWindows,
  serviceComponents,
  type ComponentStatus,
} from '@__SCOPE__/db';
import type { Bindings } from '../env';
import { runHealthChecks } from '../lib/health-checks';
import { recordJobRun } from '../lib/job-run';
import { raiseAlert } from '../lib/alerting';

export async function statusProbeCron(
  _event: ScheduledController,
  env: Bindings,
  ctx: ExecutionContext,
): Promise<void> {
  const db = createDb(env.DATABASE_URL);

  ctx.waitUntil(
    recordJobRun(db, 'status-probe', 'cron', async () => {
      const now = new Date();
      const checks = await runHealthChecks(env);

      // Composants en maintenance active → statut forcé `maintenance`.
      const activeMaint = await db
        .select({ keys: maintenanceWindows.componentKeys })
        .from(maintenanceWindows)
        .where(
          and(
            eq(maintenanceWindows.status, 'in_progress'),
            lte(maintenanceWindows.startsAt, now),
            gte(maintenanceWindows.endsAt, now),
          ),
        );
      const maintKeys = new Set(activeMaint.flatMap((m) => m.keys));

      let failed = 0;
      for (const c of checks) {
        await db.insert(healthCheckRuns).values({
          id: crypto.randomUUID(),
          componentKey: c.key,
          status: c.status,
          latencyMs: c.latencyMs,
          detail: c.detail,
          checkedAt: now,
        });

        const componentStatus: ComponentStatus = maintKeys.has(c.key)
          ? 'maintenance'
          : c.status === 'up'
            ? 'operational'
            : c.status === 'degraded'
              ? 'degraded'
              : 'down';

        await db
          .update(serviceComponents)
          .set({ currentStatus: componentStatus, updatedAt: now })
          .where(eq(serviceComponents.key, c.key));

        if (c.status === 'down') failed += 1;
      }

      // Story 25.16 — alerte si un ou plusieurs composants sont down (hors maintenance).
      const down = checks
        .filter((c) => c.status === 'down' && !maintKeys.has(c.key))
        .map((c) => c.key);
      if (down.length > 0) {
        await raiseAlert(
          env,
          `component-down:${down.sort().join(',')}`,
          'critical',
          'Composant(s) en panne',
          {
            components: down.join(', '),
          },
        );
      }

      return { processed: checks.length, failed };
    }),
  );
}
