/**
 * <CommandPalette> — palette de commandes globale (Story 2.11).
 *
 * Raccourci `⌘K` / `Ctrl+K` global, recherche plein-texte, commandes
 * groupées par module (Facturation, CRM, Encaissements, Réglages…).
 * Construit sur le primitive `Command` (cmdk) + `CommandDialog`.
 *
 * Contrôlable (`open` / `onOpenChange`) ou autonome (le raccourci ouvre/ferme).
 */

import * as React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';

export interface CommandPaletteItem {
  id: string;
  label: string;
  /** Icône Lucide optionnelle (élément React). */
  icon?: React.ReactNode;
  /** Raccourci affiché à droite (ex: `⌘F`). */
  shortcut?: string;
  /** Mots-clés supplémentaires pour la recherche. */
  keywords?: string[];
  /** Action déclenchée à la sélection. */
  onSelect: () => void;
}

export interface CommandPaletteGroup {
  /** Intitulé du groupe — typiquement un module. */
  heading: string;
  items: CommandPaletteItem[];
}

export interface CommandPaletteProps {
  groups: CommandPaletteGroup[];
  /** État ouvert contrôlé (sinon géré en interne via ⌘K). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  emptyText?: string;
}

function CommandPalette({
  groups,
  open: openProp,
  onOpenChange,
  placeholder = 'Tapez une commande ou cherchez…',
  emptyText = 'Aucun résultat.',
}: CommandPaletteProps) {
  const [openState, setOpenState] = React.useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setOpenState(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        {groups.map((group, index) => (
          <React.Fragment key={group.heading}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${(item.keywords ?? []).join(' ')}`}
                  onSelect={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
CommandPalette.displayName = 'CommandPalette';

export { CommandPalette };
