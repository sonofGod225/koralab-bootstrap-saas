/**
 * Instrumentation des jobs (Epic 25, Story 25.5).
 *
 * `recordJobRun` enveloppe l'exécution d'un cron / consumer de queue et persiste
 * une ligne `job_runs` (running → success|partial|failed) avec durée et compteurs.
 * Best-effort : une erreur d'insertion/maj n'interrompt jamais le job métier.
 */
import { createDb, eq, jobRuns, type Database, type JobKind } from '@__SCOPE__/db';

export interface JobOutcome {
  processed: number;
  failed: number;
}

export async function recordJobRun(
  db: Database,
  jobName: string,
  kind: JobKind,
  run: () => Promise<JobOutcome>,
): Promise<void> {
  const id = crypto.randomUUID();
  const startedAt = new Date();
  try {
    await db.insert(jobRuns).values({ id, jobName, kind, status: 'running', startedAt });
  } catch (err) {
    console.error('[job-run] insert failed', { jobName, err });
  }

  let processed = 0;
  let failed = 0;
  let error: string | null = null;
  let status: 'success' | 'partial' | 'failed' = 'success';

  try {
    const outcome = await run();
    processed = outcome.processed;
    failed = outcome.failed;
    status = failed === 0 ? 'success' : processed === 0 ? 'failed' : 'partial';
  } catch (err) {
    status = 'failed';
    error = err instanceof Error ? err.message : String(err);
    console.error('[job-run] job threw', { jobName, err });
  }

  try {
    await db
      .update(jobRuns)
      .set({
        status,
        itemsProcessed: processed,
        itemsFailed: failed,
        error,
        finishedAt: new Date(),
      })
      .where(eq(jobRuns.id, id));
  } catch (err) {
    console.error('[job-run] update failed', { jobName, err });
  }
}

/** Variante sans db pré-créé (pour les crons qui n'ont que l'env). */
export function recordJobRunWithEnv(
  databaseUrl: string,
  jobName: string,
  kind: JobKind,
  run: (db: Database) => Promise<JobOutcome>,
): Promise<void> {
  const db = createDb(databaseUrl);
  return recordJobRun(db, jobName, kind, () => run(db));
}
