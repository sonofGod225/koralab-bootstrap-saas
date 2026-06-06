/**
 * <DateInput /> — Champ date avec popover calendrier Base & Brand.
 *
 * Props :
 * - `value`         : Date | undefined
 * - `onValueChange` : (date: Date | undefined) => void
 * - `format`        : pattern date-fns (défaut 'dd/MM/yyyy')
 * - `locale`        : BCP-47 (défaut 'fr-AF') — utilisé pour l'affichage
 * - `placeholder`   : texte du champ vide (défaut 'jj/mm/aaaa')
 * + props input standard (sauf type/value/onChange)
 *
 * Champ texte : l'utilisateur peut saisir directement ou cliquer l'icône
 * calendrier pour ouvrir le <Popover> → <Calendar mode="single">.
 * Formatage via date-fns (format + locale fr).
 * Semaine du lundi au dimanche (configurée dans Calendar).
 */

import * as React from 'react';
import { format as dateFnsFormat, parse, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from './input';
import { Button } from './button';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Calendar } from './calendar';

export interface DateInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  /** Date sélectionnée. */
  value: Date | undefined;
  /** Callback déclenché à chaque changement. */
  onValueChange: (date: Date | undefined) => void;
  /** Pattern date-fns pour l'affichage et la saisie (défaut 'dd/MM/yyyy'). */
  format?: string;
  /**
   * Locale BCP-47 (défaut 'fr-AF').
   * Actuellement utilisée pour le label accessible ; le calendrier
   * est toujours en français (date-fns locale fr).
   */
  locale?: string;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      format: formatPattern = 'dd/MM/yyyy',
      locale: _locale = 'fr-AF',
      placeholder = 'jj/mm/aaaa',
      disabled,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedby,
      id,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState<string>(() =>
      value ? dateFnsFormat(value, formatPattern, { locale: fr }) : '',
    );
    const [inputFocused, setInputFocused] = React.useState(false);

    // Sync externe → champ texte (sauf si l'utilisateur est en train de taper)
    React.useEffect(() => {
      if (!inputFocused) {
        setInputValue(value ? dateFnsFormat(value, formatPattern, { locale: fr }) : '');
      }
    }, [value, formatPattern, inputFocused]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInputValue(raw);

      if (raw === '') {
        onValueChange(undefined);
        return;
      }

      // Tente le parse strict
      const parsed = parse(raw, formatPattern, new Date());
      if (isValid(parsed)) {
        onValueChange(parsed);
      }
    };

    const handleInputBlur = () => {
      setInputFocused(false);
      // Re-formate proprement à la sortie
      setInputValue(value ? dateFnsFormat(value, formatPattern, { locale: fr }) : '');
    };

    const handleDaySelect = (day: Date | undefined) => {
      onValueChange(day);
      if (day) {
        setInputValue(dateFnsFormat(day, formatPattern, { locale: fr }));
      } else {
        setInputValue('');
      }
      setOpen(false);
    };

    return (
      <div className="relative flex items-center">
        <Input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          className={cn('pr-10', className)}
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          onChange={handleInputChange}
          onFocus={() => setInputFocused(true)}
          onBlur={handleInputBlur}
          {...props}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label="Ouvrir le calendrier"
              className="absolute right-1 h-8 w-8 rounded-[10px]"
              tabIndex={-1}
            >
              <CalendarIcon className="text-muted-foreground h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDaySelect}
              defaultMonth={value}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
DateInput.displayName = 'DateInput';

export { DateInput };
