/**
 * <Calendar /> — react-day-picker v10 adapté Base & Brand.
 *
 * Locale française par défaut (lundi en premier).
 * Style via `classNames` prop (API v10 : clés = valeurs de l'enum UI / DayFlag / SelectionState).
 * Jour sélectionné : bg-base-900, texte base-25, rounded-lg.
 * Aujourd'hui : marqué d'un dot brand-400.
 * Boutons nav : buttonVariants({ variant: 'ghost' }).
 * Conteneur : bg blanc, rounded-2xl, border base-100.
 */

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'react-day-picker/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { buttonVariants } from './button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={fr}
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      className={cn('bg-background border-border rounded-2xl border p-4 shadow-sm', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'font-display text-sm font-medium text-foreground tracking-tight',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'absolute left-1 top-0 h-7 w-7',
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'absolute right-1 top-0 h-7 w-7',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-8 font-normal text-xs text-center py-1',
        weeks: 'flex flex-col mt-2',
        week: 'flex w-full mt-0.5',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-muted [&:has([aria-selected].range_end)]:rounded-r-lg [&:has([aria-selected].range_start)]:rounded-l-lg first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg',
        day_button: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-lg',
        ),
        range_start: 'range_start',
        range_end: 'range_end',
        selected:
          'bg-primary text-primary-foreground rounded-lg hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        today: 'bg-muted text-foreground font-medium',
        outside:
          'text-muted-foreground opacity-50 aria-selected:bg-muted/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        disabled: 'text-muted-foreground opacity-50',
        range_middle: 'aria-selected:bg-muted aria-selected:text-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
