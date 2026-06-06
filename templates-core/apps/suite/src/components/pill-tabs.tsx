/**
 * PillTabs — tabs « pills » du design v3 (fond terre-100, item actif bg-card + shadow).
 * Badge de compte optionnel. Reproduit `epic6-contacts.jsx` §PillTabs.
 */
export interface PillTabItem {
  value: string;
  label: string;
  /** Compteur affiché à droite du label (ex. total). */
  badge?: string | number;
}

export interface PillTabsProps {
  value: string;
  onChange: (value: string) => void;
  items: PillTabItem[];
}

export function PillTabs({ value, onChange, items }: PillTabsProps) {
  return (
    <div className="bg-terre-100 inline-flex gap-0.5 rounded-full p-[3px]">
      {items.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={[
              'inline-flex items-center gap-2 rounded-full px-[18px] py-[7px] text-[13px] font-medium transition-colors',
              active
                ? 'bg-card text-terre-900 shadow-xs'
                : 'text-terre-600 hover:text-terre-900 bg-transparent',
            ].join(' ')}
          >
            {t.label}
            {t.badge !== undefined && (
              <span
                className={[
                  'font-mono text-[11px]',
                  active ? 'text-terre-500' : 'text-terre-400',
                ].join(' ')}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
