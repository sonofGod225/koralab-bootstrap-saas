/**
 * Overlays & atomes « pixel-perfect » — bundle Claude Design « __PROJECT_NAME__ Établissements »
 * (`docs/ui-designs/epic-identity/project/settings-shell.jsx` + `settings-establishments*.jsx`).
 *
 * `@__SCOPE__/ui` couvre déjà Button/Badge/SectionCard/SettingsPageHeader au pixel, mais
 * son `Dialog`/`Drawer` divergent du design (radius 24, close absolu, pas de puce-icône,
 * bottom-sheet). On reconstruit donc deux shells fidèles sur les primitives Radix :
 *  - [[CenterDialog]] : modale centrée (création/édition + confirmations), puce-icône tonale,
 *    titre Fraunces 500/20, close-chip base-50 dans l'en-tête, footer bordé.
 *  - [[SidePanel]] : panneau ancré à droite (460px) pour « Affecter » / « Inviter ».
 * + atomes partagés (établissements & équipe) : ToneIconChip, InlineNotice, PrincipalBadge,
 *   RoleBadge, MemberAvatar.
 */
import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/* ─── Tons partagés ───────────────────────────────────────────────────────── */

export type Tone = 'brand' | 'success' | 'danger' | 'base';

const ICON_CHIP_TONE: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
  base: 'bg-base-100 text-base-700',
};

