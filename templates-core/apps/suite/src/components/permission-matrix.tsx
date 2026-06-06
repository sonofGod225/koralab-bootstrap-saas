/**
 * PermissionMatrix — matrice de permissions **module × resource × action** (ADR 0011).
 *
 * Réécriture sur le design Claude `roles-matrix.jsx` (`PermissionMatrix3D`).
 * Pilotée par le **registre `@__SCOPE__/rbac`** (source de vérité unique) — fini
 * le catalogue hardcodé et le drift de namespace : une cellule produit la
 * permission `module:resource:action` exactement attendue par le gate backend.
 *
 * Structure : chaque MODULE est un accordéon ; une ligne wildcard
 * « ∗ toutes les sous-entités » au-dessus d'une ligne par RESOURCE ; les ACTIONS
 * sont des colonnes (le jeu d'actions varie par module — billing `read/manage`,
 * audit `read`). Cellule tri-state allow/deny/unset ; une cellule resource non
 * définie **hérite** (ghosted) de la ligne `∗` ; `deny` l'emporte sur `allow`.
 *
 * Le `Matrix` est indexé `[moduleId][rowId][action]` où `rowId` = `'*'` (wildcard)
 * ou un `resourceId`. Sérialisation : seules les cellules explicites émettent une
 * règle ; les cellules héritées s'appuient sur la règle wildcard au runtime.
 */
import { useState } from 'react';
import {
  Ban,
  Check,
  ChevronDown,
  Coins,
  CreditCard,
  Eye,
  FileText,
  History,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ACTION_META, PERMISSION_REGISTRY, matchesPermission } from '@__SCOPE__/rbac';
import type { Action } from '@__SCOPE__/rbac';
import { Button } from '@__SCOPE__/ui/button';

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type CellValue = 'allow' | 'deny' | null;
export type Effect = 'allow' | 'deny';
export interface Rule {
  effect: Effect;
  permission: string;
}
/** Matrice indexée `[moduleId][rowId('*'|resourceId)][action]`. */
export type Matrix = Record<string, Record<string, Record<string, CellValue>>>;

/* ─── Mappings icônes (registre → lucide) ────────────────────────────────── */

const MODULE_ICONS: Record<string, LucideIcon> = {
  crm: Users,
  invoicing: FileText,
  payments: Coins,
  identity: ShieldCheck,
  billing: CreditCard,
  audit: History,
};
const ACTION_ICONS: Record<Action, LucideIcon> = {
  read: Eye,
  create: Plus,
  update: Pencil,
  delete: Trash2,
  manage: Settings,
};
const WILDCARD = '*';

/* ─── Helpers règles ↔ matrice ──────────────────────────────────────────── */

/** Permission concrète d'une cellule (module, row, action). */
function cellPermission(moduleId: string, rowId: string, action: Action): string {
  return `${moduleId}:${rowId}:${action}`;
}

/** Ids de lignes d'un module : wildcard `*` puis une ligne par resource. */
function rowIdsOf(mod: (typeof PERMISSION_REGISTRY)[number]): string[] {
  return [WILDCARD, ...mod.resources.map((r) => r.id)];
}

/**
 * Construit une matrice en évaluant chaque cellule via `cell(module, row, action)`.
 * Style fonctionnel (pas d'assignation indexée) — sûr sous `noUncheckedIndexedAccess`.
 */
function buildMatrix(cell: (moduleId: string, rowId: string, action: Action) => CellValue): Matrix {
  return Object.fromEntries(
    PERMISSION_REGISTRY.map((mod) => [
      mod.module,
      Object.fromEntries(
        rowIdsOf(mod).map((rowId) => [
          rowId,
          Object.fromEntries(mod.actions.map((a) => [a, cell(mod.module, rowId, a)])),
        ]),
      ),
    ]),
  );
}

/** Matrice vide dérivée du registre (toutes cellules `null`). */
export function emptyMatrix(): Matrix {
  return buildMatrix(() => null);
}

/**
 * Dérive la matrice d'affichage depuis les règles d'un rôle. Pour chaque cellule
 * (module, row, action) : `deny` gagne → `'deny'` ; sinon `allow` → `'allow'` ;
 * sinon `null`. Gère les jokers (`*`, `*:*:read`, `billing:*`…).
 */
export function rulesToMatrix(
  rules: ReadonlyArray<{ effect: string; permission: string }>,
): Matrix {
  return buildMatrix((moduleId, rowId, action) => {
    const perm = cellPermission(moduleId, rowId, action);
    const denied = rules.some((r) => r.effect === 'deny' && matchesPermission(r.permission, perm));
    const allowed = rules.some(
      (r) => r.effect === 'allow' && matchesPermission(r.permission, perm),
    );
    return denied ? 'deny' : allowed ? 'allow' : null;
  });
}

