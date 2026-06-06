/**
 * /settings/team — équipe : membres + invitations (Story 3.17, AC 3.9).
 *
 * Refonte pixel-perfect sur le bundle Claude Design "__PROJECT_NAME__ shadcn Canvas"
 * (`settings-team.jsx`, 437 lignes) :
 *  - Header dynamique "Votre équipe compte N membre(s)"
 *  - SectionCard "Membres" padding 20 avec toolbar (Input search + Filtres)
 *  - Filtrage live local (name / email contains case-insensitive)
 *  - SectionCard "Invitations en attente" avec Badge pending
 *  - Dialog Invitation : rôles assignables dynamiques (prédéfinis + custom si le
 *    plan le permet) et aperçu **lecture seule** des modules accordés par le
 *    rôle sélectionné, Textarea message personnalisé
 *
 * Cohérence RBAC (Epic 3) : l'accès aux modules d'un membre **découle de son
 * rôle** (∩ entitlement de l'org) ; il ne se choisit pas par invitation. Le
 * dialog dérive donc les modules accessibles du rôle via `invitation.assignableRoles`
 * (source unique côté serveur, calcul `@__SCOPE__/rbac`).
 *
 * Câblage backend : Better-Auth (`organization.getFullOrganization`,
 * `inviteMember` email+role, `removeMember`, `cancelInvitation`) + tRPC
 * `invitation.assignableRoles` (rôles + modules accessibles).
 *
 * Compromis MVP :
 *  - Pas d'invitation SMS — sera ajouté Story 5.4 Twilio (endpoint custom)
 *  - Message personnalisé : juste UI (Story 3.9bis câblage `personalMessage`)
 *  - "Importer (CSV)" + "Filtres" : visibles mais disabled
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Building2,
  Filter,
  Info,
  Mail,
  MoreHorizontal,
  Search,
  Send,
  TriangleAlert,
  Upload,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@__SCOPE__/ui/avatar';
import { Badge } from '@__SCOPE__/ui/badge';
import { Button } from '@__SCOPE__/ui/button';
import { Input } from '@__SCOPE__/ui/input';
import { Label } from '@__SCOPE__/ui/label';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@__SCOPE__/ui/select';
import { Skeleton } from '@__SCOPE__/ui/skeleton';
import { Checkbox } from '@__SCOPE__/ui/checkbox';
import { SettingsPageHeader } from '../../../components/settings-page';
import { GridTable } from '../../../components/grid-table';
import type { GridColumn } from '../../../components/grid-table';
import { PaginationBar } from '../../../components/pagination-bar';
import {
  CenterDialog,
  InlineNotice,
  PrincipalBadge,
  SidePanel,
} from '../../../components/overlays';
import { authClient } from '../../../lib/auth-client';
import { roleLabel as predefinedRoleLabel } from '../../../lib/role-display';
import { useEstablishments } from '../../../lib/queries';
import { trpc } from '../../../lib/trpc-client';

export const Route = createFileRoute('/_app/settings/team')({ component: TeamPage });

/* ─── Rôles assignables (source serveur) + helpers ──────────────────────── */

/** Réponse de `invitation.assignableRoles` (modules accessibles dérivés du rôle). */
interface AssignableModule {
  id: string;
  label: string;
  icon: string;
}
interface AssignableRole {
  name: string;
  description: string | null;
  isPredefined: boolean;
  accessibleModules: string[];
}
interface AssignableRoles {
  modules: AssignableModule[];
  roles: AssignableRole[];
}

/** Label de rôle — délègue au mapping partagé (custom → leur nom ; null → Membre). */
function roleLabel(role: string | null | undefined): string {
  return predefinedRoleLabel(role ?? 'member');
}

function roleBadgeClass(role: string | null | undefined): string {
  switch (role) {
    case 'owner':
      return 'bg-brand-100 text-brand-800';
    case 'admin':
      return 'bg-success-50 text-success-800';
    case 'guest':
      return 'bg-base-100 text-base-700';
    default:
      return 'bg-base-50 text-base-700';
  }
}

