/**
 * Bannière maintenance / incident (Epic 25, Story 25.15) — apps/suite.
 *
 * Affichée site-wide (montée dans `__root`). Charge le statut public côté
 * client (no-op SSR) et n'affiche un bandeau que si une maintenance est en
 * cours ou un incident actif. Lien vers la status page publique.
 */
import { useEffect, useState } from 'react';
import { trpc } from '../lib/trpc-client';

interface Banner {
  kind: 'maintenance' | 'incident';
  text: string;
}

export function MaintenanceBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let cancelled = false;
    void trpc.status.public
      .query()
      .then((d) => {
        if (cancelled) return;
        const maint = d.maintenances.find((m) => m.status === 'in_progress');
        const incident = d.incidents.find((i) => i.status !== 'resolved');
        if (maint)
          setBanner({ kind: 'maintenance', text: `Maintenance en cours : ${maint.title}` });
        else if (incident)
          setBanner({ kind: 'incident', text: `Incident en cours : ${incident.title}` });
      })
      .catch(() => {
        /* statut indisponible → pas de bannière */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!banner) return null;

  return (
    <a
      href="/status"
      className={`block px-4 py-2 text-center text-sm font-medium no-underline ${
        banner.kind === 'incident' ? 'bg-danger-600 text-white' : 'bg-warning-400 text-base-900'
      }`}
    >
      {banner.text} — voir le statut →
    </a>
  );
}
