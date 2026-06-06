/**
 * <ToggleGroup /> — Radix ToggleGroup adapté Base & Brand.
 *
 * Style "segmented control" :
 * - Fond conteneur : bg-muted, radius rounded-xl, padding p-1.
 * - Item actif : bg-card, shadow-xs.
 * - Item inactif : transparent, text-muted-foreground.
 * - Focus ring Brand 400 @ 40%.
 */

import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { toggleVariants } from './toggle';

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  size: 'md',
  variant: 'default',
});

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn('bg-muted inline-flex items-center gap-0.5 rounded-xl p-1', className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150',
        'text-muted-foreground hover:text-foreground',
        'data-[state=on]:text-foreground data-[state=on]:bg-card data-[state=on]:shadow-xs',
        'focus-visible:ring-brand-400/40 focus-visible:ring-offset-muted focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:size-3.5 [&_svg]:shrink-0',
        toggleVariants({ variant: variant || context.variant, size: size || context.size }),
        // Override the base toggle background/color with segmented-specific rules
        'data-[state=on]:bg-card bg-transparent',
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
