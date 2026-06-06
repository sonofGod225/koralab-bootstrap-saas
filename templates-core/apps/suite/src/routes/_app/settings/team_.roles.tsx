/**
 * /settings/team/roles — liste des rôles (Stories 3.10/3.11/3.17).
 *
 * Refonte sur le bundle Claude Design `settings-roles.jsx` :
 *  - cartes de rôle (icône + ton, description, compteur de membres, badge
 *    Prédéfini / Personnalisé) en grille 2 colonnes ;
 *  - section « Rôles prédéfinis » (non éditables, ouvre la matrice en lecture
 *    seule) + section « Rôles personnalisés » ;
 *  - carte upsell affichée à la place des rôles custom quand l'organisation
 *    est sur le plan gratuit (gating UI-only — cf. `rbac.ts`).
 *
 * Tout passe par `trpc.rbac.*` (protégé `identity:role:*`). La création et
 * l'édition se font sur la page dédiée `team.roles.$roleId.tsx`.
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@__SCOPE__/ui/button';
import { Skeleton } from '@__SCOPE__/ui/skeleton';
import { SectionCard, SettingsPageHeader } from '../../../components/settings-page';
import { roleLabel, roleVisual, toneIconBox } from '../../../lib/role-display';
import { trpc } from '../../../lib/trpc-client';

export const Route = createFileRoute('/_app/settings/team_/roles')({ component: RolesPage });

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  isPredefined: boolean;
  memberCount: number;
  updatedAt: string | Date | null;
  rules: { effect: string; permission: string }[];
}

type Phase = 'loading' | 'ready' | 'forbidden' | 'error';

/* ─── Page ──────────────────────────────────────────────────────────────── */

function RolesPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [customRolesLocked, setCustomRolesLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Story 3.11 — entitlement résolu côté serveur via la feature dynamique
      // `custom_roles` (catalogue Epic 26). Best-effort : ne casse jamais le
      // rendu des rôles. Source unique alignée sur le gating de `rbac.create`.
      const [data, ent] = await Promise.all([
        trpc.rbac.list.query(),
        trpc.rbac.canUseCustomRoles.query().catch(() => ({ allowed: false })),
      ]);
      setRoles(data);
      setCustomRolesLocked(!ent.allowed);
      setPhase('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement.';
      if (/forbidden/i.test(message) || /permission/i.test(message)) {
        setPhase('forbidden');
      } else {
        setError(message);
        setPhase('error');
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const predefined = roles.filter((r) => r.isPredefined);
  const custom = roles.filter((r) => !r.isPredefined);

  return (
    <div>
      <SettingsPageHeader
        breadcrumbs={['Paramètres', 'Organisation', 'Rôles & permissions']}
        eyebrow="Organisation"
        title="Définissez qui peut faire quoi —"
        italic="précisément."
        subtitle="Quatre rôles couvrent la plupart des équipes. Au-delà, créez des rôles sur mesure pour aligner les accès sur vos métiers."
        actions={
          phase === 'ready' && !customRolesLocked ? (
            <Button
              type="button"
              size="sm"
              onClick={() =>
                void navigate({ to: '/settings/team/roles/$roleId', params: { roleId: 'new' } })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Créer un rôle
            </Button>
          ) : null
        }
      />

      {phase === 'loading' ? (
        <RolesPageSkeleton />
      ) : phase === 'forbidden' ? (
        <SectionCard>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Lock className="text-terre-400 h-8 w-8" />
            <p className="text-terre-900 font-medium">Accès réservé aux propriétaires</p>
            <p className="text-terre-600 max-w-md text-sm">
              La gestion des rôles est restreinte au rôle <strong>Propriétaire</strong> de
              l'organisation. Contactez votre propriétaire pour qu'il vous y donne accès.
            </p>
          </div>
        </SectionCard>
      ) : phase === 'error' ? (
        <p className="text-brique-700 text-sm">{error}</p>
      ) : (
        <div className="flex flex-col gap-5">
          <SectionCard
            title="Rôles prédéfinis"
            description="Ne peuvent pas être modifiés. Vous pouvez les attribuer librement à vos membres."
            padding={20}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {predefined.map((r, i) => (
                <RoleCard
                  key={r.id}
                  role={r}
                  index={i}
                  locked
                  onOpen={() =>
                    void navigate({
                      to: '/settings/team/roles/$roleId',
                      params: { roleId: r.id },
                    })
                  }
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Rôles personnalisés"
            description="Sur mesure pour vos métiers — comptable externe, chargé d'encaissement, freelance…"
            padding={20}
            action={
              !customRolesLocked ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void navigate({
                      to: '/settings/team/roles/$roleId',
                      params: { roleId: 'new' },
                    })
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Nouveau rôle
                </Button>
              ) : null
            }
          >
            {customRolesLocked ? (
              <UpsellCustomRoles />
            ) : custom.length === 0 ? (
              <CustomRolesEmptyState
                onCreate={() =>
                  void navigate({ to: '/settings/team/roles/$roleId', params: { roleId: 'new' } })
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {custom.map((r, i) => (
                  <RoleCard
                    key={r.id}
                    role={r}
                    index={i}
                    onOpen={() =>
                      void navigate({
                        to: '/settings/team/roles/$roleId',
                        params: { roleId: r.id },
                      })
                    }
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}

/* ─── RoleCard ──────────────────────────────────────────────────────────── */

function formatUpdated(value: string | Date | null): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RoleCard({
  role,
  index,
  locked,
  onOpen,
}: {
  role: RoleRow;
  index: number;
  locked?: boolean;
  onOpen: () => void;
}) {
  const { icon: Icon, tone } = roleVisual(role.name, role.isPredefined, index);
  const updated = formatUpdated(role.updatedAt);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="border-border bg-card hover:border-soleil-300 flex items-start gap-3 rounded-[14px] border p-4 text-left shadow-xs transition-colors"
    >
      <span
        className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] ${toneIconBox(tone)}`}
      >
        <Icon className="h-[17px] w-[17px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-terre-900 text-sm font-medium">{roleLabel(role.name)}</span>
          {locked ? (
            <span className="bg-terre-100 text-terre-600 rounded-pill px-1.5 py-px text-[10px] font-semibold tracking-[0.4px] uppercase">
              Prédéfini
            </span>
          ) : (
            <span className="bg-soleil-100 text-soleil-800 rounded-pill px-1.5 py-px text-[10px] font-semibold tracking-[0.4px] uppercase">
              Personnalisé
            </span>
          )}
        </div>
        {role.description ? (
          <p className="text-terre-600 mt-1 text-xs leading-[1.5]">{role.description}</p>
        ) : null}
        <div className="text-terre-500 mt-2.5 flex flex-wrap items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {role.memberCount} membre{role.memberCount > 1 ? 's' : ''}
          </span>
          {updated && !role.isPredefined ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Mis à jour {updated}
            </span>
          ) : null}
        </div>
      </div>
      {locked ? (
        <Lock className="text-terre-400 h-3.5 w-3.5 shrink-0" />
      ) : (
        <ChevronRight className="text-terre-400 h-3.5 w-3.5 shrink-0" />
      )}
    </button>
  );
}

/* ─── EmptyState rôles personnalisés (post-reset) ───────────────────────── */

function CustomRolesEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="bg-terre-100 text-terre-600 inline-flex h-12 w-12 items-center justify-center rounded-[14px]">
        <ShieldCheck className="h-6 w-6" />
      </span>
      <p className="text-terre-900 text-sm font-medium">Aucun rôle personnalisé</p>
      <p className="text-terre-600 max-w-md text-[13px] leading-[1.5]">
        Les rôles personnalisés ont été réinitialisés. Créez-en un pour définir des accès sur
        mesure, module par module.
      </p>
      <Button type="button" size="sm" className="mt-1" onClick={onCreate}>
        <Plus className="mr-1.5 h-4 w-4" />
        Créer un rôle
      </Button>
    </div>
  );
}

/* ─── UpsellCustomRoles ─────────────────────────────────────────────────── */

function UpsellCustomRoles() {
  const navigate = useNavigate();
  return (
    <div className="border-soleil-300 from-terre-100 to-soleil-50 flex items-start gap-3.5 rounded-[14px] border border-dashed bg-gradient-to-br p-4">
      <span className="bg-soleil-400 text-terre-900 inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px]">
        <Sparkles className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-terre-900 text-sm font-medium">Créer un rôle personnalisé</span>
          <span className="bg-soleil-100 text-soleil-800 rounded-pill px-1.5 py-px text-[10px] font-semibold tracking-[0.4px] uppercase">
            Pro
          </span>
        </div>
        <p className="text-terre-700 mt-1 max-w-[420px] text-xs leading-[1.5]">
          Définissez précisément qui peut voir, créer ou supprimer dans chaque module. Disponible à
          partir du plan Croissance.
        </p>
      </div>
      <Button
        type="button"
        variant="accent"
        size="sm"
        onClick={() => void navigate({ to: '/settings/team' })}
      >
        Passer au plan Pro
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────────────── */

function RolesPageSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Chargement des rôles">
      {[4, 2].map((n, s) => (
        <SectionCard
          key={s}
          title={s === 0 ? 'Rôles prédéfinis' : 'Rôles personnalisés'}
          padding={20}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: n }).map((_, i) => (
              <div
                key={i}
                className="border-border flex items-start gap-3 rounded-[14px] border p-4"
              >
                <Skeleton className="h-[38px] w-[38px] rounded-[10px]" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-2 h-3 w-3/4" />
                  <Skeleton className="mt-2.5 h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
