/**
 * /settings/establishments — liste des établissements (Story 3.21, ADR 0012).
 *
 * Une org déclare ses établissements (boutiques, agences). Gating par plan via
 * `trpc.establishments.entitlement`. Tout passe par `trpc.establishments.*`.
 * Feedback inline (pas de Toaster monté — cf. team.tsx).
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight, ChevronRight, Info, Lock, Plus, Sparkles, Store } from 'lucide-react';
import { Button } from '@__SCOPE__/ui/button';
import { CountrySelect } from '@__SCOPE__/ui/country-select';
import { Input } from '@__SCOPE__/ui/input';
import { Label } from '@__SCOPE__/ui/label';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { SectionCard, SettingsPageHeader } from '../../../components/settings-page';
import { GridTable } from '../../../components/grid-table';
import type { GridColumn } from '../../../components/grid-table';
import { PaginationBar } from '../../../components/pagination-bar';
import { CenterDialog, InlineNotice, PrincipalBadge } from '../../../components/overlays';
import { trpc } from '../../../lib/trpc-client';

export const Route = createFileRoute('/_app/settings/establishments')({
  component: EstablishmentsPage,
});

interface EstablishmentRow {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  isPrimary: boolean;
  memberCount: number;
}

interface Entitlement {
  establishmentLimit: number | null;
  establishmentCount: number;
  canCreate: boolean;
}

type Phase = 'loading' | 'ready' | 'forbidden' | 'error';

const PAGE_SIZE = 20;

function EstablishmentsPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [rows, setRows] = useState<EstablishmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, ent] = await Promise.all([
        trpc.establishments.list.query({ page, pageSize: PAGE_SIZE }),
        trpc.establishments.entitlement.query().catch(() => null),
      ]);
      setRows(list.items);
      setTotal(list.total);
      setEntitlement(ent);
      setPhase('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement.';
      if (/forbidden/i.test(message) || /permission/i.test(message)) setPhase('forbidden');
      else {
        setError(message);
        setPhase('error');
      }
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const canCreate = entitlement?.canCreate ?? true;
  const limitReached = entitlement ? !entitlement.canCreate : false;

  const manage = (id: string) =>
    void navigate({
      to: '/settings/establishments/$establishmentId',
      params: { establishmentId: id },
    });

  const columns: GridColumn<EstablishmentRow>[] = [
    {
      id: 'name',
      width: '2fr',
      header: 'Nom',
      cell: (e) => (
        <div className="flex items-center gap-2">
          <span className="text-base-900 truncate font-medium">{e.name}</span>
          {e.isPrimary ? <PrincipalBadge /> : null}
        </div>
      ),
    },
    {
      id: 'city',
      width: '1.6fr',
      header: 'Ville',
      cell: (e) => (
        <span className="text-base-600 text-sm">
          {[e.city, e.address].filter(Boolean).join(' · ') || '—'}
        </span>
      ),
    },
    {
      id: 'memberCount',
      width: '1fr',
      header: 'Membres affectés',
      cell: (e) => (
        <span className="text-base-600 text-sm">
          {e.memberCount} membre{e.memberCount > 1 ? 's' : ''}
        </span>
      ),
    },
    {
      id: 'actions',
      width: '110px',
      cellClassName: 'flex justify-end',
      cell: (e) => (
        <Button type="button" variant="ghost" size="sm" onClick={() => manage(e.id)}>
          Gérer
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  const mobileCard = (e: EstablishmentRow) => (
    <div className="border-border-subtle bg-card rounded-2xl border-[0.5px] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-base-900 truncate text-[14px] font-medium">{e.name}</span>
          {e.isPrimary ? <PrincipalBadge /> : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => manage(e.id)}>
          Gérer
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="text-base-500 mt-1 text-[12px]">
        {[e.city, e.address].filter(Boolean).join(' · ') || '—'}
      </div>
      <div className="text-base-500 mt-0.5 text-[12px]">
        {e.memberCount} membre{e.memberCount > 1 ? 's' : ''}
      </div>
    </div>
  );

  return (
    <div>
      <SettingsPageHeader
        breadcrumbs={['Paramètres', 'Organisation', 'Établissements']}
        eyebrow="Organisation"
        title="Vos établissements,"
        italic="vos murs."
        subtitle="Déclarez vos boutiques et agences, et affectez-y vos équipes. Chaque membre ne voit que le périmètre de ses établissements."
        actions={
          phase === 'ready' ? (
            <Button
              type="button"
              size="sm"
              disabled={!canCreate}
              title={limitReached ? 'Limite du plan atteinte' : undefined}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Ajouter un établissement
            </Button>
          ) : null
        }
      />

      {phase === 'forbidden' ? (
        <SectionCard>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Lock className="text-base-400 h-8 w-8" />
            <p className="text-base-900 font-medium">Accès restreint</p>
            <p className="text-base-600 max-w-md text-sm">
              La gestion des établissements requiert une permission que votre rôle n'accorde pas.
            </p>
          </div>
        </SectionCard>
      ) : phase === 'error' ? (
        <p className="text-danger-700 text-sm">{error}</p>
      ) : phase === 'ready' && rows.length === 0 ? (
        <SectionCard padding={20}>
          <EstablishmentsEmptyState onCreate={() => setCreateOpen(true)} disabled={!canCreate} />
        </SectionCard>
      ) : (
        <div>
          {limitReached ? (
            <p className="bg-warning-50 text-warning-700 mb-3 rounded-lg px-3.5 py-2.5 text-xs">
              Limite du plan atteinte
              {entitlement?.establishmentLimit != null
                ? ` (${entitlement.establishmentLimit} établissement${entitlement.establishmentLimit > 1 ? 's' : ''})`
                : ''}
              . Passez à un plan supérieur pour en ajouter davantage.
            </p>
          ) : null}
          <GridTable<EstablishmentRow>
            data={phase === 'ready' ? rows : []}
            loading={phase === 'loading'}
            columns={columns}
            getRowId={(e) => e.id}
            skeletonRows={3}
            mobileCard={mobileCard}
          />
          <PaginationBar
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            shown={rows.length}
            noun={['établissement', 'établissements']}
            onPageChange={setPage}
          />
        </div>
      )}

      <CreateEstablishmentDialog
        open={createOpen}
        isFirst={rows.length === 0}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          void load();
        }}
      />
    </div>
  );
}

function EstablishmentsEmptyState({
  onCreate,
  disabled,
}: {
  onCreate: () => void;
  disabled: boolean;
}) {
  const navigate = useNavigate();
  if (disabled) {
    return (
      <div className="border-brand-300 from-base-100 to-brand-50 flex items-start gap-3.5 rounded-[14px] border border-dashed bg-gradient-to-br p-4">
        <span className="bg-brand-400 text-base-900 inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px]">
          <Sparkles className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base-900 text-sm font-medium">Gérer plusieurs établissements</p>
          <p className="text-base-700 mt-1 max-w-[420px] text-xs leading-[1.5]">
            Votre plan actuel ne permet pas d'ajouter d'établissement supplémentaire. Passez à un
            plan supérieur pour déclarer vos boutiques et agences.
          </p>
        </div>
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={() => void navigate({ to: '/settings/team' })}
        >
          Voir les plans
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="bg-base-100 text-base-600 inline-flex h-12 w-12 items-center justify-center rounded-[14px]">
        <Store className="h-6 w-6" />
      </span>
      <p className="text-base-900 text-sm font-medium">Aucun établissement</p>
      <p className="text-base-600 max-w-md text-[13px] leading-[1.5]">
        Créez votre premier établissement pour organiser vos équipes par périmètre.
      </p>
      <Button type="button" size="sm" className="mt-1" onClick={onCreate}>
        <Plus className="mr-1.5 h-4 w-4" />
        Créer mon premier établissement
      </Button>
    </div>
  );
}

function CreateEstablishmentDialog({
  open,
  isFirst,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  isFirst: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('SN');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setCity('');
      setAddress('');
      setCountry('SN');
      setErr(null);
    }
  }, [open]);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await trpc.establishments.create.mutate({
        name: name.trim(),
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        country: country || undefined,
      });
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Échec de la création.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <CenterDialog
      open={open}
      onOpenChange={onOpenChange}
      width={540}
      icon={<Plus className="h-5 w-5" />}
      iconTone="brand"
      title="Nouvel établissement"
      description="Boutique, agence, pharmacie, station, site — donnez-lui un nom et une adresse."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <LoadingButton
            size="sm"
            loading={busy}
            disabled={!name.trim()}
            onClick={() => void submit()}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Créer
          </LoadingButton>
        </>
      }
    >
      {isFirst ? (
        <div className="mb-[18px]">
          <InlineNotice tone="success" icon={<Info className="h-[15px] w-[15px]" />}>
            Premier établissement de l'organisation — il deviendra automatiquement le principal.
          </InlineNotice>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="est-name">
            Nom <span className="text-brand-600">*</span>
          </Label>
          <Input
            id="est-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. Boutique Liberté 6"
            maxLength={120}
            autoFocus
          />
          <div className="text-base-500 text-right font-mono text-[11px]">{name.length}/120</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="est-city">Ville</Label>
          <Input
            id="est-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="ex. Dakar"
            maxLength={120}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Pays</Label>
          <CountrySelect value={country} onValueChange={setCountry} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="est-address">Adresse</Label>
          <Input
            id="est-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ex. Liberté 6 Extension, lot 42"
            maxLength={200}
          />
        </div>
        {err ? <p className="text-danger-700 text-sm sm:col-span-2">{err}</p> : null}
      </div>
    </CenterDialog>
  );
}