/** Libellé court "expire dans X jours" — utilisé par les cards mobile
 * d'invitations (la table desktop affiche une date complète). */
function formatExpiry(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'expirée';
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'demain';
  return `dans ${days} jours`;
}

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Member {
  id: string;
  role: string;
  createdAt: string;
  user: { name: string; email: string; image: string | null };
}
interface Invitation {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

/** Statuts d'invitation filtrables (alignés sur le schéma Better-Auth). */
type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';
const INVITE_STATUS_LABELS: Record<InviteStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptées',
  rejected: 'Refusées',
  canceled: 'Annulées',
};

/* ─── Page ──────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 20;

function TeamPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [total, setTotal] = useState(0); // total réel de l'équipe (non filtré)
  const [memberTotal, setMemberTotal] = useState(0); // total filtré → pagination
  const [memberPage, setMemberPage] = useState(0);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteTotal, setInviteTotal] = useState(0);
  const [invitePage, setInvitePage] = useState(0);
  const [invitationTargets, setInvitationTargets] = useState<
    Array<{ invitationId: string; establishmentId: string }>
  >([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  // Noms d'établissements (pour afficher les cibles des invitations, Story 3.25).
  const establishments = useEstablishments().data ?? [];

  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  // Filtres pilotant le fetch backend (vrai filtrage SQL via `trpc.member.*`).
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // '' = tous les rôles
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>('pending');

  // Session — résolue une seule fois (currentEmail + garde signin).
  useEffect(() => {
    void authClient.getSession().then((session) => {
      if (!session.data) {
        window.location.assign('/signin');
        return;
      }
      setCurrentEmail(session.data.user.email);
    });
  }, []);

  // Chargement filtré (membres + invitations). Les filtres sont passés au
  // serveur ; aucun filtrage JS résiduel.
  const loadData = useCallback(async () => {
    const [list, invites, targets] = await Promise.all([
      trpc.member.list.query({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        page: memberPage,
        pageSize: PAGE_SIZE,
      }),
      trpc.member.listInvitations.query({
        status: inviteStatus,
        page: invitePage,
        pageSize: PAGE_SIZE,
      }),
      trpc.establishments.listInvitationEstablishments.query().catch(() => []),
    ]);
    setMembers(list.items);
    setTotal(list.total);
    setMemberTotal(list.filteredTotal);
    setAvailableRoles(list.availableRoles);
    setInvitations(invites.items);
    setInviteTotal(invites.total);
    setInvitationTargets(targets);
  }, [search, roleFilter, inviteStatus, memberPage, invitePage]);

  // Tout changement de filtre ramène à la première page de la table concernée.
  useEffect(() => setMemberPage(0), [search, roleFilter]);
  useEffect(() => setInvitePage(0), [inviteStatus]);

  // Debounce — la frappe dans la recherche ne déclenche qu'une requête après
  // ~250 ms d'inactivité ; les changements de Select rafraîchissent aussi.
  useEffect(() => {
    const t = setTimeout(() => void loadData(), 250);
    return () => clearTimeout(t);
  }, [loadData]);

  async function removeMember(m: Member) {
    setBusy(m.id);
    await authClient.organization.removeMember({ memberIdOrEmail: m.id });
    setBusy(null);
    await loadData();
  }

  async function cancelInvite(inv: Invitation) {
    setBusy(inv.id);
    await authClient.organization.cancelInvitation({ invitationId: inv.id });
    setBusy(null);
    await loadData();
  }

  // invitationId → noms d'établissements cibles (Story 3.25 — AC4).
  const estNameById = new Map(establishments.map((e) => [e.id, e.name]));
  const targetNames = new Map<string, string[]>();
  for (const t of invitationTargets) {
    const name = estNameById.get(t.establishmentId);
    if (!name) continue;
    targetNames.set(t.invitationId, [...(targetNames.get(t.invitationId) ?? []), name]);
  }

  return (
    <>
      <SettingsPageHeader
        breadcrumbs={['Paramètres', 'Organisation', 'Équipe']}
        eyebrow="Organisation · Équipe"
        title="Votre équipe compte"
        italic={members === null ? '…' : `${total} membre${total > 1 ? 's' : ''}.`}
        subtitle="Invitez, gérez les rôles et révoquez les accès. Les invitations expirent au bout de 7 jours."
        actions={
          <>
            <Button type="button" variant="outline" size="sm" disabled title="Bientôt — import CSV">
              <Upload className="mr-1.5 h-4 w-4" />
              Importer (CSV)
            </Button>
            <Button type="button" size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-1.5 h-4 w-4" />
              Inviter un membre
            </Button>
          </>
        }
      />

      <TeamContent
        members={members}
        memberTotal={memberTotal}
        memberPage={memberPage}
        setMemberPage={setMemberPage}
        availableRoles={availableRoles}
        invitations={invitations}
        inviteTotal={inviteTotal}
        invitePage={invitePage}
        setInvitePage={setInvitePage}
        targetNames={targetNames}
        currentEmail={currentEmail}
        busy={busy}
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        inviteStatus={inviteStatus}
        setInviteStatus={setInviteStatus}
        onRemove={(m) => setRemoveTarget(m)}
        onCancelInvite={cancelInvite}
      />

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSent={() => {
          setInviteOpen(false);
          void loadData();
        }}
      />

      <RemoveMemberDialog
        member={removeTarget}
        lastOwner={
          !!removeTarget &&
          removeTarget.role === 'owner' &&
          (members ?? []).filter((m) => m.role === 'owner').length <= 1
        }
        busy={busy === removeTarget?.id}
        onClose={() => setRemoveTarget(null)}
        onConfirm={async () => {
          if (removeTarget) await removeMember(removeTarget);
          setRemoveTarget(null);
        }}
      />
    </>
  );
}

/* ─── RemoveMemberDialog (Écran 6 — retrait org, garde dernier owner) ─────── */

