/**
 * <Combobox /> — Champ de recherche avec liste déroulante filtrée.
 *
 * Construit sur Popover + Command (shadcn/ui pattern).
 * Style :
 * - Trigger : height 44px, rounded-[12px], border-border, texte foreground.
 * - Liste : rounded-[12px], shadow-lg, bg-background.
 * - Item sélectionné : Check lucide soleil-600.
 * - Vide : texte muted-foreground centré.
 */

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './command';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = 'Sélectionner…',
      emptyText = 'Aucun résultat.',
      className,
      disabled,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);

    const selected = options.find((opt) => opt.value === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              'border-border bg-background flex h-11 w-full items-center justify-between rounded-[12px] border px-3.5 py-2 text-sm transition-shadow',
              'text-foreground placeholder:text-muted-foreground',
              'focus-visible:ring-soleil-400/40 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              open &&
                'ring-soleil-400/40 ring-offset-background border-soleil-300 ring-2 ring-offset-1',
              className,
            )}
          >
            <span className={cn(!selected && 'text-muted-foreground')}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="text-muted-foreground ml-2 h-4 w-4 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={(current) => {
                      onValueChange?.(current === value ? '' : current);
                      setOpen(false);
                    }}
                  >
                    {opt.label}
                    <Check
                      className={cn(
                        'text-soleil-600 ml-auto h-4 w-4',
                        value === opt.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
Combobox.displayName = 'Combobox';

export { Combobox };
