/**
 * /settings/establishments/$establishmentId — détail établissement (Stories 3.21/3.26, ADR 0012).
 *
 * Rendu **au pixel près** du bundle Claude Design « __PROJECT_NAME__ Établissements »
 * (`docs/ui-designs/epic-identity/project/settings-establishments.jsx`) : layouts
 * desktop **et** mobile dédiés. Overlays via les shells `CenterDialog` / `SidePanel`
 * (`components/overlays.tsx`). Autorité serveur pour l'établissement actif :
 * `setActive` + reload. Tout passe par `trpc.establishments.*` + `trpc.member.list`.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  FileText,
  Info,
  Lock,
  Pencil,
  RotateCw,
  Search,
  Star,
  Trash2,
  TriangleAlert,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@__SCOPE__/ui/button';
import { Checkbox } from '@__SCOPE__/ui/checkbox';
import { CountrySelect } from '@__SCOPE__/ui/country-select';
import { Input } from '@__SCOPE__/ui/input';
import { Label } from '@__SCOPE__/ui/label';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { Skeleton } from '@__SCOPE__/ui/skeleton';
import { SectionCard, SettingsPageHeader } from '../../../components/settings-page';
import {
  CenterDialog,
  InlineNotice,
  MemberAvatar,
  PrincipalBadge,
  RoleBadge,
  SidePanel,
} from '../../../components/overlays';
import { trpc } from '../../../lib/trpc-client';

export const Route = createFileRoute('/_app/settings/establishments_/$establishmentId')({
  component: EstablishmentDetailPage,
});

interface Establishment {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  isPrimary: boolean;
  createdAt?: string | Date;
}

interface AssignedMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  /** owner/admin : traversent le mur → accès permanent, non retirable. */
  pinned: boolean;
}

interface MemberItem {
  userId: string;
  role: string;
  user: { name: string; email: string };
}

type Phase = 'loading' | 'ready' | 'forbidden' | 'error' | 'notfound';

/* ─── Référentiels ────────────────────────────────────────────────────────── */

const COUNTRY_LABELS: Record<string, string> = {
  SN: 'Sénégal',
  CI: "Côte d'Ivoire",
  BJ: 'Bénin',
  BF: 'Burkina Faso',
  ML: 'Mali',
  TG: 'Togo',
  GN: 'Guinée',
  CM: 'Cameroun',
};

function countryLabel(code: string | null): string {
  if (!code) return '—';
  return COUNTRY_LABELS[code] ?? code;
}

const ROLE_PINNED = new Set(['owner', 'admin']);

function formatDate(value: string | Date | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Badge pays sans emoji : puce ISO2 monospace + libellé. */
function CountryBadge({ code, sm }: { code: string | null; sm?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`bg-terre-100 text-terre-700 inline-flex items-center justify-center rounded-[7px] font-mono font-medium tracking-wide ${sm ? 'h-5 w-5 text-[9px]' : 'h-6 w-6 text-[10px]'}`}
      >
        {code ?? '··'}
      </span>
      <span className={`text-terre-900 ${sm ? 'text-[13px]' : 'text-sm'}`}>
        {countryLabel(code)}
      </span>
    </span>
  );
}

/** Pastille « Vue active » — Soleil discret (jamais un badge plein). */
function ActiveViewPill() {
  return (
    <span className="bg-soleil-50 border-soleil-200 text-soleil-800 rounded-pill inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-medium whitespace-nowrap">
      <span className="bg-soleil-400 ring-soleil-400/20 h-[7px] w-[7px] rounded-full ring-[3px]" />
      Vue active
    </span>
  );
}

interface DetailHandlers {
  edit: () => void;
  del: () => void;
  setPrimary: () => void;
  switchTo: () => void;
  assign: () => void;
  removeMember: (m: AssignedMember) => void;
}

/* ─── Composant principal (état + overlays partagés) ──────────────────────── */

