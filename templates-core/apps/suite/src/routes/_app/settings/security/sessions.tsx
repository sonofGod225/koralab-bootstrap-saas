/**
 * /settings/security/sessions — sessions actives + révocation (Stories 3.15/3.17).
 *
 * Refonte sur le bundle Claude Design "__PROJECT_NAME__ shadcn Canvas" + primitive
 * `<DataTable>` de `@__SCOPE__/ui` (basée sur `@tanstack/react-table` v8 —
 * tri natif, skeleton loading, EmptyState).
 *
 * Endpoints Better-Auth : `listSessions` / `revokeSession` / `revokeOtherSessions`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { SettingsPageHeader } from '../../../../components/settings-page';
import { GridTable } from '../../../../components/grid-table';
import type { GridColumn } from '../../../../components/grid-table';
import { PaginationBar } from '../../../../components/pagination-bar';
import { authClient } from '../../../../lib/auth-client';
import type { SessionInfo } from '../../../../lib/auth-client';

export const Route = createFileRoute('/_app/settings/security/sessions')({
  component: SessionsPage,
});

/** Libellé lisible d'un appareil à partir du User-Agent. */
function deviceLabel(ua?: string | null): string {
  if (!ua) return 'Appareil inconnu';
  const browser = /Edg/.test(ua)
    ? 'Edge'
    : /Chrome/.test(ua)
      ? 'Chrome'
      : /Firefox/.test(ua)
        ? 'Firefox'
        : /Safari/.test(ua)
          ? 'Safari'
          : 'Navigateur';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS|Macintosh/.test(ua)
      ? 'macOS'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad|iOS/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  return os ? `${browser} sur ${os}` : browser;
}

