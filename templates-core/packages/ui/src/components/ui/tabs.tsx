/**
 * <Tabs /> — Radix Tabs adapté Terre & Soleil.
 *
 * Variants :
 * - `underline` (défaut) : liste sans fond, déclencheur actif avec bordure-bas
 *   soleil-400 et texte terre-900. Inactifs terre-500.
 * - `pills` : liste bg-terre-50 arrondie, déclencheur actif bg-white shadow-xs.
 *
 * Le variant est fourni via un contexte interne afin que TabsList et TabsTrigger
 * partagent la même configuration sans prop-drilling explicite côté consommateur.
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

/* ─── Contexte variant ──────────────────────────────────────────────────── */

type TabsVariant = 'underline' | 'pills';

const TabsVariantContext = React.createContext<TabsVariant>('underline');

/* ─── Tabs root ─────────────────────────────────────────────────────────── */

export interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: TabsVariant;
}

const Tabs = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProps>(
  ({ variant = 'underline', ...props }, ref) => (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.Root ref={ref} {...props} />
    </TabsVariantContext.Provider>
  ),
);
Tabs.displayName = TabsPrimitive.Root.displayName;

/* ─── TabsList ──────────────────────────────────────────────────────────── */

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex items-center',
        variant === 'underline' && 'border-border gap-1 border-b',
        variant === 'pills' && 'bg-muted gap-0.5 rounded-lg p-1',
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

/* ─── TabsTrigger ───────────────────────────────────────────────────────── */

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'focus-visible:ring-soleil-400/40 inline-flex items-center gap-2 text-sm font-medium tracking-tight whitespace-nowrap transition-all duration-120 focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        variant === 'underline' && [
          'text-muted-foreground px-3.5 py-3',
          '-mb-px border-b-2 border-transparent',
          'hover:text-foreground',
          'data-[state=active]:border-soleil-400 data-[state=active]:text-foreground',
        ],
        variant === 'pills' && [
          'text-muted-foreground rounded-lg px-3.5 py-[7px]',
          'hover:text-foreground',
          'data-[state=active]:text-foreground data-[state=active]:bg-card data-[state=active]:shadow-xs',
        ],
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/* ─── TabsContent ───────────────────────────────────────────────────────── */

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'focus-visible:ring-soleil-400/40 mt-4 focus-visible:ring-2 focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
