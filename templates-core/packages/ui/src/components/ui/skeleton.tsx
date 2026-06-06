/**
 * <Skeleton /> — Placeholder de chargement Terre & Soleil.
 *
 * Utilise `animate-pulse` de Tailwind sur fond terre-100.
 * S'adapte à n'importe quelle dimension via className.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('bg-subtle animate-pulse rounded-md', className)} {...props} />
  ),
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