function EstablishmentDetailPage() {
  const { establishmentId } = Route.useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [members, setMembers] = useState<AssignedMember[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLast, setIsLast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AssignedMember | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const est = await trpc.establishments.get.query({ establishmentId });
      setEstablishment(est);

      const [current, list, memberList, assignments] = await Promise.all([
        trpc.establishments.current.query().catch(() => ({ id: null as string | null })),
        trpc.establishments.list.query().catch(() => ({ total: 0 })),
        trpc.member.list.query({}).catch(() => ({ items: [] as MemberItem[] })),
        trpc.establishments.listAssignments
          .query()
          .catch(() => [] as { userId: string; establishmentId: string }[]),
      ]);

      setActiveId(current.id);
      setIsLast(list.total <= 1);

      const assignedHere = new Set(
        assignments.filter((a) => a.establishmentId === establishmentId).map((a) => a.userId),
      );
      const rows: AssignedMember[] = memberList.items
        .map((m) => ({
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          pinned: ROLE_PINNED.has(m.role),
        }))
        .filter((m) => m.pinned || assignedHere.has(m.userId))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.name.localeCompare(b.name));
      setMembers(rows);

      setPhase('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement.';
      if (/not.?found|introuvable/i.test(message)) setPhase('notfound');
      else if (/forbidden|permission/i.test(message)) setPhase('forbidden');
      else {
        setError(message);
        setPhase('error');
      }
    }
  }, [establishmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const back = () => void navigate({ to: '/settings/establishments' });

  const setPrimary = async () => {
    setBusy('primary');
    try {
      await trpc.establishments.setPrimary.mutate({ establishmentId });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec.');
    } finally {
      setBusy(null);
    }
  };

  const switchTo = async () => {
    setBusy('switch');
    try {
      await trpc.establishments.setActive.mutate({ establishmentId });
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de basculer sur cet établissement.');
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await trpc.establishments.delete.mutate({ establishmentId });
      back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la suppression.');
      setDeleteOpen(false);
    } finally {
      setBusy(null);
    }
  };

  const confirmRemoveMember = async () => {
    if (!removeTarget) return;
    setBusy('remove-member');
    try {
      await trpc.establishments.unassignUser.mutate({
        userId: removeTarget.userId,
        establishmentId,
      });
      setRemoveTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec du retrait.');
      setRemoveTarget(null);
    } finally {
      setBusy(null);
    }
  };

  if (phase === 'loading') {
    return (
      <div>
        <BackLink onClick={back} />
        <DetailSkeleton />
      </div>
    );
  }
  if (phase === 'notfound' || phase === 'forbidden') {
    const nf = phase === 'notfound';
    return (
      <div>
        <BackLink onClick={back} />
        <NoticeCard
          icon={nf ? <Search className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
          title={nf ? 'Établissement introuvable' : "Vous n'avez pas accès à cet établissement"}
          description={
            nf
              ? "Cet établissement n'existe plus ou a été supprimé. Il a peut-être été retiré par un autre administrateur."
              : 'Votre périmètre ne couvre pas cet établissement. Demandez à un propriétaire ou administrateur de vous y affecter.'
          }
          action={
            <Button variant="outline" size="sm" onClick={back}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Retour aux établissements
            </Button>
          }
        />
      </div>
    );
  }
  if (phase === 'error' || !establishment) {
    return (
      <div>
        <BackLink onClick={back} />
        <NoticeCard
          tone="brique"
          icon={<TriangleAlert className="h-7 w-7" />}
          title="Impossible de charger l'établissement"
          description={
            error ??
            'Une erreur est survenue de notre côté. Vérifiez votre connexion puis réessayez.'
          }
          action={
            <Button size="sm" onClick={() => void load()}>
              <RotateCw className="mr-1.5 h-3.5 w-3.5" />
              Réessayer
            </Button>
          }
        />
      </div>
    );
  }

  const isActive = activeId === establishment.id;
  const blockedReason = establishment.isPrimary
    ? "Cet établissement est le principal. Désignez d'abord un autre établissement principal avant de le supprimer."
    : isLast
      ? "Impossible de supprimer le dernier établissement de l'organisation."
      : null;

  const handlers: DetailHandlers = {
    edit: () => setEditOpen(true),
    del: () => setDeleteOpen(true),
    setPrimary: () => void setPrimary(),
    switchTo: () => void switchTo(),
    assign: () => setAssignOpen(true),
    removeMember: (m) => setRemoveTarget(m),
  };

  return (
    <div>
      <div className="hidden lg:block">
        <DesktopDetail
          est={establishment}
          members={members}
          isActive={isActive}
          busy={busy}
          error={error}
          blockedReason={blockedReason}
          back={back}
          on={handlers}
        />
      </div>
      <div className="lg:hidden">
        <MobileDetail
          est={establishment}
          members={members}
          isActive={isActive}
          busy={busy}
          error={error}
          back={back}
          on={handlers}
        />
      </div>

      <EditEstablishmentDialog
        open={editOpen}
        establishment={establishment}
        onOpenChange={setEditOpen}
        onSaved={() => {
          setEditOpen(false);
          void load();
        }}
      />

      <CenterDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        width={480}
        icon={<Trash2 className="h-5 w-5" />}
        iconTone="brique"
        title="Supprimer cet établissement ?"
        description="Les affectations associées seront retirées. Cette action est définitive."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
              {blockedReason ? 'Compris' : 'Annuler'}
            </Button>
            {blockedReason ? null : (
              <LoadingButton
                variant="destructive"
                size="sm"
                loading={busy === 'delete'}
                onClick={() => void remove()}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Supprimer l'établissement
              </LoadingButton>
            )}
          </>
        }
      >
        {blockedReason ? (
          <InlineNotice tone="brique" icon={<TriangleAlert className="h-4 w-4" />}>
            {blockedReason}
          </InlineNotice>
        ) : null}
      </CenterDialog>

      <CenterDialog
        open={!!removeTarget}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        width={480}
        icon={<UserMinus className="h-5 w-5" />}
        iconTone="soleil"
        title={`Retirer ${removeTarget?.name ?? ''} de cet établissement ?`}
        description={`${removeTarget?.name ?? 'Ce membre'} n'aura plus accès à ce périmètre. Il reste membre de l'organisation.`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(null)}>
              Annuler
            </Button>
            <LoadingButton
              size="sm"
              loading={busy === 'remove-member'}
              onClick={() => void confirmRemoveMember()}
            >
              Retirer du périmètre
            </LoadingButton>
          </>
        }
      />

      <AssignUsersPanel
        open={assignOpen}
        establishmentId={establishmentId}
        establishmentName={establishment.name}
        onOpenChange={setAssignOpen}
        onChanged={() => void load()}
      />
    </div>
  );
}

