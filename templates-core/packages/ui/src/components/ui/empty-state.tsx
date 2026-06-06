/**
 * <EmptyState /> — État vide centré Terre & Soleil.
 *
 * Affiché lorsqu'une liste ou un tableau ne contient aucune donnée.
 * Jamais du texte brut — toujours illustration + titre + description optionnelle
 * + action optionnelle.
 *
 * Usage courant :
 * - `<DataTable emptyState={{ title: 'Aucune facture', description: '...' }} />`
 * - Standalone dans une page vide.
 */

import * as React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Illustration sobre par défaut — icône Inbox lucide dans un cercle muted. */
function DefaultIllustration() {
  return (
    <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
      <Inbox className="text-muted-foreground h-8 w-8" strokeWidth={1.25} />
    </div>
  );
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** SVG ou composant React utilisé comme illustration. Défaut : icône Inbox. */
  illustration?: React.ReactNode;
  /** Titre principal (obligatoire). */
  title: string;
  /** Description complémentaire (optionnelle). */
  description?: string;
  /** Bouton ou lien d'action (optionnel). */
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ illustration, title, description, action, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center gap-4 px-6 py-16 text-center',
        className,
      )}
      {...props}
    >
      {illustration ?? <DefaultIllustration />}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-foreground font-display text-lg font-light tracking-tight">{title}</p>
        {description && (
          <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  ),
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
