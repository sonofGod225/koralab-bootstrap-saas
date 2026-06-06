/**
 * <DateRangePicker /> — Sélection de plage de dates Base & Brand.
 *
 * Props :
 * - `value`         : { from: Date; to: Date } | undefined
 * - `onValueChange` : (range: { from: Date; to: Date } | undefined) => void
 * - `presets`       : liste de presets affichés (défaut ['7d','30d','90d','custom'])
 * + props div standard (className)
 *
 * Interface : un bouton trigger → Popover avec une colonne de presets à gauche
 * et un Calendar mode="range" à droite.
 * Les presets ('7d','30d','90d') calculent la plage via date-fns subDays.
 * 'custom' permet la sélection libre dans le calendrier.
 */

import * as React from 'react';
import { format as dateFnsFormat, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Calendar } from './calendar';

export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export interface DateRangeValue {
  from: Date;
  to: Date;
}

export interface DateRangePickerProps {
  /** Plage sélectionnée. */
  value: DateRangeValue | undefined;
  /** Callback déclenché à chaque changement. */
  onValueChange: (range: DateRangeValue | undefined) => void;
  /** Presets disponibles (défaut : tous). */
  presets?: DateRangePreset[];
  /** Classes additionnelles sur le wrapper. */
  className?: string;
  /** Désactivé. */
  disabled?: boolean;
  /** aria-invalid pour les formulaires. */
  'aria-invalid'?: boolean | 'true' | 'false';
  /** aria-describedby pour l'accessibilité. */
  'aria-describedby'?: string;
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '90 derniers jours',
  custom: 'Période personnalisée',
};

/** Calcule la plage de dates correspondant à un preset. */
function computePresetRange(preset: Exclude<DateRangePreset, 'custom'>): DateRangeValue {
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const today = new Date();
  return {
    from: startOfDay(subDays(today, days - 1)),
    to: endOfDay(today),
  };
}

/** Formate une plage pour l'affichage dans le bouton trigger. */
function formatRange(value: DateRangeValue | undefined): string {
  if (!value) return 'Sélectionner une période';
  const from = dateFnsFormat(value.from, 'dd/MM/yyyy', { locale: fr });
  const to = dateFnsFormat(value.to, 'dd/MM/yyyy', { locale: fr });
  return `${from} → ${to}`;
}

const DEFAULT_PRESETS: DateRangePreset[] = ['7d', '30d', '90d', 'custom'];

const DateRangePicker = React.forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      value,
      onValueChange,
      presets = DEFAULT_PRESETS,
      className,
      disabled,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedby,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [activePreset, setActivePreset] = React.useState<DateRangePreset | null>(null);

    // Plage interne (peut être partielle pendant la sélection calendrier)
    const [calendarRange, setCalendarRange] = React.useState<DateRange | undefined>(
      value ? { from: value.from, to: value.to } : undefined,
    );

    // Sync externe
    React.useEffect(() => {
      setCalendarRange(value ? { from: value.from, to: value.to } : undefined);
    }, [value]);

    const handlePresetClick = (preset: DateRangePreset) => {
      setActivePreset(preset);
      if (preset !== 'custom') {
        const range = computePresetRange(preset);
        setCalendarRange({ from: range.from, to: range.to });
        onValueChange(range);
        setOpen(false);
      }
    };

    const handleCalendarSelect = (range: DateRange | undefined) => {
      setCalendarRange(range);
      setActivePreset('custom');
      if (range?.from && range?.to) {
        onValueChange({ from: range.from, to: range.to });
        // Ferme automatiquement une fois la plage complète
        setOpen(false);
      }
    };

    return (
      <div ref={ref} className={cn('inline-flex', className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedby}
              className={cn(
                'border-border bg-background text-foreground justify-start gap-2 rounded-[12px] border px-3.5 text-sm font-normal',
                !value && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="text-muted-foreground h-4 w-4 shrink-0" />
              <span>{formatRange(value)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              {/* Colonne des presets */}
              <div className="border-border flex flex-col gap-1 border-r p-3">
                <p className="text-muted-foreground mb-1 px-2 text-xs font-medium tracking-wide uppercase">
                  Période
                </p>
                {presets.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={activePreset === preset ? 'default' : 'ghost'}
                    size="sm"
                    className="justify-start"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {PRESET_LABELS[preset]}
                  </Button>
                ))}
              </div>
              {/* Calendrier (toujours visible, actif pour 'custom') */}
              <div className="p-3">
                <Calendar
                  mode="range"
                  selected={calendarRange}
                  onSelect={handleCalendarSelect}
                  defaultMonth={calendarRange?.from}
                  numberOfMonths={2}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
DateRangePicker.displayName = 'DateRangePicker';

export { DateRangePicker };
