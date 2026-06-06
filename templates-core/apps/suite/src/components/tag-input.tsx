/**
 * TagInput — saisie de tags en chips (Epic 6, gestion des tags de contact).
 *
 * Boîte bordée façon champ (bg-card) : chaque tag est une puce avec bouton ×,
 * un input interne ajoute un tag sur Entrée / virgule (et au blur), Backspace
 * sur champ vide retire le dernier. Dédup + trim + cap (`max`, défaut 50).
 * Réutilisé dans le formulaire contact et l'action groupée « Tagger ».
 */
import { useState } from 'react';
import { X } from 'lucide-react';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
}

export function TagInput({ value, onChange, placeholder, max = 50 }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const t = raw.trim();
    setDraft('');
    if (!t || value.includes(t) || value.length >= max) return;
    onChange([...value, t]);
  };
  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  return (
    <div className="border-border bg-card focus-within:ring-brand-400/40 flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-[12px] border px-2 py-1.5 transition-shadow focus-within:ring-2">
      {value.map((t) => (
        <span
          key={t}
          className="bg-base-100 text-base-700 inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-[12px] font-medium"
        >
          {t}
          <button
            type="button"
            onClick={() => remove(t)}
            aria-label={`Retirer ${t}`}
            className="hover:bg-base-200 inline-flex h-4 w-4 items-center justify-center rounded-full"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length > 0) {
            remove(value[value.length - 1] as string);
          }
        }}
        onBlur={() => add(draft)}
        placeholder={value.length ? '' : placeholder}
        className="text-base-900 placeholder:text-base-400 min-w-[80px] flex-1 bg-transparent px-1 text-sm outline-none"
      />
    </div>
  );
}