function RemoveMemberDialog({
  member,
  lastOwner,
  busy,
  onClose,
  onConfirm,
}: {
  member: Member | null;
  lastOwner: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <CenterDialog
      open={!!member}
      onOpenChange={(v) => !v && onClose()}
      width={480}
      icon={<UserMinus className="h-5 w-5" />}
      iconTone="danger"
      title={`Retirer ${member?.user.name ?? ''} de l'organisation ?`}
      description="Ses affectations à tous les établissements seront supprimées. Cette action est définitive."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {lastOwner ? 'Compris' : 'Annuler'}
          </Button>
          {lastOwner ? null : (
            <LoadingButton variant="destructive" size="sm" loading={busy} onClick={onConfirm}>
              <UserMinus className="mr-1.5 h-3.5 w-3.5" />
              Retirer de l'organisation
            </LoadingButton>
          )}
        </>
      }
    >
      {lastOwner ? (
        <InlineNotice tone="danger" icon={<TriangleAlert className="h-4 w-4" />}>
          Impossible de retirer le dernier propriétaire de l'organisation. Désignez d'abord un autre
          propriétaire.
        </InlineNotice>
      ) : null}
    </CenterDialog>
  );
}

/** Dropdown de filtre par rôle — partagé desktop/mobile. */
function RoleFilterSelect({
  availableRoles,
  value,
  onChange,
  className,
}: {
  availableRoles: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  // Valeur sentinelle « tous » : Radix Select n'autorise pas d'item à value="".
  return (
    <Select value={value || 'all'} onValueChange={(v) => onChange(v === 'all' ? '' : v)}>
      <SelectTrigger className={className} aria-label="Filtrer par rôle">
        <span className="flex items-center gap-1.5">
          <Filter className="text-base-400 h-3.5 w-3.5" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tous les rôles</SelectItem>
        {availableRoles.map((r) => (
          <SelectItem key={r} value={r}>
            {roleLabel(r)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Dropdown de filtre par statut d'invitation — partagé desktop/mobile. */
function InviteStatusSelect({
  value,
  onChange,
  className,
}: {
  value: InviteStatus;
  onChange: (v: InviteStatus) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as InviteStatus)}>
      <SelectTrigger className={className} aria-label="Filtrer par statut">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(INVITE_STATUS_LABELS) as InviteStatus[]).map((s) => (
          <SelectItem key={s} value={s}>
            {INVITE_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ─── TeamContent : 2 SectionCards + DataTable + filtrage live ──────────── */

function TeamContent({
  members,
  memberTotal,
  memberPage,
  setMemberPage,
  availableRoles,
  invitations,
  inviteTotal,
  invitePage,
  setInvitePage,
  targetNames,
  currentEmail,
  busy,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  inviteStatus,
  setInviteStatus,
  onRemove,
  onCancelInvite,
}: {
  members: Member[] | null;
  memberTotal: number;
  memberPage: number;
  setMemberPage: (p: number) => void;
  availableRoles: string[];
  invitations: Invitation[];
  inviteTotal: number;
  invitePage: number;
  setInvitePage: (p: number) => void;
  targetNames: Map<string, string[]>;
  currentEmail: string;
  busy: string | null;
  search: string;
  setSearch: (v: string) => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
  inviteStatus: InviteStatus;
  setInviteStatus: (v: InviteStatus) => void;
  onRemove: (m: Member) => void;
  onCancelInvite: (inv: Invitation) => Promise<void>;
}) {
  const loading = members === null;
  const list = members ?? [];

  const memberColumns = useMemo<GridColumn<Member>[]>(
    () => [
      {
        id: 'member',
        width: '2fr',
        header: 'Membre',
        cell: (m) => {
          const isYou = m.user.email === currentEmail;
          return (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-brand-100 text-brand-800 text-sm font-medium">
                  {m.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base-900 text-[13px] font-medium">{m.user.name}</span>
                  {isYou ? (
                    <span className="bg-brand-50 text-brand-600 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.4px] uppercase">
                      c'est vous
                    </span>
                  ) : null}
                </div>
                <div className="text-base-500 truncate text-xs">{m.user.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'role',
        width: '1fr',
        header: 'Rôle',
        cell: (m) => (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeClass(m.role)}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden />
            {roleLabel(m.role)}
          </span>
        ),
      },
      {
        id: 'added',
        width: '1fr',
        header: 'Ajouté',
        cell: (m) => (
          <span className="text-base-600 text-xs">
            {new Date(m.createdAt).toLocaleDateString('fr-FR')}
          </span>
        ),
      },
      {
        id: 'actions',
        width: '110px',
        cellClassName: 'flex justify-end',
        cell: (m) => {
          const isYou = m.user.email === currentEmail;
          if (!isYou && m.role !== 'owner') {
            return (
              <LoadingButton
                type="button"
                variant="ghost"
                size="sm"
                loading={busy === m.id}
                onClick={() => onRemove(m)}
                className="text-danger-700 hover:text-danger-900"
              >
                Retirer
              </LoadingButton>
            );
          }
          return (
            <button
              type="button"
              className="text-base-500 hover:bg-base-50 inline-flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-50"
              aria-label="Actions"
              disabled
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          );
        },
      },
    ],
    [currentEmail, busy, onRemove],
  );

  const inviteColumns = useMemo<GridColumn<Invitation>[]>(
    () => [
      {
        id: 'email',
        width: '2fr',
        header: 'Email',
        cell: (inv) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="bg-brand-50 text-brand-700 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]">
              <Mail className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-base-900 truncate text-[13px] font-medium">{inv.email}</div>
              {(targetNames.get(inv.id)?.length ?? 0) > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {targetNames.get(inv.id)?.map((n) => (
                    <span
                      key={n}
                      className="bg-brand-50 text-brand-700 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    >
                      <Building2 className="h-2.5 w-2.5" />
                      {n}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-base-500 text-[11px]">Invitation envoyée</div>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'role',
        width: '1fr',
        header: 'Rôle',
        cell: (inv) => (
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeClass(inv.role)}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden />
            {roleLabel(inv.role)}
          </span>
        ),
      },
      {
        id: 'expiresAt',
        width: '1.2fr',
        header: 'Expire',
        cell: (inv) => (
          <span className="text-base-600 text-xs">
            le {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
          </span>
        ),
      },
      {
        id: 'actions',
        width: '110px',
        cellClassName: 'flex justify-end',
        cell: (inv) =>
          inv.status === 'pending' ? (
            <LoadingButton
              type="button"
              variant="ghost"
              size="sm"
              loading={busy === inv.id}
              onClick={() => onCancelInvite(inv)}
              className="text-danger-700 hover:text-danger-900"
            >
              Révoquer
            </LoadingButton>
          ) : null,
      },
    ],
    [busy, onCancelInvite, targetNames],
  );

  const memberMobileCard = (m: Member) => {
    const isYou = m.user.email === currentEmail;
    const canRemove = !isYou && m.role !== 'owner';
    return (
      <article className="bg-card border-border-subtle flex items-center gap-3 rounded-2xl border-[0.5px] p-3.5">
        <Avatar className="h-[42px] w-[42px] shrink-0">
          <AvatarFallback className={`${roleBadgeClass(m.role)} text-sm font-medium`}>
            {m.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base-900 text-sm font-medium">{m.user.name}</span>
            {isYou ? (
              <span className="bg-brand-50 text-brand-600 rounded-full px-1.5 py-px text-[9px] font-semibold tracking-[0.4px] uppercase">
                vous
              </span>
            ) : null}
          </div>
          <div className="text-base-500 mt-0.5 truncate text-xs">{m.user.email}</div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${roleBadgeClass(m.role)}`}
            >
              <span className="h-1 w-1 rounded-full bg-current opacity-60" aria-hidden />
              {roleLabel(m.role)}
            </span>
          </div>
        </div>
        {canRemove ? (
          <LoadingButton
            type="button"
            variant="ghost"
            size="sm"
            loading={busy === m.id}
            onClick={() => onRemove(m)}
            className="text-danger-700 hover:text-danger-900 shrink-0"
          >
            Retirer
          </LoadingButton>
        ) : (
          <button
            type="button"
            aria-label="Actions"
            disabled
            className="bg-base-50 text-base-700 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:opacity-50"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </article>
    );
  };

  const inviteMobileCard = (p: Invitation) => (
    <article className="bg-card border-border-subtle rounded-2xl border-[0.5px] p-3.5">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="bg-brand-50 text-brand-700 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]">
          <Mail className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base-900 truncate text-[13px] font-medium">{p.email}</div>
          <div className="text-base-500 text-[11px]">
            {p.status === 'pending'
              ? `Expire ${formatExpiry(p.expiresAt)}`
              : INVITE_STATUS_LABELS[p.status as InviteStatus]}
          </div>
        </div>
      </div>
      {(targetNames.get(p.id)?.length ?? 0) > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {targetNames.get(p.id)?.map((n) => (
            <span
              key={n}
              className="bg-brand-50 text-brand-700 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            >
              <Building2 className="h-2.5 w-2.5" />
              {n}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${roleBadgeClass(p.role)}`}
        >
          <span className="h-1 w-1 rounded-full bg-current opacity-60" aria-hidden />
          {roleLabel(p.role)}
        </span>
        {p.status === 'pending' ? (
          <LoadingButton
            type="button"
            variant="ghost"
            size="sm"
            loading={busy === p.id}
            onClick={() => onCancelInvite(p)}
            className="text-danger-700 hover:text-danger-900"
          >
            Révoquer
          </LoadingButton>
        ) : null}
      </div>
    </article>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ── Membres ──────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base-500 text-[10px] font-semibold tracking-[1.2px] uppercase">
            {loading ? 'Membres' : `Membres · ${memberTotal}`}
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="text-base-400 pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Filtrer par nom, e-mail…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full pl-9 text-xs sm:w-[240px]"
              />
            </div>
            <RoleFilterSelect
              availableRoles={availableRoles}
              value={roleFilter}
              onChange={setRoleFilter}
              className="h-9 w-[150px] shrink-0 text-xs"
            />
          </div>
        </div>
        {!loading && list.length === 0 ? (
          <div className="bg-card border-border-subtle text-base-600 rounded-[14px] border-[0.5px] p-6 text-center text-sm">
            {search || roleFilter
              ? 'Aucun membre ne correspond à ces filtres.'
              : 'Invitez vos collaborateurs pour démarrer ensemble.'}
          </div>
        ) : (
          <>
            <GridTable<Member>
              data={list}
              loading={loading}
              columns={memberColumns}
              getRowId={(m) => m.id}
              skeletonRows={3}
              mobileCard={memberMobileCard}
            />
            <PaginationBar
              page={memberPage}
              pageSize={PAGE_SIZE}
              total={memberTotal}
              shown={list.length}
              noun={['membre', 'membres']}
              onPageChange={setMemberPage}
            />
          </>
        )}
      </section>

      {/* ── Invitations ──────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base-500 text-[10px] font-semibold tracking-[1.2px] uppercase">
              Invitations
            </h3>
            {inviteTotal > 0 ? <Badge variant="pending">{inviteTotal}</Badge> : null}
          </div>
          <InviteStatusSelect
            value={inviteStatus}
            onChange={setInviteStatus}
            className="h-9 w-[150px] text-xs"
          />
        </div>
        {invitations.length === 0 ? (
          <div className="bg-card border-border-subtle text-base-600 rounded-[14px] border-[0.5px] p-6 text-center text-sm">
            Aucune invitation « {INVITE_STATUS_LABELS[inviteStatus].toLowerCase()} » pour le moment.
          </div>
        ) : (
          <>
            <GridTable<Invitation>
              data={invitations}
              columns={inviteColumns}
              getRowId={(p) => p.id}
              mobileCard={inviteMobileCard}
            />
            <PaginationBar
              page={invitePage}
              pageSize={PAGE_SIZE}
              total={inviteTotal}
              shown={invitations.length}
              noun={['invitation', 'invitations']}
              onPageChange={setInvitePage}
            />
          </>
        )}
      </section>
    </div>
  );
}

/* ─── InviteDialog (rôle + aperçu modules dérivé + message) ─────────────── */

/** Rôle par défaut à présélectionner : `member` si dispo, sinon le 1er rôle. */
function defaultRoleName(roles: AssignableRole[]): string {
  return roles.find((r) => r.name === 'member')?.name ?? roles[0]?.name ?? '';
}

function InviteDialog({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('member');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Établissement(s) d'appartenance (Story 3.25) — siège pré-coché ; bloc masqué si mono-site.
  const establishments = useEstablishments().data ?? [];
  const multiEstablishment = establishments.length >= 2;
  const [selectedEst, setSelectedEst] = useState<string[]>([]);

  // Rôles assignables + modules accessibles — source serveur (RBAC, cohérent
  // avec l'entitlement de l'org). Re-fetch à CHAQUE ouverture : le dialog reste
  // monté en permanence, donc sans cela un rôle custom créé entre-temps (ou un
  // changement d'org active) ne serait jamais reflété sans recharger la page.
  const [data, setData] = useState<AssignableRoles | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadError(false);
    setData(null); // force le skeleton + un fetch frais à chaque ouverture
    trpc.invitation.assignableRoles
      .query()
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setRole(defaultRoleName(res.roles));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedRole = data?.roles.find((r) => r.name === role) ?? null;
  const hasCustomRole = (data?.roles ?? []).some((r) => !r.isPredefined);

  // Défaut = siège ; (re)appliqué à l'ouverture. `primaryId` est stable → pas de boucle.
  const primaryId = establishments.find((e) => e.isPrimary)?.id ?? establishments[0]?.id ?? null;
  useEffect(() => {
    if (open) setSelectedEst(primaryId ? [primaryId] : []);
  }, [open, primaryId]);
  const toggleEst = (id: string) =>
    setSelectedEst((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  function reset() {
    setEmail('');
    setRole(data ? defaultRoleName(data.roles) : 'member');
    setSelectedEst(primaryId ? [primaryId] : []);
    setError(null);
  }

  const canSend = email.trim().length >= 5 && Boolean(selectedRole);

  async function send() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    const { data: inv, error: err } = await authClient.organization.inviteMember({
      email: email.trim(),
      role,
    });
    if (err || !inv) {
      setSending(false);
      setError(err?.message ?? "L'invitation a échoué.");
      return;
    }
    // Story 3.25 : attache les établissements cibles à l'invitation (best-effort).
    if (multiEstablishment && selectedEst.length > 0) {
      await trpc.establishments.setInvitationEstablishments
        .mutate({ invitationId: inv.id, establishmentIds: selectedEst })
        .catch(() => undefined);
    }
    setSending(false);
    reset();
    onSent();
  }

  const isPrivileged = role === 'owner' || role === 'admin';
  const noneChecked = multiEstablishment && selectedEst.length === 0;

  return (
    <SidePanel
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
      eyebrow="Organisation"
      title="Inviter un membre"
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <LoadingButton
            type="button"
            size="sm"
            loading={sending}
            disabled={!canSend || sending}
            onClick={send}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Envoyer l'invitation
          </LoadingButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Input email (plein largeur, sans tab) */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">Adresse e-mail</Label>
          <div className="relative">
            <Mail className="text-base-400 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="invite-email"
              type="email"
              placeholder="prenom.nom@exemple.sn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Rôle — grille dynamique (prédéfinis + custom si le plan le permet) */}
        <div className="flex flex-col gap-2">
          <Label>Rôle</Label>
          {loadError ? (
            <p className="text-danger-700 text-[13px]">
              Impossible de charger les rôles. Réessayez en rouvrant la fenêtre.
            </p>
          ) : !data ? (
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-9 rounded-[12px]" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {data.roles.map((r) => {
                  const selected = role === r.name;
                  return (
                    <button
                      key={r.name}
                      type="button"
                      onClick={() => setRole(r.name)}
                      title={r.description ?? undefined}
                      className={`rounded-[12px] border px-1.5 py-2 text-[11px] font-medium transition-colors sm:px-2 sm:py-2.5 sm:text-xs ${
                        selected
                          ? 'border-brand-400 bg-brand-50 text-base-900'
                          : 'border-border bg-card text-base-900 hover:border-base-300'
                      }`}
                    >
                      {roleLabel(r.name)}
                    </button>
                  );
                })}
              </div>
              {!hasCustomRole ? (
                <p className="text-base-500 text-[11px]">
                  Les rôles personnalisés sont disponibles avec les plans Pro/Enterprise.
                </p>
              ) : null}
            </>
          )}
        </div>

        {/* Périmètre établissements (Story 3.25) — masqué si mono-établissement */}
        {multiEstablishment ? (
          <div className="flex flex-col gap-2">
            <Label>Périmètre établissements</Label>
            <p className="text-base-500 text-[12px] leading-[1.5]">
              {isPrivileged
                ? 'Les propriétaires et administrateurs accèdent à tous les établissements.'
                : 'Le membre ne verra que les établissements cochés. Laissez vide pour le rattacher au siège.'}
            </p>
            <div className="border-border rounded-[14px] border px-3.5">
              {establishments.map((e, i) => {
                const checked = isPrivileged ? true : selectedEst.includes(e.id);
                return (
                  <label
                    key={e.id}
                    className={`flex items-center gap-3 py-3 ${i > 0 ? 'border-border border-t' : ''} ${isPrivileged ? 'opacity-55' : 'cursor-pointer'}`}
                  >
                    <span className="bg-base-100 text-base-700 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]">
                      <Building2 className="h-[15px] w-[15px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-base-900 text-[13px] font-medium">{e.name}</span>
                        {e.isPrimary ? <PrincipalBadge /> : null}
                      </span>
                    </span>
                    <Checkbox
                      checked={checked}
                      disabled={isPrivileged}
                      onCheckedChange={() => toggleEst(e.id)}
                    />
                  </label>
                );
              })}
            </div>
            {!isPrivileged && noneChecked ? (
              <div className="text-base-500 inline-flex items-center gap-1.5 text-[11.5px]">
                <Info className="text-base-400 h-3 w-3" />
                Aucun coché — le membre sera rattaché au siège.
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="text-danger-700 text-sm">{error}</p> : null}
      </div>
    </SidePanel>
  );
}
