/**
 * <Kbd /> — Touche clavier stylisée Terre & Soleil.
 *
 * Style :
 * - font-mono JetBrains Mono, text-xs
 * - bg-terre-50, text-terre-700
 * - border 1px terre-200, shadow bas terre-200 (effet relief)
 * - rounded-md (8px)
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

const Kbd = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        'border-border bg-muted text-foreground shadow-[0_1px_0_theme(colors.terre.200)] inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-xs font-medium',
        className,
      )}
      {...props}
    />
  ),
);
Kbd.displayName = 'Kbd';

export { Kbd };
