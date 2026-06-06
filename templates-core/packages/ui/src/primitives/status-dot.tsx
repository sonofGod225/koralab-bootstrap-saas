/**
 * <StatusDot /> — Pastille statut 8px.
 *
 * Mapping sémantique → couleur Base & Brand :
 * - paid    → Success 400 (success)
 * - pending → Brand 400 (action requise, signature)
 * - overdue → Danger 400 (danger)
 * - draft   → Base 400 (neutre tirant vers bas)
 * - success → Success 400
 * - warning → Warning 400
 * - error   → Danger 400
 * - neutral → Base 300
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
  paid: 'bg-success-400',
  pending: 'bg-brand-400',
  overdue: 'bg-danger-400',
  draft: 'bg-base-400',
  success: 'bg-success-400',
  warning: 'bg-warning-400',
  error: 'bg-danger-400',
  neutral: 'bg-base-300',
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
