/**
 * <ConfirmDialog> — confirmation d'action, basée sur `<AlertDialog>` (Story 2.10).
 *
 * - `destructive` : bouton de confirmation en Danger 600.
 * - `confirmPhrase` : double confirmation — l'utilisateur doit retaper la
 *   phrase exacte pour activer le bouton (suppressions critiques, UX-DR).
 *
 * Composant contrôlable (`open` / `onOpenChange`) ou piloté par `trigger`.
 */

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import { Input } from './input';
import { Label } from './label';
import { cn } from '../../lib/utils';

export interface ConfirmDialogProps {
  /** État ouvert contrôlé. */
  open?: boolean;
  /** Callback de changement d'état. */
  onOpenChange?: (open: boolean) => void;
  /** Élément déclencheur (rendu via `AlertDialogTrigger asChild`). */
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Action exécutée à la confirmation. */
  onConfirm?: () => void;
  /** Style destructif (Danger 600) pour le bouton de confirmation. */
  destructive?: boolean;
  /** Si fourni, l'utilisateur doit retaper cette phrase pour confirmer. */
  confirmPhrase?: string;
}

function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  destructive = false,
  confirmPhrase,
}: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState('');
  const locked = confirmPhrase != null && typed.trim() !== confirmPhrase;

  const handleOpenChange = (next: boolean) => {
    if (!next) setTyped('');
    onOpenChange?.(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>

        {confirmPhrase != null && (
          <div className="space-y-2">
            <Label htmlFor="confirm-dialog-phrase">
              Tapez <span className="text-foreground font-mono font-medium">{confirmPhrase}</span>{' '}
              pour confirmer
            </Label>
            <Input
              id="confirm-dialog-phrase"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={locked}
            onClick={onConfirm}
            className={cn(
              destructive && 'bg-danger-600 text-base-25 hover:bg-danger-800',
              locked && 'pointer-events-none opacity-50',
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
ConfirmDialog.displayName = 'ConfirmDialog';

export { ConfirmDialog };
