/**
 * <Input /> — shadcn/ui adapté Terre & Soleil.
 *
 * Style :
 * - radius 12px (input rule SKILL.md),
 * - border-border (proche 0.5px @ 0.06 opacity demandé AC),
 * - focus ring Soleil 400 @ 25%,
 * - background `bg-card` = blanc (`var(--surface)` du design) — l'input ne
 *   "trouve" jamais sa page : sur fond crème il ressort, sur fond blanc la
 *   bordure suffit. Cohérent avec les écrans Auth et Onboarding V2.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-soleil-400/40 focus-visible:ring-offset-background flex h-10 w-full rounded-[12px] border px-3.5 py-2 text-sm transition-shadow file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
