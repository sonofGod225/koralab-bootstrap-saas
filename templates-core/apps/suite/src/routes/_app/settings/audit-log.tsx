/**
 * /settings/audit-log — journal d'audit (Stories 3.12 + 3.17).
 *
 * Refonte sur le bundle Claude Design "__PROJECT_NAME__ shadcn Canvas" : header
 * Fraunces 40px + 2 SectionCards (filtres + table 5 colonnes). Chaque ligne
 * ouvre un Dialog avec les détails JSON formatés (compromis MVP — le
 * drawer diff before/after du design est différé).
 *
 * Lit `audit_log` via `trpc.audit.list` (paginé par cursor, protégé par
 * `audit:log:read`). PII redacted à l'insertion (helper `redact()` Story 3.12).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Eye, RotateCcw, Search } from 'lucide-react';
import { Button } from '@__SCOPE__/ui/button';
import { DateRangePicker } from '@__SCOPE__/ui/date-range-picker';
import type { DateRangeValue } from '@__SCOPE__/ui/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@__SCOPE__/ui/dialog';
import { Input } from '@__SCOPE__/ui/input';
import { Label } from '@__SCOPE__/ui/label';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { FormRow, SectionCard, SettingsPageHeader } from '../../../components/settings-page';
import { GridTable } from '../../../components/grid-table';
import type { GridColumn } from '../../../components/grid-table';
import { PaginationBar } from '../../../components/pagination-bar';
import { trpc } from '../../../lib/trpc-client';

export const Route = createFileRoute('/_app/settings/audit-log')({ component: AuditLogPage });

interface Filters {
  range: DateRangeValue | undefined;
  search: string;
}

/** Bornes ISO d'un jour local (début 00:00, fin 23:59:59.999) — sans dépendance
 * date-fns côté apps/suite : le `DateRangePicker` rend des dates à minuit local. */
function dayStartISO(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
}
function dayEndISO(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
}

