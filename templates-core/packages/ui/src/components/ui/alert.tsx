/**
 * <Alert /> — Bandeau d'alerte sémantique Base & Brand.
 *
 * Variants (cf. overlays.jsx Alert) :
 * - `default` : bg base-50,       border base-200,      icône base-700
 * - `info`    : bg brand-50,      border brand-200,     icône brand-700
 * - `success` : bg success-50,   border success-200,  icône success-600
 * - `warning` : bg warning-50,         border warning-200,        icône warning-600
 * - `danger`  : bg danger-50,      border danger-200,     icône danger-600
 *
 * Composants exportés : `Alert`, `AlertTitle`, `AlertDescription`.
 * Slot icône : passez un `<SomeIcon />` comme premier enfant ou via prop `icon`.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Variants ─────────────────────────────────────────────────────────────

const alertVariants = cva(
  'relative flex w-full items-start gap-3 rounded-[14px] border p-4 text-sm',
  {
    variants: {
      variant: {
        default: 'bg-muted border-border text-foreground',
        info: 'bg-brand-50 border-brand-200 text-brand-900',
        success: 'bg-success-50 border-success-200 text-success-900',
        warning: 'bg-warning-50 border-warning-200 text-base-900',
        danger: 'bg-danger-50 border-danger-200 text-danger-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

// Icône par défaut selon le variant
const DEFAULT_ICONS: Record<string, React.ElementType> = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
};

// Couleur de l'icône selon le variant
const ICON_CLASS: Record<string, string> = {
  default: 'text-foreground',
  info: 'text-brand-700',
  success: 'text-success-600',
  warning: 'text-warning-600',
  danger: 'text-danger-600',
};

// ─── Alert ────────────────────────────────────────────────────────────────

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  /** Icône lucide-react à afficher. Surcharge l'icône par défaut du variant. */
  icon?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', icon, children, ...props }, ref) => {
    const key = variant ?? 'default';
    const DefaultIcon = DEFAULT_ICONS[key] ?? Info;

    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        <span className={cn('mt-0.5 shrink-0', ICON_CLASS[key])}>
          {icon ?? <DefaultIcon className="h-[18px] w-[18px]" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  },
);
Alert.displayName = 'Alert';

// ─── AlertTitle ───────────────────────────────────────────────────────────

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-0.5 leading-snug font-medium tracking-tight', className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = 'AlertTitle';

// ─── AlertDescription ─────────────────────────────────────────────────────

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-[13px] leading-relaxed opacity-85', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
