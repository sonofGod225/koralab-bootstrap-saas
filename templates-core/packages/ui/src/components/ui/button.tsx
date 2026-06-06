/**
 * <Button /> — shadcn/ui adapté Terre & Soleil.
 *
 * Variants : `default` (CTA principal) · `accent` (signature Soleil, ≤ 15%) ·
 * `secondary` (neutre Terre 100) · `outline` (surface élevée + filet) ·
 * `ghost` · `destructive` (Brique 600) · `link` (souligné Soleil 600).
 *
 * Tailles (spec design) : `sm` 32px/13px · `default` 40px/14px ·
 * `lg` 48px/15px · `icon` 40×40 · `icon-sm` 32×32.
 *
 * Forme : **pill (radius 100px)** — règle non-négociable __PROJECT_NAME__.
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soleil-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        accent: 'bg-accent text-accent-foreground hover:bg-soleil-500',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-card text-foreground hover:bg-muted',
        ghost: 'bg-transparent text-foreground hover:bg-muted',
        destructive: 'bg-brique-600 text-destructive-foreground hover:bg-brique-800',
        link: 'text-soleil-600 underline-offset-4 hover:underline bg-transparent',
      },
      // Tailles alignées sur la spec design (atoms.jsx Button) :
      // sm 32px/13px · md 40px/14px · lg 48px/15px.
      size: {
        sm: 'h-8 gap-1.5 px-4 text-sm [&_svg]:size-3.5',
        default: 'h-10 px-[22px] text-base',
        lg: 'h-12 px-7 text-md',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