/** Icône selon famille d'appareil (téléphone, tablette, desktop). */
function DeviceIcon({ ua }: { ua?: string | null }) {
  if (!ua) return <Monitor className="h-4 w-4" />;
  if (/iPhone|Android.*Mobile/.test(ua)) return <Smartphone className="h-4 w-4" />;
  if (/iPad|Tablet/.test(ua)) return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function timeAgo(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

const PAGE_SIZE = 10;

function SessionsPage() {
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    const [list, current] = await Promise.all([authClient.listSessions(), authClient.getSession()]);
    if (list.error || !list.data) {
      window.location.assign('/signin');
      return;
    }
    setCurrentToken(current.data?.session.token ?? null);
    setSessions([...list.data].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revokeOne(token: string) {
    setRevoking(token);
    await authClient.revokeSession({ token });
    setRevoking(null);
    await load();
  }

  async function revokeOthers() {
    setRevoking('others');
    await authClient.revokeOtherSessions();
    setRevoking(null);
    await load();
  }

  const others = sessions?.filter((s) => s.token !== currentToken) ?? [];

  /* ─── ColumnDef ───────────────────────────────────────────────────────── */

  const columns = useMemo<GridColumn<SessionInfo>[]>(
    () => [
      {
        id: 'device',
        width: '2.2fr',
        header: 'Appareil',
        cell: (s) => {
          const isCurrent = s.token === currentToken;
          return (
            <div className="flex items-center gap-3">
              <span className="bg-terre-50 text-terre-700 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]">
                <DeviceIcon ua={s.userAgent} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-terre-900 text-[13px] font-medium">
                    {deviceLabel(s.userAgent)}
                  </span>
                  {isCurrent ? (
                    <span className="bg-soleil-50 text-soleil-600 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.4px] uppercase">
                      Cet appareil
                    </span>
                  ) : null}
                </div>
                <div className="text-terre-500 text-[11px]">
                  Ouverte le {formatDate(s.createdAt)}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'ipAddress',
        width: '1.2fr',
        header: 'IP',
        cell: (s) => <span className="text-terre-600 font-mono text-xs">{s.ipAddress ?? '—'}</span>,
      },
      {
        id: 'activity',
        width: '1fr',
        header: 'Activité',
        cell: (s) => <span className="text-terre-600 text-xs">{timeAgo(s.updatedAt)}</span>,
      },
      {
        id: 'actions',
        width: '110px',
        cellClassName: 'flex justify-end',
        cell: (s) =>
          s.token === currentToken ? (
            <span className="text-terre-400 text-xs">—</span>
          ) : (
            <LoadingButton
              type="button"
              variant="ghost"
              size="sm"
              className="text-brique-700 hover:text-brique-900"
              loading={revoking === s.token}
              onClick={() => revokeOne(s.token)}
            >
              Révoquer
            </LoadingButton>
          ),
      },
    ],
    [currentToken, revoking, revokeOne],
  );

  const mobileCard = (s: SessionInfo) => {
    const isCurrent = s.token === currentToken;
    return (
      <article className="bg-card border-border-subtle flex items-center gap-3 rounded-2xl border-[0.5px] p-3.5">
        <span className="bg-terre-50 text-terre-700 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]">
          <DeviceIcon ua={s.userAgent} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-terre-900 text-sm font-medium">{deviceLabel(s.userAgent)}</span>
            {isCurrent ? (
              <span className="bg-soleil-50 text-soleil-600 rounded-full px-1.5 py-px text-[9px] font-semibold tracking-[0.4px] uppercase">
                Cet appareil
              </span>
            ) : null}
          </div>
          <div className="text-terre-500 mt-0.5 truncate text-xs">
            Ouverte le {formatDate(s.createdAt)}
          </div>
          <div className="text-terre-500 mt-1 flex items-center gap-2 text-[11px]">
            <span className="font-mono">{s.ipAddress ?? '—'}</span>
            <span aria-hidden>·</span>
            <span>{timeAgo(s.updatedAt)}</span>
          </div>
        </div>
        {isCurrent ? (
          <span className="text-terre-400 shrink-0 text-xs">—</span>
        ) : (
          <LoadingButton
            type="button"
            variant="ghost"
            size="sm"
            loading={revoking === s.token}
            onClick={() => revokeOne(s.token)}
            className="text-brique-700 hover:text-brique-900 shrink-0"
          >
            Révoquer
          </LoadingButton>
        )}
      </article>
    );
  };

  return (
    <>
      <SettingsPageHeader
        breadcrumbs={['Paramètres', 'Sécurité', 'Sessions actives']}
        eyebrow="Sécurité"
        title="Les appareils"
        italic="actuellement connectés."
        subtitle="Révoquez ceux que vous ne reconnaissez pas. La session courante est toujours protégée — vous resterez connecté ici."
      />

      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h3 className="text-terre-500 text-[10px] font-semibold tracking-[1.2px] uppercase">
          {sessions === null ? 'Sessions actives' : `Sessions actives · ${sessions.length}`}
        </h3>
        {others.length > 0 ? (
          <LoadingButton
            type="button"
            variant="ghost"
            size="sm"
            className="text-brique-700 hover:text-brique-900"
            loading={revoking === 'others'}
            disabled={revoking !== null}
            onClick={revokeOthers}
          >
            Révoquer toutes les autres
          </LoadingButton>
        ) : null}
      </div>

      {sessions !== null && sessions.length === 0 ? (
        <div className="bg-card border-border-subtle text-terre-600 rounded-[14px] border-[0.5px] p-6 text-center text-sm">
          Aucune session active. Relancez la page si l'erreur persiste.
        </div>
      ) : (
        <>
          <GridTable<SessionInfo>
            data={sessions ? sessions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) : []}
            loading={sessions === null}
            columns={columns}
            getRowId={(s) => s.token}
            skeletonRows={3}
            mobileCard={mobileCard}
          />
          {sessions ? (
            <PaginationBar
              page={page}
              pageSize={PAGE_SIZE}
              total={sessions.length}
              shown={sessions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).length}
              noun={['appareil', 'appareils']}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}
    </>
  );
}
