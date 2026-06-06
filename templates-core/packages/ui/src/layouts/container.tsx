/**
 * <Container /> — Wrapper de largeur maximale __PROJECT_NAME__.
 *
 * CVA prop `size` :
 * - `sm`   : max-w-2xl  (672px)
 * - `md`   : max-w-4xl  (896px)
 * - `lg`   (défaut) : max-w-6xl  (1152px)
 * - `full` : max-w-none (largeur fluide)
 *
 * Toujours centré horizontalement (mx-auto) et pleine largeur (w-full)
 * avec padding horizontal adaptatif.
 *
 * Exports :
 * - `Container`
 * - `containerVariants` (CVA)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Variantes CVA
// ─────────────────────────────────────────────────────────────────────────────

const containerVariants = cva('mx-auto w-full px-4 sm:px-6 lg:px-8', {
  variants: {
    size: {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      full: 'max-w-none',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Container
// ─────────────────────────────────────────────────────────────────────────────

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, children, ...props }, ref) => (
    <div ref={ref} className={cn(containerVariants({ size }), className)} {...props}>
      {children}
    </div>
  ),
);
Container.displayName = 'Container';

export { Container, containerVariants };
