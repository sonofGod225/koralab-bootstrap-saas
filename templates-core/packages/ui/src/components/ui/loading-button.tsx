/**
 * <LoadingButton> — bouton avec état de chargement (Story 2.10).
 *
 * `loading` désactive le bouton, affiche un spinner et empêche le
 * double-submit (le `disabled` neutralise le clic pendant la requête).
 * Enveloppe `<Button>` — hérite de tous ses variants / tailles.
 */

import * as React from 'react';
import { Button, type ButtonProps } from './button';
import { Spinner } from './spinner';

export interface LoadingButtonProps extends ButtonProps {
  /** Affiche le spinner et désactive le bouton. */
  loading?: boolean;
  /** Libellé pendant le chargement (par défaut : le contenu inchangé). */
  loadingText?: React.ReactNode;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, loadingText, disabled, children, ...props }, ref) => (
    <Button ref={ref} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Spinner className="size-4" aria-hidden="true" />}
      {loading ? (loadingText ?? children) : children}
    </Button>
  ),
);
LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
