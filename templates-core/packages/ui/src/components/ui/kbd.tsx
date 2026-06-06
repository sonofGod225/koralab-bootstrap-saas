/**
 * <Kbd /> — Touche clavier stylisée Base & Brand.
 *
 * Style :
 * - font-mono JetBrains Mono, text-xs
 * - bg-base-50, text-base-700
 * - border 1px base-200, shadow bas base-200 (effet relief)
 * - rounded-md (8px)
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

const Kbd = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        'border-border bg-muted text-foreground shadow-[0_1px_0_theme(colors.base.200)] inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-xs font-medium',
        className,
      )}
      {...props}
    />
  ),
);
Kbd.displayName = 'Kbd';

export { Kbd };