/* ─── Détail desktop ──────────────────────────────────────────────────────── */

function DesktopDetail({
  est,
  members,
  isActive,
  busy,
  error,
  blockedReason,
  back,
  on,
}: {
  est: Establishment;
  members: AssignedMember[];
  isActive: boolean;
  busy: string | null;
  error: string | null;
  blockedReason: string | null;
  back: () => void;
  on: DetailHandlers;
}) {
  return (
    <>
      <BackLink onClick={back} />
      <SettingsPageHeader
        breadcrumbs={['Paramètres', 'Établissements', est.name]}
        eyebrow="Établissement"
        title={est.name}
        subtitle={[est.city, est.address].filter(Boolean).join(' · ') || undefined}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {est.isPrimary ? (
              <PrincipalBadge />
            ) : (
              <LoadingButton
                variant="outline"
                size="sm"
                loading={busy === 'primary'}
                onClick={on.setPrimary}
              >
                <Star className="mr-1.5 h-3.5 w-3.5" />
                Définir comme principal
              </LoadingButton>
            )}
            {isActive ? (
              <ActiveViewPill />
            ) : (
              <LoadingButton
                variant="secondary"
                size="sm"
                loading={busy === 'switch'}
                onClick={on.switchTo}
              >
                <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                Basculer sur cet établissement
              </LoadingButton>
            )}
            <Button variant="outline" size="sm" onClick={on.edit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Modifier
            </Button>
            <Button variant="ghost" size="sm" className="text-brique-700" onClick={on.del}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Supprimer
            </Button>
          </div>
        }
      />

      {error ? <p className="text-brique-700 mb-3 text-sm">{error}</p> : null}

      <div className="flex flex-col gap-5">
        <SectionCard
          title="Identité"
          description="Les informations d'état civil de l'établissement."
          padding={24}
          action={
            <Button variant="ghost" size="sm" onClick={on.edit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Modifier
            </Button>
          }
        >
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <IdentityRow label="Nom" value={est.name} />
            <IdentityRow label="Ville" value={est.city || '—'} />
            <IdentityRow label="Adresse" value={est.address || '—'} span2 />
            <IdentityRow label="Pays" value={<CountryBadge code={est.country} />} />
            <IdentityRow label="Date de création" value={formatDate(est.createdAt)} />
          </dl>
        </SectionCard>

        <SectionCard
          title="Membres affectés"
          description="Les membres affectés ne voient que le périmètre de cet établissement. Les propriétaires et administrateurs y accèdent toujours."
          padding={24}
          action={
            members.length > 0 ? (
              <Button size="sm" onClick={on.assign}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Affecter des utilisateurs
              </Button>
            ) : undefined
          }
        >
          {members.length === 0 ? (
            <EmptyMembers onAssign={on.assign} />
          ) : (
            <div className="flex flex-col">
              {members.map((m, i) => (
                <div
                  key={m.userId}
                  className={`flex items-center gap-3.5 py-3.5 ${i > 0 ? 'border-border border-t' : ''}`}
                >
                  <MemberAvatar name={m.name} role={m.role} index={i} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-terre-900 text-sm font-medium">{m.name}</span>
                      <RoleBadge role={m.role} />
                    </div>
                    <div className="text-terre-500 mt-0.5 truncate text-xs">{m.email}</div>
                  </div>
                  {m.pinned ? (
                    <span className="text-terre-400 inline-flex items-center gap-1.5 pr-1.5 text-[11px]">
                      <Lock className="h-3 w-3" />
                      Accès permanent
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-brique-600"
                      onClick={() => on.removeMember(m)}
                    >
                      <UserMinus className="mr-1.5 h-3.5 w-3.5" />
                      Retirer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <OutlookCard />

        <div className="border-brique-200 bg-brique-50 flex flex-wrap items-center justify-between gap-5 rounded-[18px] border px-6 py-5">
          <div className="max-w-[560px] min-w-0">
            <div className="font-display text-brique-800 mb-1 text-base font-medium">
              Supprimer cet établissement
            </div>
            <p className="text-brique-800/85 text-[13px] leading-[1.5]">
              {blockedReason ??
                'Les affectations associées seront retirées. Cette action est définitive.'}
            </p>
          </div>
          <Button variant="destructive" size="sm" disabled={!!blockedReason} onClick={on.del}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Supprimer
          </Button>
        </div>
      </div>
    </>
  );
}

/* ─── Détail mobile (bespoke) ─────────────────────────────────────────────── */

function MobileActionPill({
  icon,
  label,
  tone = 'terre',
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tone?: 'terre' | 'brique';
  onClick: () => void;
}) {
  const cls =
    tone === 'brique' ? 'border-brique-200 text-brique-600' : 'border-border text-terre-900';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-card rounded-pill inline-flex flex-1 items-center justify-center gap-1.5 border px-2.5 py-2.5 text-[13px] font-medium ${cls}`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileDetail({
  est,
  members,
  isActive,
  busy,
  error,
  back,
  on,
}: {
  est: Establishment;
  members: AssignedMember[];
  isActive: boolean;
  busy: string | null;
  error: string | null;
  back: () => void;
  on: DetailHandlers;
}) {
  return (
    <>
      <button
        type="button"
        onClick={back}
        className="text-terre-500 mb-3 inline-flex items-center gap-1.5 text-xs font-medium"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Établissements
      </button>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-terre-900 m-0 text-[28px] leading-[1.1] font-light tracking-[-1px]">
            {est.name}
          </h1>
          {est.city || est.address ? (
            <p className="text-terre-600 mt-1.5 text-[13px]">
              {[est.city, est.address].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>
        {est.isPrimary ? <PrincipalBadge /> : null}
      </div>

      {error ? <p className="text-brique-700 mb-3 text-sm">{error}</p> : null}

      <div className="mb-3.5">
        {isActive ? (
          <ActiveViewPill />
        ) : (
          <LoadingButton
            variant="secondary"
            size="sm"
            className="w-full"
            loading={busy === 'switch'}
            onClick={on.switchTo}
          >
            <RotateCw className="mr-1.5 h-3.5 w-3.5" />
            Basculer sur cet établissement
          </LoadingButton>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {!est.isPrimary ? (
          <MobileActionPill
            icon={<Star className="h-3.5 w-3.5" />}
            label="Principal"
            onClick={on.setPrimary}
          />
        ) : null}
        <MobileActionPill
          icon={<Pencil className="h-3.5 w-3.5" />}
          label="Modifier"
          onClick={on.edit}
        />
        <MobileActionPill
          icon={<Trash2 className="h-3.5 w-3.5" />}
          label="Supprimer"
          tone="brique"
          onClick={on.del}
        />
      </div>

      {/* Identité */}
      <div className="bg-card border-border mb-3.5 rounded-[16px] border p-[18px]">
        <div className="font-display text-terre-900 mb-3.5 text-base font-medium">Identité</div>
        <div className="flex flex-col gap-3.5">
          {[
            { label: 'Adresse', value: est.address || '—' },
            { label: 'Ville', value: est.city || '—' },
            { label: 'Pays', value: <CountryBadge code={est.country} sm /> },
            { label: 'Créé le', value: formatDate(est.createdAt) },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4">
              <span className="text-terre-500 text-[11px] font-semibold tracking-[1px] uppercase">
                {r.label}
              </span>
              <span className="text-terre-900 text-right text-[13px]">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Membres */}
      <div className="bg-card border-border mb-3.5 rounded-[16px] border p-[18px]">
        <div className="font-display text-terre-900 text-base font-medium">Membres affectés</div>
        <p className="text-terre-500 mt-1 mb-3.5 text-xs leading-[1.5]">
          Ils ne voient que le périmètre de cet établissement.
        </p>
        {members.length === 0 ? (
          <EmptyMembers onAssign={on.assign} compact />
        ) : (
          <>
            <div className="flex flex-col">
              {members.map((m, i) => (
                <div
                  key={m.userId}
                  className={`flex items-center gap-3 py-3 ${i > 0 ? 'border-border border-t' : ''}`}
                >
                  <MemberAvatar name={m.name} role={m.role} index={i} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-terre-900 text-[13px] font-medium">{m.name}</div>
                    <div className="mt-1">
                      <RoleBadge role={m.role} />
                    </div>
                  </div>
                  {!m.pinned ? (
                    <button
                      type="button"
                      aria-label={`Retirer ${m.name}`}
                      onClick={() => on.removeMember(m)}
                      className="bg-brique-50 text-brique-600 inline-flex h-8 w-8 items-center justify-center rounded-[8px]"
                    >
                      <UserMinus className="h-[15px] w-[15px]" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3.5 w-full" onClick={on.assign}>
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Affecter des utilisateurs
            </Button>
          </>
        )}
      </div>

      {/* Danger zone */}
      <div className="border-brique-200 bg-brique-50 rounded-[16px] border p-[18px]">
        <div className="font-display text-brique-800 mb-1 text-[15px] font-medium">
          Supprimer cet établissement
        </div>
        <p className="text-brique-800/85 mb-3.5 text-xs leading-[1.5]">
          {est.isPrimary
            ? "Désignez d'abord un autre établissement principal."
            : 'Les affectations associées seront retirées. Action définitive.'}
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          disabled={est.isPrimary}
          onClick={on.del}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Supprimer
        </Button>
      </div>
    </>
  );
}

/* ─── Atomes partagés détail ──────────────────────────────────────────────── */

function IdentityRow({
  label,
  value,
  span2,
}: {
  label: string;
  value: ReactNode;
  span2?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? 'sm:col-span-2' : ''}`}>
      <dt className="text-terre-500 text-[10px] font-semibold tracking-[1.2px] uppercase">
        {label}
      </dt>
      <dd className="text-terre-900 m-0 text-sm">{value}</dd>
    </div>
  );
}

function EmptyMembers({ onAssign, compact }: { onAssign: () => void; compact?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-3 text-center ${compact ? 'py-6' : 'px-4 py-10'}`}
    >
      <span className="bg-terre-100 text-terre-600 inline-flex h-14 w-14 items-center justify-center rounded-[18px]">
        <Users className="h-[26px] w-[26px]" />
      </span>
      <p className="font-display text-terre-900 text-[18px] font-medium tracking-[-0.3px]">
        Aucun membre affecté{compact ? '' : " pour l'instant"}
      </p>
      {!compact ? (
        <p className="text-terre-600 max-w-[360px] text-[13px] leading-[1.5]">
          Affectez des collaborateurs pour leur ouvrir le périmètre de cet établissement. Vous
          pourrez les retirer à tout moment.
        </p>
      ) : null}
      <Button size={compact ? 'sm' : 'default'} className="mt-1" onClick={onAssign}>
        <UserPlus className={`mr-1.5 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
        Affecter{compact ? '' : ' des utilisateurs'}
      </Button>
    </div>
  );
}

function OutlookCard() {
  return (
    <SectionCard
      title="Aperçu de l'activité"
      description="Disponible quand les modules métier seront branchés sur cet établissement."
      padding={24}
      action={
        <span className="border-border text-terre-700 rounded-pill inline-flex items-center border px-2.5 py-[3px] text-[11px] font-medium">
          Bientôt
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Contacts', icon: <Users className="h-4 w-4" /> },
          { label: 'Factures', icon: <FileText className="h-4 w-4" /> },
          { label: 'Encaissements', icon: <Wallet className="h-4 w-4" /> },
        ].map((t) => (
          <div
            key={t.label}
            className="border-border bg-terre-25 flex flex-col gap-2.5 rounded-[14px] border border-dashed p-[18px] opacity-70"
          >
            <span className="bg-terre-100 text-terre-400 inline-flex h-8 w-8 items-center justify-center rounded-[9px]">
              {t.icon}
            </span>
            <div>
              <div className="font-display text-terre-300 text-3xl leading-none font-light">—</div>
              <div className="text-terre-500 mt-1.5 text-xs">{t.label}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-terre-500 hover:text-terre-800 mb-3.5 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Tous les établissements
    </button>
  );
}

function NoticeCard({
  icon,
  tone = 'terre',
  title,
  description,
  action,
}: {
  icon: ReactNode;
  tone?: 'terre' | 'brique';
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const chip = tone === 'brique' ? 'bg-brique-50 text-brique-600' : 'bg-terre-100 text-terre-700';
  return (
    <div className="bg-card border-border flex flex-col items-center gap-3.5 rounded-[20px] border px-6 py-14 text-center shadow-xs">
      <span
        className={`inline-flex h-[60px] w-[60px] items-center justify-center rounded-[18px] ${chip}`}
      >
        {icon}
      </span>
      <div className="font-display text-terre-900 text-[22px] font-medium tracking-[-0.4px]">
        {title}
      </div>
      <p className="text-terre-600 max-w-[420px] text-sm leading-[1.55]">{description}</p>
      {action}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <div className="mb-7 flex items-end justify-between gap-5">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-72 rounded-xl" />
          <Skeleton className="h-3.5 w-52" />
        </div>
        <div className="hidden gap-2 sm:flex">
          <Skeleton className="rounded-pill h-9 w-32" />
          <Skeleton className="rounded-pill h-9 w-24" />
        </div>
      </div>
      <div className="flex flex-col gap-5">
        {[200, 240, 150].map((h, i) => (
          <div key={i} className="bg-card border-border rounded-[20px] border p-6">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <div className="h-4" />
            <Skeleton className="w-full rounded-xl" style={{ height: h - 60 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Dialog édition (CenterDialog) ───────────────────────────────────────── */

function EditEstablishmentDialog({
  open,
  establishment,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  establishment: Establishment;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(establishment.name);
  const [city, setCity] = useState(establishment.city ?? '');
  const [address, setAddress] = useState(establishment.address ?? '');
  const [country, setCountry] = useState(establishment.country ?? 'SN');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(establishment.name);
      setCity(establishment.city ?? '');
      setAddress(establishment.address ?? '');
      setCountry(establishment.country ?? 'SN');
      setErr(null);
    }
  }, [open, establishment]);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await trpc.establishments.update.mutate({
        establishmentId: establishment.id,
        name: name.trim(),
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        country: country || undefined,
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Échec.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <CenterDialog
      open={open}
      onOpenChange={onOpenChange}
      width={540}
      icon={<Pencil className="h-5 w-5" />}
      iconTone="soleil"
      title="Modifier l'établissement"
      description="Mettez à jour le nom, la ville, l'adresse ou le pays."
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
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Enregistrer
          </LoadingButton>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>
            Nom <span className="text-soleil-600">*</span>
          </Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          <div className="text-terre-500 text-right font-mono text-[11px]">{name.length}/120</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Ville</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Pays</Label>
          <CountrySelect value={country} onValueChange={setCountry} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Adresse</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
        </div>
        {err ? <p className="text-brique-700 text-sm sm:col-span-2">{err}</p> : null}
      </div>
    </CenterDialog>
  );
}

/* ─── Panneau « Affecter des utilisateurs » (SidePanel) ───────────────────── */

function AssignUsersPanel({
  open,
  establishmentId,
  establishmentName,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  establishmentId: string;
  establishmentName: string;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<AssignedMember[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [memberList, assignments] = await Promise.all([
        trpc.member.list.query({}),
        trpc.establishments.listAssignments.query(),
      ]);
      setRows(
        memberList.items.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          pinned: ROLE_PINNED.has(m.role),
        })),
      );
      setAssigned(
        new Set(
          assignments.filter((a) => a.establishmentId === establishmentId).map((a) => a.userId),
        ),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const toggle = async (userId: string, next: boolean) => {
    setBusy(userId);
    setErr(null);
    try {
      if (next) {
        await trpc.establishments.assignUser.mutate({ userId, establishmentId });
        setAssigned((s) => new Set(s).add(userId));
      } else {
        await trpc.establishments.unassignUser.mutate({ userId, establishmentId });
        setAssigned((s) => {
          const n = new Set(s);
          n.delete(userId);
          return n;
        });
      }
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Échec.');
    } finally {
      setBusy(null);
    }
  };

  const extra = rows.filter((m) => !m.pinned && assigned.has(m.userId)).length;

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={establishmentName}
      title="Affecter des utilisateurs"
      footer={
        <Button size="sm" onClick={() => onOpenChange(false)}>
          <Check className="mr-1.5 h-3.5 w-3.5" />
          Terminé
        </Button>
      }
    >
      <p className="text-terre-600 mb-4 text-[13px] leading-[1.55]">
        Cochez les membres autorisés sur ce périmètre. Les propriétaires et administrateurs y
        accèdent toujours.
      </p>
      {err ? (
        <div className="mb-3">
          <InlineNotice tone="brique" icon={<TriangleAlert className="h-4 w-4" />}>
            {err}
          </InlineNotice>
        </div>
      ) : null}
      {loading ? (
        <p className="text-terre-500 py-6 text-center text-sm">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-terre-600 py-6 text-center text-sm">Aucun membre dans l'organisation.</p>
      ) : (
        <div className="flex flex-col">
          {rows.map((m, i) => (
            <label
              key={m.userId}
              className={`flex items-center gap-3 py-3 ${i > 0 ? 'border-border border-t' : ''} ${m.pinned ? 'opacity-70' : 'cursor-pointer'}`}
            >
              <MemberAvatar name={m.name} role={m.role} index={i} size={36} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-terre-900 text-[13px] font-medium">{m.name}</span>
                  <RoleBadge role={m.role} />
                </span>
                <span className="text-terre-500 block truncate text-xs">{m.email}</span>
              </span>
              {m.pinned ? (
                <span className="text-terre-400 inline-flex items-center gap-1.5 pr-1 text-[11px]">
                  <Lock className="h-3 w-3" />
                  Accès permanent
                </span>
              ) : (
                <Checkbox
                  checked={assigned.has(m.userId)}
                  disabled={busy === m.userId}
                  onCheckedChange={(v) => void toggle(m.userId, v === true)}
                />
              )}
            </label>
          ))}
        </div>
      )}
      {!loading && rows.length > 0 ? (
        <div className="text-terre-500 mt-4 inline-flex items-center gap-1.5 text-xs">
          <Info className="text-terre-400 h-3 w-3" />
          {extra} membre{extra > 1 ? 's' : ''} affecté{extra > 1 ? 's' : ''} en plus des accès
          permanents.
        </div>
      ) : null}
    </SidePanel>
  );
}
