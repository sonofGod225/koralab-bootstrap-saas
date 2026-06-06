/**
 * <VersionBadge /> — Affiche la version produit (footer des apps).
 *
 * Story 1.17 (versioning automatique). Le numéro est passé en prop : ce
 * composant ne lit jamais `import.meta.env` — `packages/ui` reste pur et
 * agnostique du framework. Chaque app lit sa version
 * (`import.meta.env.VITE_APP_VERSION`) et la passe ici.
 *
 * Dégradation : version absente (dev local sans VITE_APP_VERSION) → "dev".
 */

import { cn } from '../lib/utils';

export interface VersionBadgeProps {
  /** Version produit, ex. "v1.2.0" ou "v1.2.0-3-gabc1234" (staging). */
  version?: string;
  /** Libellé optionnel ajouté après la version (ex. environnement). */
  label?: string;
  className?: string;
}

export function VersionBadge({ version = 'dev', label, className }: VersionBadgeProps) {
  return (
    <div className={cn('text-muted-foreground font-mono text-xs tracking-widest', className)}>
      {version}
      {label ? ` · ${label}` : null}
    </div>
  );
}
