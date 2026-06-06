/**
 * <RadioGroup /> — Radix RadioGroup adapté Base & Brand.
 *
 * Style :
 * - Bouton radio 18px, cercle plein, fond card.
 * - Sélectionné : border-primary, point intérieur bg-primary.
 * - Non sélectionné : border-border.
 * - Focus ring Brand 400 @ 40%.
 */

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '../../lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-3', className)} {...props} />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'border-border bg-background aspect-square h-[18px] w-[18px] shrink-0 rounded-full border transition-colors',
      'focus-visible:ring-brand-400/40 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-primary',
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="bg-primary h-[9px] w-[9px] rounded-full" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
