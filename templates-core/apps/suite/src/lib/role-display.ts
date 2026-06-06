/**
 * Présentation des rôles (label FR + icône + ton) — partagé par la liste
 * `team.roles.tsx` et la page d'édition `team.roles.$roleId.tsx`.
 *
 * Aligné sur le bundle Claude Design `settings-roles.jsx` (icône + tone par
 * rôle prédéfini ; les rôles custom reçoivent un ton dérivé de leur index).
 */
import { BookOpen, Coins, Eye, Shield, ShieldCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type RoleTone = 'soleil' | 'palmeraie' | 'terre' | 'mil';

/** Libellé FR des rôles prédéfinis (les rôles custom gardent leur nom). */
export function roleLabel(name: string): string {
  switch (name) {
    case 'owner':
      return 'Propriétaire';
    case 'admin':
      return 'Administrateur';
    case 'member':
      return 'Membre';
    case 'guest':
      return 'Invité';
    default:
      return name;
  }
}

/** Classes Tailwind du carré d'icône selon le ton. */
export function toneIconBox(tone: RoleTone): string {
  switch (tone) {
    case 'soleil':
      return 'bg-soleil-100 text-soleil-700';
    case 'palmeraie':
      return 'bg-palmeraie-50 text-palmeraie-600';
    case 'mil':
      return 'bg-mil-100 text-mil-700';
    default:
      return 'bg-terre-100 text-terre-700';
  }
}

const PREDEFINED_VISUAL: Record<string, { icon: LucideIcon; tone: RoleTone }> = {
  owner: { icon: Shield, tone: 'soleil' },
  admin: { icon: ShieldCheck, tone: 'palmeraie' },
  member: { icon: Users, tone: 'terre' },
  guest: { icon: Eye, tone: 'mil' },
};

const CUSTOM_ICONS: LucideIcon[] = [Coins, BookOpen, Users, ShieldCheck];
const CUSTOM_TONES: RoleTone[] = ['soleil', 'palmeraie', 'terre', 'mil'];

/** Icône + ton d'un rôle (prédéfini : mappé par nom ; custom : par index). */
export function roleVisual(
  name: string,
  isPredefined: boolean,
  index = 0,
): { icon: LucideIcon; tone: RoleTone } {
  const predefined = PREDEFINED_VISUAL[name];
  if (isPredefined && predefined) return predefined;
  return {
    icon: CUSTOM_ICONS[index % CUSTOM_ICONS.length] ?? Users,
    tone: CUSTOM_TONES[index % CUSTOM_TONES.length] ?? 'terre',
  };
}
