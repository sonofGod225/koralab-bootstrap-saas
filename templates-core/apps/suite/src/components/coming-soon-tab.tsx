/**
 * ComingSoonTab — état « bientôt » désirable des onglets cross-module (fiches 360°).
 * Partagé par la fiche contact (Opportunités/Factures/Paiements/Activité) et la fiche
 * produit (Stock/Ventes). Aperçu optionnel (cartes grisées) pour donner envie.
 */
import { Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ComingSoonTabProps {
  /** Icône principale (défaut horloge). */
  icon?: LucideIcon;
  title: string;
  note: string;
  /** Libellé du badge (défaut « Prévu prochainement »). */
  badge?: string;
  /** Aperçu optionnel — cartes grisées (ex. stock par établissement). */
  preview?: { k: string; v: string }[];
}

export function ComingSoonTab({
  icon: Icon = Clock,
  title,
  note,
  badge = 'Prévu prochainement',
  preview,
}: ComingSoonTabProps) {
  return (
    <div className="border-border-subtle bg-card max-w-[880px] overflow-hidden rounded-[18px] border-[0.5px]">
      <div className="flex flex-col items-center gap-3 px-7 pt-10 pb-9 text-center">
        <span className="bg-brand-50 text-brand-700 relative inline-flex h-[60px] w-[60px] items-center justify-center rounded-[18px]">
          <Icon className="h-7 w-7" />
          <span className="bg-brand-400 text-base-900 border-card absolute -right-1 -bottom-1 inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-2">
            <Clock className="h-3 w-3" />
          </span>
        </span>
        <div className="font-display text-base-900 text-[22px] font-medium tracking-[-0.4px]">
          {title}
        </div>
        <p className="text-base-600 m-0 max-w-[440px] text-[14px] leading-[1.55]">{note}</p>
        <span className="bg-brand-50 text-brand-700 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium">
          {badge}
        </span>
      </div>
      {preview && preview.length > 0 && (
        <div className="border-border-subtle bg-base-25 border-t-[0.5px] p-5">
          <div className="text-base-400 mb-3 text-center text-[10px] font-semibold tracking-[1px] uppercase">
            Aperçu
          </div>
          <div className="flex justify-center gap-3 opacity-50 saturate-[0.6]">
            {preview.map((c) => (
              <div
                key={c.k}
                className="border-border-subtle bg-card max-w-[200px] flex-1 rounded-[14px] border-[0.5px] p-4"
              >
                <div className="text-base-400 mb-2 text-[10px] font-semibold tracking-[0.8px] uppercase">
                  {c.k}
                </div>
                <div className="font-display text-base-700 text-[24px] tracking-[-0.6px]">
                  {c.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
