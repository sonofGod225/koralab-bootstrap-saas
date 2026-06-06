/**
 * <Checkbox /> — Radix Checkbox adapté Terre & Soleil.
 *
 * Style :
 * - Boîte 18px, radius rounded-md (8px).
 * - Coché : bg-primary, icône Check Lucide primary-foreground.
 * - Non coché : border-border, fond transparent.
 * - Focus ring Soleil 400 @ 40%.
 */

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer border-border h-[18px] w-[18px] shrink-0 rounded-md border bg-transparent transition-colors',
      'focus-visible:ring-soleil-400/40 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
      'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="text-primary-foreground flex items-center justify-center">
      <Check className="h-3 w-3" strokeWidth={2.5} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
