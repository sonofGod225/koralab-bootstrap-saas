/**
 * <Slider /> — Radix Slider adapté Terre & Soleil.
 *
 * Supporte la valeur simple et la plage (range) via un tableau de valeurs.
 * Style :
 * - Piste : bg-subtle, hauteur 4px, radius pill.
 * - Plage active : bg-primary.
 * - Pouce : card, border-primary, shadow-sm.
 * - Focus ring Soleil 400 @ 40%.
 */

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const thumbCount = Array.isArray(props.value)
    ? props.value.length
    : Array.isArray(props.defaultValue)
      ? props.defaultValue.length
      : 1;

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="bg-subtle relative h-1 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            'border-primary bg-card block h-[18px] w-[18px] rounded-full border-[1.5px] shadow-sm',
            'focus-visible:ring-soleil-400/40 focus-visible:ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