/** Sérialise la matrice en règles explicites (une par cellule définie). */
export function matrixToRules(matrix: Matrix): Rule[] {
  const rules: Rule[] = [];
  for (const mod of PERMISSION_REGISTRY) {
    const rowIds = [WILDCARD, ...mod.resources.map((r) => r.id)];
    for (const rowId of rowIds) {
      for (const a of mod.actions) {
        const value = matrix[mod.module]?.[rowId]?.[a] ?? null;
        if (value === 'allow' || value === 'deny') {
          rules.push({ effect: value, permission: cellPermission(mod.module, rowId, a) });
        }
      }
    }
  }
  return rules;
}

/** Nombre de cellules définies (allow ou deny) — garde-fou « ≥1 règle ». */
export function countDefinedCells(matrix: Matrix): number {
  return matrixToRules(matrix).length;
}

/** Résout l'affichage d'une cellule resource : sa valeur, ou la wildcard héritée. */
function resolveCell(
  moduleRows: Record<string, Record<string, CellValue>>,
  rowId: string,
  action: Action,
): { value: CellValue; inherited: boolean } {
  const own = moduleRows[rowId]?.[action] ?? null;
  if (own) return { value: own, inherited: false };
  if (rowId !== WILDCARD) {
    const wild = moduleRows[WILDCARD]?.[action] ?? null;
    if (wild) return { value: wild, inherited: true };
  }
  return { value: null, inherited: false };
}

/* ─── Cellule tri-state ─────────────────────────────────────────────────── */

const CELL_CLS: Record<'allow' | 'deny' | 'unset', string> = {
  allow: 'border-palmeraie-200 bg-palmeraie-50 text-palmeraie-600',
  deny: 'border-brique-200 bg-brique-50 text-brique-600',
  unset: 'border-border bg-card text-terre-300',
};

function PermissionCell({
  value,
  inherited,
  onChange,
  readOnly,
  ariaLabel,
}: {
  value: CellValue;
  inherited: boolean;
  onChange?: (v: CellValue) => void;
  readOnly?: boolean;
  ariaLabel: string;
}) {
  const cycle = () => {
    if (readOnly || !onChange) return;
    onChange(value === 'allow' ? 'deny' : value === 'deny' ? null : 'allow');
  };
  const stateWord = value === 'allow' ? 'autorisé' : value === 'deny' ? 'refusé' : 'non défini';
  const cls = CELL_CLS[value ?? 'unset'];
  const Ico = value === 'allow' ? Check : value === 'deny' ? Ban : null;
  return (
    <button
      type="button"
      onClick={cycle}
      disabled={readOnly}
      role="checkbox"
      aria-checked={value === 'allow' ? 'true' : value === 'deny' ? 'mixed' : 'false'}
      aria-label={`${ariaLabel} — ${stateWord}${inherited ? ' (hérité)' : ''}`}
      title={inherited ? `Hérité de « toutes les sous-entités » — ${stateWord}` : stateWord}
      className={[
        'focus-visible:ring-soleil-400 inline-flex h-9 w-full items-center justify-center rounded-lg border transition-all duration-150 focus-visible:ring-2 focus-visible:outline-none',
        inherited ? 'border-transparent bg-transparent opacity-40' : cls,
        readOnly ? 'cursor-default' : 'cursor-pointer hover:brightness-[0.98]',
      ].join(' ')}
    >
      {Ico ? (
        inherited ? (
          <span className="inline-flex rounded-md border border-dashed border-current p-0.5">
            <Ico className="h-3 w-3" strokeWidth={2} />
          </span>
        ) : (
          <Ico className="h-[15px] w-[15px]" strokeWidth={2} />
        )
      ) : null}
    </button>
  );
}

/* ─── En-tête de colonnes (par module — jeu d'actions variable) ──────────── */

function gridCols(actionsCount: number): string {
  return `minmax(150px,1.4fr) repeat(${actionsCount}, minmax(64px,1fr))`;
}

