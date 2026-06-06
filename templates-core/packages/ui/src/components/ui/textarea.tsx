/**
 * <Textarea /> — shadcn/ui adapté Base & Brand.
 *
 * Miroir de <Input /> :
 * - radius 12px (rounded-[12px])
 * - border base-200, bg blanc (bg-card, comme Input), texte base-900
 * - placeholder base-400
 * - focus ring Brand 400 @ 25%
 * - resize vertical autorisé
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'border-border bg-card text-foreground placeholder:text-muted-foreground',
        'focus-visible:ring-brand-400/40 focus-visible:ring-offset-background',
        'flex min-h-[80px] w-full rounded-[12px] border px-3.5 py-2.5 text-sm',
        'resize-vertical leading-relaxed transition-shadow',
        'focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };
