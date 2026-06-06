/**
 * <StatusDot /> — Pastille statut 8px.
 *
 * Mapping sémantique → couleur Terre & Soleil :
 * - paid    → Palmeraie 400 (success)
 * - pending → Soleil 400 (action requise, signature)
 * - overdue → Brique 400 (danger)
 * - draft   → Terre 400 (neutre tirant vers bas)
 * - success → Palmeraie 400
 * - warning → Mil 400
 * - error   → Brique 400
 * - neutral → Terre 300
 *
 * Toujours accompagné d'un label texte à côté (jamais le dot seul,
 * accessibilité — `aria-label` requis si pas de texte adjacent).
 */

import { cn } from '../lib/utils';

export type StatusKind =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'draft'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

export interface StatusDotProps {
  status: StatusKind;
  className?: string;
  /** Label accessible si le dot est utilisé seul (rare, à éviter). */
  'aria-label'?: string;
}

const statusColors: Record<StatusKind, string> = {
  paid: 'bg-palmeraie-400',
  pending: 'bg-soleil-400',
  overdue: 'bg-brique-400',
  draft: 'bg-terre-400',
  success: 'bg-palmeraie-400',
  warning: 'bg-mil-400',
  error: 'bg-brique-400',
  neutral: 'bg-terre-300',
};

export function StatusDot({ status, className, 'aria-label': ariaLabel }: StatusDotProps) {
  return (
    <span
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', statusColors[status], className)}
    />
  );
}
