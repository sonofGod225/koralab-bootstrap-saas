/**
 * VisibilityBadge — pill de lecture de la visibilité hybride (ADR 0013 §1, design v3).
 *
 * Quasi-invisible pour une PME mono-établissement : org-wide se lit comme un globe
 * « Tous » discret (base) ; restreint affiche le nom de l'établissement en brand.
 */
import { Building2, Globe2 } from 'lucide-react';

export interface VisibilityBadgeProps {
  /** Nom court de l'établissement si restreint ; `null`/`undefined` = visible org-wide. */
  establishmentName?: string | null;
  size?: 'sm' | 'md';
}

export function VisibilityBadge({ establishmentName, size = 'md' }: VisibilityBadgeProps) {
  const orgWide = !establishmentName;
  const sm = size === 'sm';
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        orgWide ? 'bg-base-100 text-base-600' : 'bg-brand-50 text-brand-800',
      ].join(' ')}
    >
      {orgWide ? (
        <Globe2 className={sm ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      ) : (
        <Building2 className={sm ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      )}
      {orgWide ? 'Tous' : establishmentName}
    </span>
  );
}
