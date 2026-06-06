/**
 * <Badge /> — shadcn/ui adapté Terre & Soleil.
 *
 * Variants sémantiques métier (cf. status invoices, paiements, etc.) :
 * - `paid`    → Palmeraie 100 bg + 700 text
 * - `pending` → Soleil 100 + 700
 * - `late`    → Brique 100 + 700
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
  'inline-flex items-center rounded-pill border border-transparent px-2.5 py-0.5 text-xs font-medium tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-soleil-400/40 focus:ring-offset-2 focus:ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-subtle text-foreground',
        destructive: 'bg-brique-600 text-destructive-foreground',
        outline: 'border-border bg-transparent text-foreground',
        paid: 'bg-palmeraie-50 text-palmeraie-800',
        pending: 'bg-soleil-50 text-soleil-700',
        late: 'bg-brique-50 text-brique-800',
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
