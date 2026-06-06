/**
 * <Switch /> — Radix Switch adapté Base & Brand.
 *
 * Style :
 * - Piste : bg-subtle (non coché) → bg-primary (coché).
 * - Pouce card avec ombre douce.
 * - Transition fluide 200ms cubic-bezier.
 * - Focus ring Brand 400 @ 40%.
 */

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../../lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center rounded-full border-transparent p-[2px] transition-colors duration-200',
      'focus-visible:ring-brand-400/40 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'bg-subtle data-[state=checked]:bg-primary',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'bg-card pointer-events-none block h-[18px] w-[18px] rounded-full shadow-sm transition-transform duration-200',
        'data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0',
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
