/**
 * <Menubar /> — Radix Menubar adapté Terre & Soleil.
 *
 * Patron shadcn/ui new-york. Style :
 * - Barre : bg-white, border terre-100, rounded-xl, shadow-xs, padding 4px.
 * - Déclencheurs : texte terre-900, hover bg-terre-50, open bg-terre-50.
 * - Contenu : bg-white, rounded-xl, border terre-100/50, shadow-lg.
 * - Items : hover bg-terre-50, focus bg-terre-50.
 * - Raccourcis clavier : font-mono text-xs text-terre-400.
 * - Séparateurs : bg-terre-100.
 * - Sous-menus : chevron lucide ChevronRight.
 */

import * as React from 'react';
import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ─── Menubar root ──────────────────────────────────────────────────────── */

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      'border-border bg-card flex h-10 items-center gap-0.5 rounded-xl border p-1 shadow-xs',
      className,
    )}
    {...props}
  />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

/* ─── MenubarMenu ───────────────────────────────────────────────────────── */

const MenubarMenu = MenubarPrimitive.Menu;

/* ─── MenubarGroup ──────────────────────────────────────────────────────── */

const MenubarGroup = MenubarPrimitive.Group;

/* ─── MenubarPortal ─────────────────────────────────────────────────────── */

const MenubarPortal = MenubarPrimitive.Portal;

/* ─── MenubarSub ────────────────────────────────────────────────────────── */

const MenubarSub = MenubarPrimitive.Sub;

/* ─── MenubarRadioGroup ─────────────────────────────────────────────────── */

const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

/* ─── MenubarTrigger ────────────────────────────────────────────────────── */

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      'text-foreground flex cursor-default items-center rounded-lg px-3 py-1.5 text-sm font-medium tracking-tight transition-colors duration-120 outline-none select-none',
      'hover:bg-muted focus:bg-muted',
      'data-[state=open]:bg-muted',
      className,
    )}
    {...props}
  />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

/* ─── Styles partagés pour les panels de contenu ────────────────────────── */

const menubarContentClasses =
  'z-50 min-w-[12rem] overflow-hidden rounded-xl border border-border/50 bg-card p-1 shadow-lg ' +
  'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ' +
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ' +
  'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 ' +
  'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2';

/* ─── MenubarSubTrigger ─────────────────────────────────────────────────── */

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'text-foreground flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-120 outline-none select-none',
      'hover:bg-muted focus:bg-muted',
      'data-[state=open]:bg-muted',
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="text-muted-foreground ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

/* ─── MenubarSubContent ─────────────────────────────────────────────────── */

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(menubarContentClasses, className)}
    {...props}
  />
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

/* ─── MenubarContent ────────────────────────────────────────────────────── */

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = 'start', alignOffset = -4, sideOffset = 8, ...props }, ref) => (
  <MenubarPrimitive.Portal>
    <MenubarPrimitive.Content
      ref={ref}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn(menubarContentClasses, className)}
      {...props}
    />
  </MenubarPrimitive.Portal>
));
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

/* ─── MenubarItem ───────────────────────────────────────────────────────── */

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      'text-foreground relative flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-120 outline-none select-none',
      'hover:bg-muted focus:bg-muted',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      '[&_svg]:text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

/* ─── MenubarCheckboxItem ───────────────────────────────────────────────── */

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'text-foreground relative flex cursor-default items-center rounded-lg py-1.5 pr-2 pl-8 text-sm transition-colors duration-120 outline-none select-none',
      'hover:bg-muted focus:bg-muted',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="text-foreground h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

/* ─── MenubarRadioItem ──────────────────────────────────────────────────── */

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      'text-foreground relative flex cursor-default items-center rounded-lg py-1.5 pr-2 pl-8 text-sm transition-colors duration-120 outline-none select-none',
      'hover:bg-muted focus:bg-muted',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="fill-primary text-primary h-2 w-2" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

/* ─── MenubarLabel ──────────────────────────────────────────────────────── */

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      'text-muted-foreground px-2 py-1.5 text-xs font-semibold tracking-wide uppercase',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

/* ─── MenubarSeparator ──────────────────────────────────────────────────── */

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn('bg-border -mx-1 my-1 h-px', className)}
    {...props}
  />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

/* ─── MenubarShortcut ───────────────────────────────────────────────────── */

function MenubarShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('text-muted-foreground ml-auto font-mono text-xs tracking-normal', className)}
      {...props}
    />
  );
}
MenubarShortcut.displayName = 'MenubarShortcut';

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};
