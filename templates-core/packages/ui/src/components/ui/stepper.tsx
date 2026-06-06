/**
 * <Stepper> — fil d'étapes pour wizards et onboarding (Story 2.11, UX-DR14).
 *
 * États par étape : `pending` · `current` · `done` · `error`. Le statut est
 * soit explicite (`step.status`), soit dérivé de `currentStep` (index).
 * Orientation horizontale (défaut) ou verticale.
 */

import * as React from 'react';
import { Check, X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export type StepStatus = 'pending' | 'current' | 'done' | 'error';

export interface Step {
  label: string;
  description?: string;
  /** Statut explicite — sinon dérivé de `currentStep`. */
  status?: StepStatus;
}

export interface StepperProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: Step[];
  /** Index de l'étape courante (0-based) — sert à dériver les statuts. */
  currentStep?: number;
  orientation?: 'horizontal' | 'vertical';
}

const circleVariants = cva(
  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      status: {
        pending: 'border-border text-muted-foreground border bg-muted',
        current: 'bg-primary text-primary-foreground ring-soleil-400/40 ring-2',
        done: 'bg-primary text-primary-foreground',
        error: 'bg-brique-600 text-terre-25',
      },
    },
  },
);

function resolveStatus(step: Step, index: number, currentStep: number): StepStatus {
  if (step.status) return step.status;
  if (index < currentStep) return 'done';
  if (index === currentStep) return 'current';
  return 'pending';
}

const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(
  ({ steps, currentStep = 0, orientation = 'horizontal', className, ...props }, ref) => {
    const vertical = orientation === 'vertical';
    return (
      <ol
        ref={ref}
        className={cn('flex', vertical ? 'flex-col gap-1' : 'items-start', className)}
        {...props}
      >
        {steps.map((step, index) => {
          const status = resolveStatus(step, index, currentStep);
          const isLast = index === steps.length - 1;
          return (
            <li
              key={step.label}
              aria-current={status === 'current' ? 'step' : undefined}
              className={cn('flex', vertical ? 'gap-3' : 'flex-1 items-start gap-3')}
            >
              {/* Pastille + connecteur */}
              <div className={cn('flex items-center', vertical && 'flex-col')}>
                <span className={circleVariants({ status })}>
                  {status === 'done' ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : status === 'error' ? (
                    <X className="size-4" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      status === 'done' ? 'bg-primary' : 'bg-border',
                      vertical ? 'my-1 w-px flex-1' : 'mx-2 mt-3.5 h-px flex-1',
                    )}
                  />
                )}
              </div>
              {/* Libellé */}
              <div className={cn('min-w-0', !vertical && 'pt-1', vertical && 'pb-4')}>
                <div
                  className={cn(
                    'text-sm font-medium',
                    status === 'pending' ? 'text-muted-foreground' : 'text-foreground',
                    status === 'error' && 'text-brique-700',
                  )}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-muted-foreground mt-0.5 text-xs">{step.description}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    );
  },
);
Stepper.displayName = 'Stepper';

export { Stepper };