function ActionHeader({ actions }: { actions: readonly Action[] }) {
  return (
    <div className="grid gap-2 px-1 pb-2" style={{ gridTemplateColumns: gridCols(actions.length) }}>
      <span className="text-terre-500 self-center text-[10px] font-semibold tracking-[1.2px] uppercase">
        Ressource
      </span>
      {actions.map((a) => {
        const Ico = ACTION_ICONS[a];
        return (
          <span
            key={a}
            className="text-terre-500 inline-flex items-center justify-center gap-1 text-[10px] font-semibold tracking-[0.8px] uppercase"
          >
            <Ico className="h-2.5 w-2.5" />
            <span className="hidden sm:inline">{ACTION_META[a].label}</span>
          </span>
        );
      })}
    </div>
  );
}

/* ─── Une ligne (wildcard ou resource) ──────────────────────────────────── */

function MatrixRow({
  moduleLabel,
  rowLabel,
  actions,
  cells,
  onCell,
  readOnly,
  wildcard,
}: {
  moduleLabel: string;
  rowLabel: string;
  actions: readonly Action[];
  cells: Record<string, { value: CellValue; inherited: boolean }>;
  onCell?: (a: Action, v: CellValue) => void;
  readOnly?: boolean;
  wildcard?: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-2 rounded-lg px-1 py-1 ${wildcard ? 'bg-terre-50' : ''}`}
      style={{ gridTemplateColumns: gridCols(actions.length) }}
    >
      <div className={`flex min-w-0 items-center gap-2 ${wildcard ? 'pl-1' : 'pl-3'}`}>
        {wildcard ? (
          <span className="text-soleil-600 w-4 flex-shrink-0 text-center font-mono text-sm font-semibold">
            ∗
          </span>
        ) : (
          <span className="bg-terre-300 h-1 w-1 flex-shrink-0 rounded-full" />
        )}
        <span
          className={`truncate text-[13px] ${wildcard ? 'text-terre-800 font-medium' : 'text-terre-700'}`}
        >
          {wildcard ? 'Toutes les sous-entités' : rowLabel}
        </span>
      </div>
      {actions.map((a) => {
        const c = cells[a] ?? { value: null, inherited: false };
        return (
          <PermissionCell
            key={a}
            value={c.value}
            inherited={c.inherited}
            readOnly={readOnly}
            onChange={onCell ? (v) => onCell(a, v) : undefined}
            ariaLabel={`${moduleLabel} · ${wildcard ? 'toutes les sous-entités' : rowLabel} · ${ACTION_META[a].label}`}
          />
        );
      })}
    </div>
  );
}

/* ─── Accordéon module ──────────────────────────────────────────────────── */

function ModuleSection({
  moduleId,
  rows,
  setCell,
  readOnly,
  locked,
  defaultOpen,
  onActivateModule,
}: {
  moduleId: string;
  rows: Record<string, Record<string, CellValue>>;
  setCell: (moduleId: string, rowId: string, action: Action, v: CellValue) => void;
  readOnly?: boolean;
  locked?: boolean;
  defaultOpen?: boolean;
  onActivateModule?: (moduleId: string) => void;
}) {
  const mod = PERMISSION_REGISTRY.find((m) => m.module === moduleId);
  const [open, setOpen] = useState(!!defaultOpen && !locked);
  if (!mod) return null;
  const Ico = MODULE_ICONS[mod.module] ?? Settings;

  const defined = Object.values(rows).reduce(
    (n, row) => n + Object.values(row).filter(Boolean).length,
    0,
  );
  const denies = Object.values(rows).reduce(
    (n, row) => n + Object.values(row).filter((v) => v === 'deny').length,
    0,
  );

  return (
    <div
      className={`overflow-hidden rounded-[14px] border ${
        locked ? 'border-border bg-terre-25' : 'border-border bg-card shadow-xs'
      }`}
    >
      <button
        type="button"
        onClick={() => !locked && setOpen((o) => !o)}
        aria-expanded={open}
        disabled={locked}
        className="focus-visible:ring-soleil-400 flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <span
          className={`bg-terre-100 inline-flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg ${
            locked ? 'text-terre-400' : 'text-terre-700'
          }`}
        >
          <Ico className="h-[17px] w-[17px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${locked ? 'text-terre-500' : 'text-terre-900'}`}>
              {mod.label}
            </span>
            {locked && <Lock className="text-terre-400 h-3.5 w-3.5" />}
            {!locked && denies > 0 && (
              <span className="text-brique-600 bg-brique-50 rounded-full px-1.5 py-px text-[10px] font-semibold">
                {denies} refus
              </span>
            )}
          </div>
          <div className="text-terre-500 mt-0.5 text-[11.5px]">
            {locked
              ? 'Module non souscrit'
              : `${mod.resources.length} ressources · ${mod.actions.length} actions · ${defined} permission${defined > 1 ? 's' : ''} définie${defined > 1 ? 's' : ''}`}
          </div>
        </div>
        {!locked && (
          <ChevronDown
            className={`text-terre-400 h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {locked && (
        <div className="border-soleil-300 bg-soleil-50 mx-4 mb-4 flex items-center gap-3 rounded-xl border border-dashed px-4 py-3.5">
          <Sparkles className="text-soleil-600 h-4 w-4 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-terre-900 text-[13px] font-medium">
              Activez ce module pour gérer ses permissions
            </div>
            <div className="text-terre-600 mt-0.5 text-[11.5px]">
              {mod.label} n'est pas inclus dans votre abonnement actuel.
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onActivateModule?.(mod.module)}
          >
            Activer le module
          </Button>
        </div>
      )}

      {!locked && open && (
        <div className="border-border border-t px-3.5 pt-3 pb-4">
          <ActionHeader actions={mod.actions} />
          <div className="flex flex-col gap-0.5">
            <MatrixRow
              wildcard
              moduleLabel={mod.label}
              rowLabel=""
              actions={mod.actions}
              readOnly={readOnly}
              cells={Object.fromEntries(
                mod.actions.map((a) => [
                  a,
                  { value: rows[WILDCARD]?.[a] ?? null, inherited: false },
                ]),
              )}
              onCell={(a, v) => setCell(mod.module, WILDCARD, a, v)}
            />
            {mod.resources.map((r) => (
              <MatrixRow
                key={r.id}
                moduleLabel={mod.label}
                rowLabel={r.label}
                actions={mod.actions}
                readOnly={readOnly}
                cells={Object.fromEntries(mod.actions.map((a) => [a, resolveCell(rows, r.id, a)]))}
                onCell={(a, v) => setCell(mod.module, r.id, a, v)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Légende ───────────────────────────────────────────────────────────── */

function LegendItem({ tone, label }: { tone: 'allow' | 'deny' | 'unset'; label: string }) {
  const Ico = tone === 'allow' ? Check : tone === 'deny' ? Ban : null;
  return (
    <span className="text-terre-600 inline-flex items-center gap-1.5 text-[12px]">
      <span
        className={`inline-flex h-[22px] w-[22px] items-center justify-center rounded-md border ${CELL_CLS[tone]}`}
      >
        {Ico ? <Ico className="h-3 w-3" strokeWidth={2} /> : null}
      </span>
      {label}
    </span>
  );
}

/* ─── Matrice ───────────────────────────────────────────────────────────── */

export function PermissionMatrix({
  value,
  onChange,
  readOnly,
  onReset,
  lockedModules = [],
  onActivateModule,
}: {
  value: Matrix;
  onChange?: (next: Matrix) => void;
  readOnly?: boolean;
  onReset?: () => void;
  /** Modules non souscrits (entitlement) — affichés verrouillés + upsell. */
  lockedModules?: readonly string[];
  onActivateModule?: (moduleId: string) => void;
}) {
  const setCell = (moduleId: string, rowId: string, action: Action, v: CellValue) => {
    if (readOnly || !onChange) return;
    onChange({
      ...value,
      [moduleId]: {
        ...value[moduleId],
        [rowId]: { ...value[moduleId]?.[rowId], [action]: v },
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {PERMISSION_REGISTRY.map((mod, i) => (
        <ModuleSection
          key={mod.module}
          moduleId={mod.module}
          rows={value[mod.module] ?? {}}
          setCell={setCell}
          readOnly={readOnly}
          locked={!readOnly && lockedModules.includes(mod.module)}
          defaultOpen={i < 2}
          onActivateModule={onActivateModule}
        />
      ))}

      <div className="bg-terre-25 border-border flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3.5">
        <LegendItem tone="allow" label="Autorisé" />
        <LegendItem tone="deny" label="Refusé" />
        <LegendItem tone="unset" label="Non défini" />
        <span className="text-terre-600 inline-flex items-center gap-1.5 text-[12px]">
          <span className="text-palmeraie-600 inline-flex h-[22px] w-[22px] items-center justify-center rounded-md opacity-50">
            <span className="border-palmeraie-200 inline-flex rounded-md border border-dashed p-0.5">
              <Check className="h-2.5 w-2.5" strokeWidth={2} />
            </span>
          </span>
          Hérité de ∗
        </span>
        <div className="flex-1" />
        {!readOnly && onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="text-soleil-600 hover:text-soleil-700 inline-flex items-center gap-1.5 text-[12px]"
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser
          </button>
        ) : null}
      </div>
    </div>
  );
}
