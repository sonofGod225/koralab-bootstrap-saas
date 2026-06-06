/**
 * <Avatar /> — Radix Avatar adapté Terre & Soleil.
 *
 * Composants :
 * - `Avatar`        : conteneur circulaire Radix.
 * - `AvatarImage`   : image avec fallback automatique.
 * - `AvatarFallback`: initiales, fond soleil-100 texte terre-900, font-display.
 * - `AvatarGroup`   : rangée d'avatars en chevauchement avec bague blanche.
 *
 * Taille par défaut 40px via className (w-10 h-10).
 */

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../../lib/utils';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'bg-soleil-100 text-foreground font-display flex h-full w-full items-center justify-center rounded-full text-sm font-medium tracking-tight',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// ─── AvatarGroup ─────────────────────────────────────────────────────────

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nombre maximum d'avatars affichés avant le compteur "+n". */
  max?: number;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max = 4, ...props }, ref) => {
    const items = React.Children.toArray(children);
    const visible = items.slice(0, max);
    const overflow = items.length - max;

    return (
      <div ref={ref} className={cn('flex items-center', className)} {...props}>
        {visible.map((child, i) => (
          <div key={i} className={cn('ring-card rounded-full ring-2', i !== 0 && '-ml-2.5')}>
            {child}
          </div>
        ))}
        {overflow > 0 && (
          <div className="ring-card -ml-2.5 rounded-full ring-2">
            <Avatar>
              <AvatarFallback className="bg-subtle text-foreground text-xs">
                +{overflow}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    );
  },
);
AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };
