/**
 * apps/api — Logger structuré Axiom (Story 1.6, volet Axiom)
 *
 * Logger JSON applicatif requêtable en APL depuis le dashboard Axiom.
 * Pensé pour Cloudflare Workers : les events sont bufferisés puis envoyés
 * en un seul POST batch via `ctx.waitUntil()` à la fin de la requête (le
 * réseau n'est pas disponible hors du cycle de vie d'une requête Worker).
 *
 * Double couverture (cf. décision Story 1.6 « les deux ») :
 *  - chaque event est aussi écrit en `console.*` → capté par Cloudflare
 *    Logpush vers le dataset `__PROJECT_SLUG__-cloudflare` (logs runtime Workers) ;
 *  - l'ingestion directe ci-dessous alimente `__PROJECT_SLUG__-logs` (events métier
 *    structurés, schéma maîtrisé).
 *
 * No-op silencieux si `AXIOM_TOKEN` / `AXIOM_DATASET` sont absents (dev local
 * sans .dev.vars) — le logger reste utilisable, seul l'envoi réseau est coupé.
 */

import type { Logger, LogLevel, LogFields } from '@__SCOPE__/types';

// Réexport : les consumers historiques importent `Logger` depuis ce module.
export type { Logger, LogLevel, LogFields } from '@__SCOPE__/types';

const AXIOM_INGEST_BASE = 'https://api.axiom.co/v1/datasets';

export interface LoggerOptions {
  token?: string;
  dataset?: string;
  environment: string;
  /** Surface émettrice — `api` ici ; `suite` / `admin` pour les frontends. */
  service?: string;
  /** Version produit (vX.Y.Z) — injectée au deploy (Story 1.17). */
  version?: string;
}

interface AxiomEvent extends LogFields {
  _time: string;
  level: LogLevel;
  event: string;
  service: string;
  environment: string;
  version: string;
}

export function createLogger(opts: LoggerOptions): Logger {
  const buffer: AxiomEvent[] = [];
  const enabled = Boolean(opts.token && opts.dataset);
  const service = opts.service ?? 'api';
  const version = opts.version ?? 'dev';

  const record = (level: LogLevel, event: string, fields?: LogFields): void => {
    const entry: AxiomEvent = {
      _time: new Date().toISOString(),
      level,
      event,
      service,
      environment: opts.environment,
      version,
      ...fields,
    };

    // Console : capté par Cloudflare Logpush + visible dans `wrangler tail`.
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    // eslint-disable-next-line no-console -- sortie console délibérée du logger applicatif
    else console.log(line);

    if (enabled) buffer.push(entry);
  };

  return {
    info: (event, fields) => record('info', event, fields),
    warn: (event, fields) => record('warn', event, fields),
    error: (event, fields) => record('error', event, fields),

    async flush() {
      if (!enabled || buffer.length === 0) return;
      const batch = buffer.splice(0, buffer.length);
      try {
        const res = await fetch(`${AXIOM_INGEST_BASE}/${opts.dataset}/ingest`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opts.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batch),
        });
        if (!res.ok) {
          console.error(`axiom.flush.failed status=${res.status}`);
        }
      } catch (err) {
        // L'observabilité ne doit jamais casser une requête : on avale l'erreur.
        console.error('axiom.flush.error', err);
      }
    },
  };
}