interface AuditEntry {
  id: string;
  userId: string | null;
  sessionId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const PAGE_SIZE = 50;

function AuditLogPage() {
  const [filters, setFilters] = useState<Filters>({ range: undefined, search: '' });
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AuditEntry | null>(null);

  // `load` est stable (sans dep) : la page et les filtres sont passés en arguments
  // explicites — la recherche reste pilotée par le bouton « Filtrer » (pas de
  // refetch à chaque frappe), et la pagination recharge avec les filtres courants.
  const load = useCallback(async (targetPage: number, f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await trpc.audit.list.query({
        from: f.range ? dayStartISO(f.range.from) : undefined,
        to: f.range ? dayEndISO(f.range.to) : undefined,
        search: f.search.trim() || undefined,
        page: targetPage,
        pageSize: PAGE_SIZE,
      });
      setItems(
        result.items.map((it) => ({
          ...it,
          createdAt:
            typeof it.createdAt === 'string' ? it.createdAt : new Date(it.createdAt).toISOString(),
        })) as AuditEntry[],
      );
      setTotal(result.total);
      setPage(targetPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (mounted) return;
    setMounted(true);
    void load(0, filters);
  }, [mounted, load, filters]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    void load(0, filters);
  }

  function clearFilters() {
    const empty: Filters = { range: undefined, search: '' };
    setFilters(empty);
    void load(0, empty);
  }

  return (
    <>
      <SettingsPageHeader
        breadcrumbs={['Paramètres', 'Sécurité', "Journal d'audit"]}
        eyebrow="Journal"
        title="Tout ce qui s'est passé"
        italic="sur votre organisation."
        subtitle="Toutes les actions sensibles tracées. PII automatiquement masquées. Table immuable — append-only au niveau PostgreSQL."
      />

      {error ? <p className="text-danger-700 mb-4 text-sm">{error}</p> : null}

      <div className="flex flex-col gap-5">
        <SectionCard
          title="Filtrer"
          description="Restreignez par période ou recherchez une action spécifique."
        >
          <form
            onSubmit={applyFilters}
            className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-[auto_2fr_auto_auto]"
          >
            <FormRow label="Période">
              <DateRangePicker
                value={filters.range}
                onValueChange={(range) => setFilters((f) => ({ ...f, range }))}
              />
            </FormRow>
            <FormRow label="Rechercher (action)">
              <div className="relative">
                <Search className="text-base-400 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="invoices.create, rbac.role_updated…"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </FormRow>
            <LoadingButton type="submit" size="sm" loading={loading}>
              Filtrer
            </LoadingButton>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={loading}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          </form>
        </SectionCard>

        <HistoryCard
          items={items}
          loading={loading}
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => void load(p, filters)}
          onOpenDetail={setDetail}
        />
      </div>

      {/* Dialog details JSON formaté */}
      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.action}</DialogTitle>
            <DialogDescription>
              {detail
                ? `Événement du ${new Date(detail.createdAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'medium' })}`
                : null}
            </DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <Label className="text-base-500 text-[10px] tracking-wide uppercase">
                    Utilisateur
                  </Label>
                  <p className="text-base-900 mt-0.5 font-mono">
                    {detail.userId ?? <span className="text-base-400">système</span>}
                  </p>
                </div>
                <div>
                  <Label className="text-base-500 text-[10px] tracking-wide uppercase">
                    Adresse IP
                  </Label>
                  <p className="text-base-900 mt-0.5 font-mono">{detail.ipAddress ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-base-500 text-[10px] tracking-wide uppercase">
                    Ressource
                  </Label>
                  <p className="text-base-900 mt-0.5">
                    {detail.resourceType ?? '—'}
                    {detail.resourceId ? (
                      <span className="text-base-500 ml-1 font-mono">{detail.resourceId}</span>
                    ) : null}
                  </p>
                </div>
                <div>
                  <Label className="text-base-500 text-[10px] tracking-wide uppercase">
                    Session
                  </Label>
                  <p className="text-base-900 mt-0.5 truncate font-mono">
                    {detail.sessionId ?? '—'}
                  </p>
                </div>
              </div>
              {detail.userAgent ? (
                <div>
                  <Label className="text-base-500 text-[10px] tracking-wide uppercase">
                    User-Agent
                  </Label>
                  <p className="text-base-700 mt-0.5 text-xs break-all">{detail.userAgent}</p>
                </div>
              ) : null}
              {detail.details ? (
                <div>
                  <Label className="text-base-500 text-[10px] tracking-wide uppercase">
                    Détails (JSON)
                  </Label>
                  <pre className="bg-base-50 text-base-900 mt-1 max-h-[300px] overflow-auto rounded-lg p-3 font-mono text-[11px] leading-relaxed">
                    {JSON.stringify(detail.details, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── HistoryCard : SectionCard + DataTable + footer pagination ─────────── */

function HistoryCard({
  items,
  loading,
  page,
  total,
  pageSize,
  onPageChange,
  onOpenDetail,
}: {
  items: AuditEntry[];
  loading: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onOpenDetail: (e: AuditEntry) => void;
}) {
  const columns = useMemo<GridColumn<AuditEntry>[]>(
    () => [
      {
        id: 'createdAt',
        width: '180px',
        header: 'Quand',
        cell: (e) => (
          <span className="text-base-700 font-mono text-xs whitespace-nowrap tabular-nums">
            {new Date(e.createdAt).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'medium',
            })}
          </span>
        ),
      },
      {
        id: 'action',
        width: '1.5fr',
        header: 'Action',
        cell: (e) => <span className="text-base-900 text-[13px] font-medium">{e.action}</span>,
      },
      {
        id: 'userId',
        width: '1.4fr',
        header: 'Acteur',
        cell: (e) =>
          e.userId ? (
            <span className="text-base-600 block max-w-[180px] truncate font-mono text-xs">
              {e.userId}
            </span>
          ) : (
            <span className="text-base-400 text-xs">système</span>
          ),
      },
      {
        id: 'resource',
        width: '1.2fr',
        header: 'Ressource',
        cell: (e) =>
          !e.resourceType ? (
            <span className="text-base-400 text-xs">—</span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-base-100 text-base-700 rounded-full px-2 py-0.5 text-[10px] font-medium">
                {e.resourceType}
              </span>
              {e.resourceId ? (
                <span className="text-base-500 font-mono text-[11px]">
                  {e.resourceId.slice(0, 8)}…
                </span>
              ) : null}
            </span>
          ),
      },
      {
        id: 'ipAddress',
        width: '120px',
        header: 'IP',
        cell: (e) => <span className="text-base-500 font-mono text-xs">{e.ipAddress ?? '—'}</span>,
      },
      {
        id: 'open',
        width: '40px',
        cellClassName: 'flex justify-end',
        cell: () => <Eye className="text-base-400 h-4 w-4" />,
      },
    ],
    [],
  );

  const mobileCard = (e: AuditEntry) => (
    <button
      type="button"
      onClick={() => onOpenDetail(e)}
      className="bg-card border-border-subtle hover:border-brand-300 flex w-full flex-col gap-1.5 rounded-2xl border-[0.5px] p-3.5 text-left transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-base-900 text-[13px] font-medium break-all">{e.action}</span>
        <Eye className="text-base-400 mt-0.5 h-4 w-4 shrink-0" />
      </div>
      <div className="text-base-500 font-mono text-[11px] tabular-nums">
        {new Date(e.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        {e.resourceType ? (
          <span className="bg-base-100 text-base-700 rounded-full px-2 py-0.5 font-medium">
            {e.resourceType}
            {e.resourceId ? (
              <span className="text-base-500 ml-1 font-mono">{e.resourceId.slice(0, 8)}…</span>
            ) : null}
          </span>
        ) : null}
        {e.userId ? (
          <span className="text-base-600 max-w-[160px] truncate font-mono">{e.userId}</span>
        ) : (
          <span className="text-base-400">système</span>
        )}
        <span className="text-base-500 font-mono">{e.ipAddress ?? '—'}</span>
      </div>
    </button>
  );

  const showInitialLoading = loading && items.length === 0;

  return (
    <>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h3 className="text-base-500 text-[10px] font-semibold tracking-[1.2px] uppercase">
          {items.length > 0 ? `Historique · ${items.length}` : 'Historique'}
        </h3>
      </div>

      {!loading && items.length === 0 ? (
        <div className="bg-card border-border-subtle text-base-600 rounded-[14px] border-[0.5px] p-6 text-center text-sm">
          Aucun événement ne correspond à ces filtres.
        </div>
      ) : (
        <GridTable<AuditEntry>
          data={items}
          loading={showInitialLoading}
          columns={columns}
          getRowId={(e) => e.id}
          skeletonRows={5}
          onRowClick={onOpenDetail}
          mobileCard={mobileCard}
        />
      )}

      <PaginationBar
        page={page}
        pageSize={pageSize}
        total={total}
        shown={items.length}
        noun={['événement', 'événements']}
        onPageChange={onPageChange}
      />
    </>
  );
}
