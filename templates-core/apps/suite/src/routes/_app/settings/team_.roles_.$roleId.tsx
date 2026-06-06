/**
 * /settings/team/roles/$roleId — édition / création d'un rôle (Story 3.11).
 *
 * Refonte sur le bundle Claude Design `settings-roles.jsx` (vue `RoleEditDesktop`) :
 *  - `$roleId === 'new'` → création d'un rôle personnalisé (matrice vierge) ;
 *    `?from=<id>` préremplit la matrice depuis un rôle source (« Dupliquer ») ;
 *  - rôle prédéfini → matrice en **lecture seule** + action « Dupliquer » ;
 *  - rôle custom → carte Identité + `PermissionMatrix` éditable + sidebar
 *    « Membres affectés » + note d'héritage, enregistrement via `rbac.create` /
 *    `rbac.update` (la matrice est sérialisée par `matrixToRules`).
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Copy, Info, Save, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@__SCOPE__/ui/avatar';
import { Button } from '@__SCOPE__/ui/button';
import { Input } from '@__SCOPE__/ui/input';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { Skeleton } from '@__SCOPE__/ui/skeleton';
import { FormRow, SectionCard, SettingsPageHeader } from '../../../components/settings-page';
import {
  PermissionMatrix,
  countDefinedCells,
  emptyMatrix,
  matrixToRules,
  rulesToMatrix,
} from '../../../components/permission-matrix';
import type { Matrix } from '../../../components/permission-matrix';
import { roleLabel, roleVisual, toneIconBox } from '../../../lib/role-display';
import { trpc } from '../../../lib/trpc-client';

export const Route = createFileRoute('/_app/settings/team_/roles_/$roleId')({
  component: RoleEditorPage,
  validateSearch: (search: Record<string, unknown>): { from?: string } => ({
    from: typeof search.from === 'string' ? search.from : undefined,
  }),
});

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  isPredefined: boolean;
  memberCount: number;
  updatedAt: string | Date | null;
  rules: { effect: string; permission: string }[];
}

interface AssignedMember {
  id: string;
  name: string;
  email: string;
}

type Phase = 'loading' | 'ready' | 'forbidden' | 'error' | 'notfound';

function RoleEditorPage() {
  const { roleId } = Route.useParams();
  const { from } = Route.useSearch();
  const navigate = useNavigate();
  const isNew = roleId === 'new';

  const [phase, setPhase] = useState<Phase>('loading');
  const [role, setRole] = useState<RoleRow | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [matrix, setMatrix] = useState<Matrix>(emptyMatrix());
  const [lockedModules, setLockedModules] = useState<string[]>([]);
  const [members, setMembers] = useState<AssignedMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = (await trpc.rbac.list.query()) as RoleRow[];

      // Generic core: no plan entitlement — no modules are locked.
      setLockedModules([]);

      if (isNew) {
        setRole(null);
        setReadOnly(false);
        if (from) {
          const src = list.find((r) => r.id === from);
          if (src) {
            setDescription(src.description ?? '');
            setMatrix(rulesToMatrix(src.rules));
          }
        }
        setPhase('ready');
        return;
      }

      const found = list.find((r) => r.id === roleId);
      if (!found) {
        setPhase('notfound');
        return;
      }
      setRole(found);
      setReadOnly(found.isPredefined);
      setName(found.isPredefined ? roleLabel(found.name) : found.name);
      setDescription(found.description ?? '');
      setMatrix(rulesToMatrix(found.rules));

      const mem = await trpc.rbac.membersForRole
        .query({ roleName: found.name })
        .catch(() => [] as AssignedMember[]);
      setMembers(mem);
      setPhase('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement.';
      if (/forbidden/i.test(message) || /permission/i.test(message)) setPhase('forbidden');
      else {
        setError(message);
        setPhase('error');
      }
    }
  }, [isNew, from, roleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const definedCells = countDefinedCells(matrix);
  const canSave = !readOnly && name.trim().length >= 2 && definedCells > 0 && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const rules = matrixToRules(matrix);
      if (isNew || !role) {
        await trpc.rbac.create.mutate({
          name: name.trim(),
          description: description.trim() || undefined,
          rules,
        });
      } else {
        await trpc.rbac.update.mutate({
          roleId: role.id,
          name: name.trim(),
          description: description.trim() || undefined,
          rules,
        });
      }
      await navigate({ to: '/settings/team/roles' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!role || role.isPredefined) return;
    if (!confirm(`Supprimer définitivement le rôle « ${role.name} » ?`)) return;
    setRemoving(true);
    setError(null);
    try {
      await trpc.rbac.delete.mutate({ roleId: role.id });
      await navigate({ to: '/settings/team/roles' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.');
      setRemoving(false);
    }
  }

  function duplicate() {
    if (!role) return;
    void navigate({
      to: '/settings/team/roles/$roleId',
      params: { roleId: 'new' },
      search: { from: role.id },
    });
  }

  const title = isNew ? 'Nouveau rôle' : readOnly ? roleLabel(role?.name ?? '') : role?.name;
  const eyebrow = readOnly
    ? 'Rôle prédéfini · lecture seule'
    : isNew
      ? 'Nouveau rôle personnalisé'
      : 'Rôle personnalisé';

  return (
    <div>
      <SettingsPageHeader
        breadcrumbs={[
          'Paramètres',
          'Organisation',
          'Rôles & permissions',
          (title as string) || '…',
        ]}
        eyebrow={eyebrow}
        title={(title as string) || 'Rôle'}
        subtitle={
          readOnly
            ? 'Les rôles prédéfinis ne sont pas modifiables. Dupliquez-le pour en faire un rôle personnalisé.'
            : "Définissez les permissions ressource par ressource. Une règle « refuser » l'emporte toujours sur « autoriser »."
        }
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void navigate({ to: '/settings/team/roles' })}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Retour
            </Button>
            {readOnly ? (
              <Button type="button" variant="outline" size="sm" onClick={duplicate}>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Dupliquer
              </Button>
            ) : (
              <LoadingButton
                type="button"
                size="sm"
                loading={saving}
                disabled={!canSave}
                onClick={save}
              >
                <Save className="mr-1.5 h-4 w-4" />
                Enregistrer
              </LoadingButton>
            )}
          </>
        }
      />

      {phase === 'loading' ? (
        <EditorSkeleton />
      ) : phase === 'notfound' ? (
        <SectionCard>
          <p className="text-terre-600 py-6 text-center text-sm">
            Ce rôle est introuvable dans votre organisation.
          </p>
        </SectionCard>
      ) : phase === 'forbidden' ? (
        <SectionCard>
          <p className="text-terre-600 py-6 text-center text-sm">
            La gestion des rôles est réservée au <strong>Propriétaire</strong> de l'organisation.
          </p>
        </SectionCard>
      ) : phase === 'error' ? (
        <p className="text-brique-700 text-sm">{error}</p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]">
          {/* Colonne principale */}
          <div className="flex flex-col gap-5">
            {!readOnly ? (
              <SectionCard title="Identité" padding={20}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormRow label="Nom du rôle" required>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="comptable-interne"
                      maxLength={50}
                    />
                  </FormRow>
                  <FormRow label="Description" span={2}>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Suit les paiements, envoie les relances et accède aux clients en retard."
                      maxLength={280}
                    />
                  </FormRow>
                </div>
              </SectionCard>
            ) : null}

            <SectionCard
              title="Matrice de permissions"
              description={
                readOnly
                  ? `Vue lecture seule du rôle « ${roleLabel(role?.name ?? '')} » tel que défini par __PROJECT_NAME__.`
                  : 'Module × ressource × action. Cliquez une case pour cycler : autorisé → refusé → non défini.'
              }
              padding={20}
            >
              <PermissionMatrix
                value={matrix}
                readOnly={readOnly}
                onChange={setMatrix}
                onReset={() => setMatrix(emptyMatrix())}
                lockedModules={readOnly ? [] : lockedModules}
                onActivateModule={() => void navigate({ to: '/settings/team' })}
              />
              {!readOnly && definedCells === 0 ? (
                <p className="text-brique-700 mt-3 text-[12px]">
                  Définissez au moins une permission (cliquez sur une case) avant d'enregistrer.
                </p>
              ) : null}
            </SectionCard>

            {error ? <p className="text-brique-700 text-sm">{error}</p> : null}

            {!readOnly && role && !role.isPredefined ? (
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-brique-700 hover:text-brique-900"
                  onClick={() => void remove()}
                  disabled={removing}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Supprimer ce rôle
                </Button>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            <SectionCard title="Membres affectés" padding={18}>
              {members.length === 0 ? (
                <p className="text-terre-500 text-[12px]">
                  Aucun membre n'a ce rôle pour le moment.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {members.map((m, i) => {
                    const { tone } = roleVisual(role?.name ?? '', role?.isPredefined ?? false, i);
                    return (
                      <div key={m.id} className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs ${toneIconBox(tone)}`}>
                            {m.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-terre-900 truncate text-[13px] font-medium">
                            {m.name}
                          </div>
                          <div className="text-terre-500 truncate text-[11px]">{m.email}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard padding={18}>
              <div className="flex items-start gap-3">
                <Info className="text-terre-600 mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="text-terre-900 text-[13px] font-medium">Règle d'héritage</div>
                  <p className="text-terre-600 mt-1 text-[12px] leading-[1.5]">
                    Une cellule non définie hérite de la ligne{' '}
                    <strong>∗ toutes les sous-entités</strong>. Un membre peut cumuler plusieurs
                    rôles : <strong className="text-brique-600">refuser</strong> l'emporte partout
                    sur <strong className="text-palmeraie-600">autoriser</strong>.
                  </p>
                </div>
              </div>
            </SectionCard>
          </aside>
        </div>
      )}
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-5">
        <SectionCard title="Identité" padding={20}>
          <Skeleton className="h-9 w-full" />
        </SectionCard>
        <SectionCard title="Matrice de permissions" padding={20}>
          <Skeleton className="h-64 w-full rounded-[14px]" />
        </SectionCard>
      </div>
      <SectionCard title="Membres affectés" padding={18}>
        <Skeleton className="h-8 w-full" />
      </SectionCard>
    </div>
  );
}
