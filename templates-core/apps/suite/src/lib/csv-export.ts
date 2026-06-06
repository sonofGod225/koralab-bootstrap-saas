/**
 * Export CSV côté client (Story 6.4) — génération + téléchargement.
 *
 * Pattern aligné sur `apps/admin/src/routes/_app/audit/index.tsx`. BOM UTF-8 en tête
 * pour qu'Excel ouvre correctement les accents (Sénégal/CI).
 */

function escapeCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

/** Construit un CSV depuis des objets plats (les clés de `headers` indexent chaque row). */
export function buildCsv<T extends Record<string, unknown>>(
  headers: { key: keyof T; label: string }[],
  rows: readonly T[],
): string {
  const head = headers.map((h) => escapeCell(h.label)).join(',');
  const body = rows.map((r) => headers.map((h) => escapeCell(r[h.key])).join(','));
  return [head, ...body].join('\r\n');
}

/** Déclenche le téléchargement d'un CSV (Blob + lien temporaire). */
export function downloadCsv(filename: string, csv: string): void {
  // BOM UTF-8 : Excel détecte l'encodage et affiche les accents correctement.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Suffixe date `AAAA-MM-JJ` pour nommer les fichiers d'export. */
export function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
