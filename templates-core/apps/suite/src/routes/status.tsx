/**
 * Page de statut publique (Epic 25, Stories 25.13/25.14) — `status.__PROJECT_SLUG__.com`.
 *
 * Route SSR publique (hors `_app`, aucune auth). Le shell + meta SEO sont
 * rendus côté serveur ; les données de statut sont chargées côté client via
 * `status.public` (aucune fuite interne — `is_public=false` exclus serveur).
 * Le flux machine-readable est servi par l'API : `GET /status.json`.
 */
import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../lib/trpc-client';

export const Route = createFileRoute('/status')({
  component: StatusPage,
  head: () => ({
    meta: [
      { title: 'Statut · __PROJECT_NAME__' },
      {
        name: 'description',
        content:
          'État en temps réel des services __PROJECT_NAME__ — disponibilité, incidents et maintenances.',
      },
    ],
  }),
});

type StatusData = Awaited<ReturnType<typeof trpc.status.public.query>>;

const GLOBAL: Record<string, { dot: string; text: string; label: string }> = {
  operational: {
    dot: 'bg-success-500',
    text: 'text-success-800',
    label: 'Tous les systèmes sont opérationnels',
  },
  degraded: { dot: 'bg-warning-500', text: 'text-warning-600', label: 'Dégradation partielle de service' },
  down: { dot: 'bg-danger-500', text: 'text-danger-800', label: 'Incident en cours' },
  maintenance: { dot: 'bg-base-400', text: 'text-base-700', label: 'Maintenance en cours' },
};
const COMP: Record<string, { dot: string; label: string }> = {
  operational: { dot: 'bg-success-500', label: 'Opérationnel' },
  degraded: { dot: 'bg-warning-500', label: 'Dégradé' },
  down: { dot: 'bg-danger-500', label: 'Panne' },
  maintenance: { dot: 'bg-base-400', label: 'Maintenance' },
};
const SEV: Record<string, string> = {
  minor: 'bg-base-100 text-base-700',
  major: 'bg-warning-50 text-warning-600',
  critical: 'bg-danger-50 text-danger-800',
};

function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void trpc.status.public
      .query()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError('Impossible de charger le statut pour le moment.'));
    return () => {
      cancelled = true;
    };
  }, []);

  const g = data ? (GLOBAL[data.globalStatus] ?? GLOBAL.operational) : null;

  return (
    <main className="bg-base-25 min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center gap-3">
          <svg viewBox="0 0 56 56" className="h-8 w-8" role="img" aria-label="__PROJECT_NAME__">
            <path d="M 8 28 L 8 18 Q 8 8 18 8 L 28 8 L 28 28 Z" fill="#2A1A0F" />
            <path d="M 30 28 L 30 8 L 48 8 Q 48 8 48 18 L 48 28 Z" fill="#2A1A0F" />
            <path d="M 8 30 L 28 30 L 28 48 L 18 48 Q 8 48 8 38 Z" fill="#2A1A0F" />
            <path d="M 30 30 L 48 30 L 48 38 Q 48 48 38 48 L 30 48 Z" fill="#E89B5A" />
          </svg>
          <div>
            <div className="font-display text-base-900 text-lg leading-none font-medium">
              __PROJECT_NAME__
            </div>
            <div className="text-base-500 text-xs tracking-wide uppercase">Statut</div>
          </div>
        </header>

        {error && (
          <div className="bg-danger-50 text-danger-800 rounded-xl p-4 text-sm">{error}</div>
        )}
        {!data && !error && (
          <div className="text-base-500 py-12 text-center text-sm">Chargement du statut…</div>
        )}

        {data && g && (
          <>
            {/* Bandeau global */}
            <div className="border-border-subtle mb-8 flex items-center gap-3 rounded-2xl border bg-white p-5">
              <span className={`inline-block h-3.5 w-3.5 rounded-full ${g.dot}`} />
              <span className={`font-display text-xl ${g.text}`}>{g.label}</span>
              <span className="text-base-400 ml-auto font-mono text-xs">
                MàJ {new Date(data.generatedAt).toLocaleString('fr-FR')}
              </span>
            </div>

            {/* Maintenances à venir */}
            {data.maintenances.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base-500 mb-3 text-xs font-semibold tracking-widest uppercase">
                  Maintenances planifiées
                </h2>
                {data.maintenances.map((m) => (
                  <div key={m.id} className="border-warning-200 bg-warning-50 mb-2 rounded-xl border p-4">
                    <div className="text-base-900 text-sm font-medium">{m.title}</div>
                    {m.body && <div className="text-base-700 mt-1 text-sm">{m.body}</div>}
                    <div className="text-base-500 mt-2 font-mono text-xs">
                      {new Date(m.startsAt).toLocaleString('fr-FR')} →{' '}
                      {new Date(m.endsAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Incidents actifs / récents */}
            {data.incidents.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base-500 mb-3 text-xs font-semibold tracking-widest uppercase">
                  Incidents récents
                </h2>
                {data.incidents.map((i) => (
                  <div
                    key={i.id}
                    className="border-border-subtle mb-3 rounded-2xl border bg-white p-5"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${SEV[i.severity] ?? SEV.minor}`}
                      >
                        {i.severity}
                      </span>
                      <span className="text-base-900 font-medium">{i.title}</span>
                      <span className="text-base-400 ml-auto font-mono text-xs">{i.status}</span>
                    </div>
                    <ol className="border-base-100 mt-3 border-l pl-4">
                      {i.updates.map((u) => (
                        <li key={u.id} className="mb-3 last:mb-0">
                          <div className="text-base-500 font-mono text-xs">
                            {u.status} · {new Date(u.createdAt).toLocaleString('fr-FR')}
                          </div>
                          <div className="text-base-800 text-sm">{u.body}</div>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </section>
            )}

            {/* Composants */}
            <section>
              <h2 className="text-base-500 mb-3 text-xs font-semibold tracking-widest uppercase">
                Composants
              </h2>
              <div className="border-border-subtle divide-border-subtle divide-y rounded-2xl border bg-white">
                {data.components.map((c) => {
                  const m = COMP[c.currentStatus] ?? {
                    dot: 'bg-success-500',
                    label: 'Opérationnel',
                  };
                  return (
                    <div key={c.key} className="flex items-center gap-3 px-5 py-3.5">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${m.dot}`} />
                      <span className="text-base-900 text-sm">{c.label}</span>
                      <span className="text-base-500 ml-auto text-sm">{m.label}</span>
                      <span
                        className="text-base-400 w-20 text-right font-mono text-xs"
                        title="uptime 90j"
                      >
                        {c.uptime90.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-base-400 mt-3 text-xs">
                Objectif de disponibilité {data.sla.targetPct}% · RTO {data.sla.rto} · RPO{' '}
                {data.sla.rpo} ·{' '}
                <a href="/status.json" className="underline">
                  status.json
                </a>
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
