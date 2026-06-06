/**
 * <Badge /> — shadcn/ui adapté Base & Brand.
 *
 * Variants sémantiques métier (cf. status invoices, paiements, etc.) :
 * - `paid`    → Success 100 bg + 700 text
 * - `pending` → Brand 100 + 700
 * - `late`    → Danger 100 + 700
 * - `draft`   → bg-muted + text-muted-foreground
 * - `neutral` → bg-subtle + text-muted-foreground
 *
 * Plus les variants génériques `default`, `secondary`, `destructive`, `outline`.
 *
 * Forme : pill (radius 100px), tracking tight, sentence case.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-pill border border-transparent px-2.5 py-0.5 text-xs font-medium tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:ring-offset-2 focus:ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-subtle text-foreground',
        destructive: 'bg-danger-600 text-destructive-foreground',
        outline: 'border-border bg-transparent text-foreground',
        paid: 'bg-success-50 text-success-800',
        pending: 'bg-brand-50 text-brand-700',
        late: 'bg-danger-50 text-danger-800',
        draft: 'bg-muted text-muted-foreground',
        neutral: 'bg-subtle text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