/** Puce-icône 42×42 r12 colorée par ton — en-tête des CenterDialog. */
export function ToneIconChip({ tone = 'brand', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] ${ICON_CHIP_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

/** Bouton « close » 32×32 r8 base-50 (en-tête dialog/panel). */
function CloseChip() {
  return (
    <Dialog.Close
      aria-label="Fermer"
      className="bg-base-50 text-base-700 hover:bg-base-100 focus-visible:ring-brand-400/40 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] transition-colors focus:outline-none focus-visible:ring-2"
    >
      <X className="h-3.5 w-3.5" />
    </Dialog.Close>
  );
}

/* ─── CenterDialog ────────────────────────────────────────────────────────── */

export interface CenterDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Largeur px (design : form 540, confirm 480, défaut 520). */
  width?: number;
  icon?: ReactNode;
  iconTone?: Tone;
  title: ReactNode;
  description?: ReactNode;
  /** Boutons du footer (footer masqué si absent). */
  footer?: ReactNode;
  children?: ReactNode;
}

export function CenterDialog({
  open,
  onOpenChange,
  width = 520,
  icon,
  iconTone = 'brand',
  title,
  description,
  footer,
  children,
}: CenterDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-base-950/45 fixed inset-0 z-50 backdrop-blur-[2px]" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          style={{ width, maxWidth: '90vw' }}
          className="bg-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 border-base-900/12 fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] border shadow-[0_24px_64px_rgba(42,26,15,0.28)] duration-200"
        >
          <div className="flex items-start gap-3.5 px-6 pt-[22px] pb-2">
            {icon ? <ToneIconChip tone={iconTone}>{icon}</ToneIconChip> : null}
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-display text-base-900 m-0 text-[20px] font-medium tracking-[-0.4px]">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="text-base-600 mt-1.5 text-[13px] leading-[1.5]">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <CloseChip />
          </div>
          {children ? (
            <div className="flex-1 overflow-y-auto px-6 py-[18px]">{children}</div>
          ) : null}
          {footer ? (
            <div className="border-border flex justify-end gap-2 border-t px-6 pt-3.5 pb-5">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ─── SidePanel (drawer ancré à droite) ───────────────────────────────────── */

export interface SidePanelProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eyebrow?: ReactNode;
  title: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export function SidePanel({
  open,
  onOpenChange,
  eyebrow,
  title,
  footer,
  children,
}: SidePanelProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-base-950/35 fixed inset-0 z-50 backdrop-blur-[2px]" />
        <Dialog.Content className="bg-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right border-base-900/12 fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[100vw] flex-col border-l shadow-[-12px_0_32px_rgba(42,26,15,0.18)] duration-300 sm:w-[460px]">
          <div className="border-border border-b px-[22px] pt-[18px] pb-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {eyebrow ? (
                  <div className="text-base-500 mb-1.5 text-[10px] font-semibold tracking-[1.4px] uppercase">
                    {eyebrow}
                  </div>
                ) : null}
                <Dialog.Title className="font-display text-base-900 m-0 text-[18px] font-medium tracking-[-0.3px]">
                  {title}
                </Dialog.Title>
              </div>
              <CloseChip />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-[22px] py-[18px]">{children}</div>
          {footer ? (
            <div className="border-border flex justify-end gap-2 border-t px-[22px] py-3.5">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ─── InlineNotice (bandeaux en-tête de dialog) ───────────────────────────── */

const NOTICE_TONE: Record<Tone, { box: string; icon: string; text: string }> = {
  brand: {
    box: 'bg-brand-50 border-brand-200',
    icon: 'text-brand-700',
    text: 'text-base-900',
  },
  success: {
    box: 'bg-success-50 border-success-200',
    icon: 'text-success-600',
    text: 'text-success-800',
  },
  danger: {
    box: 'bg-danger-50 border-danger-200',
    icon: 'text-danger-600',
    text: 'text-danger-800',
  },
  base: { box: 'bg-base-50 border-border', icon: 'text-base-500', text: 'text-base-700' },
};

/** Bandeau d'information dans un dialog (premier établissement, succès, erreur…). */
export function InlineNotice({
  tone = 'success',
  icon,
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const t = NOTICE_TONE[tone];
  return (
    <div className={`flex gap-2.5 rounded-xl border px-3.5 py-3 ${t.box}`}>
      {icon ? <span className={`mt-0.5 shrink-0 ${t.icon}`}>{icon}</span> : null}
      <div className={`text-[12.5px] leading-[1.5] ${t.text}`}>{children}</div>
    </div>
  );
}

/* ─── Badges & avatars partagés ───────────────────────────────────────────── */

/** Badge « Principal » — success + pastille (le `dot` n'existe pas sur Badge). */
export function PrincipalBadge() {
  return (
    <span className="bg-success-50 text-success-800 rounded-pill inline-flex items-center gap-1.5 px-2.5 py-[3px] text-[11px] font-medium">
      <span className="bg-success-600 h-1.5 w-1.5 rounded-full" />
      Principal
    </span>
  );
}

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  member: 'Membre',
  guest: 'Invité',
};

const ROLE_BADGE_TONE: Record<string, string> = {
  owner: 'bg-brand-50 text-brand-800',
  admin: 'bg-base-100 text-base-700',
};

/** Badge de rôle org — couleurs exactes du design. */
export function RoleBadge({ role }: { role: string }) {
  const label = ROLE_LABELS[role] ?? role;
  const tone = ROLE_BADGE_TONE[role] ?? 'border border-border text-base-700';
  return (
    <span
      className={`rounded-pill inline-flex items-center px-2.5 py-[3px] text-[11px] font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

export type AvatarTone = 'brand' | 'warning' | 'success' | 'base' | 'danger';

const AVATAR_TONE: Record<AvatarTone, string> = {
  brand: 'bg-brand-100 text-base-900',
  warning: 'bg-warning-50 text-warning-600',
  success: 'bg-success-50 text-success-800',
  base: 'bg-base-200 text-base-800',
  danger: 'bg-danger-50 text-danger-800',
};

/** Ton d'avatar dérivé du rôle (owner=brand, admin=warning) sinon cyclé par index. */
export function avatarTone(role: string, index = 0): AvatarTone {
  if (role === 'owner') return 'brand';
  if (role === 'admin') return 'warning';
  const cycle: AvatarTone[] = ['success', 'base', 'danger'];
  return cycle[index % 3] ?? 'success';
}

/** Avatar initiale teinté par ton (membres affectés / drawers). */
export function MemberAvatar({
  name,
  role,
  index = 0,
  size = 38,
}: {
  name: string;
  role: string;
  index?: number;
  size?: number;
}) {
  return (
    <span
      className={`font-display inline-flex shrink-0 items-center justify-center rounded-full font-medium ${AVATAR_TONE[avatarTone(role, index)]}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        letterSpacing: '-0.5px',
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
