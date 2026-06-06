/**
 * Import CSV côté client (Story 6.3) — parseur + heuristiques de mapping + validation.
 * Parseur maison (pas de dépendance) gérant guillemets, virgules échappées et CRLF.
 */

/** Parse un CSV en matrice de cellules. Gère `"..."`, `""` échappé, `\n`/`\r\n`. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  // Retire un BOM éventuel.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }
  return rows;
}

export type ContactField =
  | 'name'
  | 'firstName'
  | 'lastName'
  | 'companyName'
  | 'email'
  | 'phone'
  | 'role'
  | 'tags'
  | 'ignore';

export type CatalogueField = 'name' | 'sku' | 'price' | 'type' | 'vatRate' | 'category' | 'ignore';

export const CONTACT_FIELD_OPTS: { value: ContactField; label: string }[] = [
  { value: 'name', label: 'Nom complet' },
  { value: 'firstName', label: 'Prénom' },
  { value: 'lastName', label: 'Nom' },
  { value: 'companyName', label: 'Raison sociale' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'role', label: 'Rôle' },
  { value: 'tags', label: 'Tags' },
  { value: 'ignore', label: '— Ignorer —' },
];

export const CATALOGUE_FIELD_OPTS: { value: CatalogueField; label: string }[] = [
  { value: 'name', label: 'Désignation' },
  { value: 'sku', label: 'SKU' },
  { value: 'price', label: 'Prix' },
  { value: 'type', label: 'Type' },
  { value: 'vatRate', label: 'TVA' },
  { value: 'category', label: 'Catégorie' },
  { value: 'ignore', label: '— Ignorer —' },
];

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

/** Devine le champ cible d'une colonne d'après son en-tête. */
export function guessField(header: string, entity: 'contacts' | 'catalogue'): string {
  const h = norm(header);
  if (entity === 'catalogue') {
    if (/(designation|nom|libelle|name|produit|article)/.test(h)) return 'name';
    if (/(sku|reference|ref|code)/.test(h)) return 'sku';
    if (/(prix|price|montant|tarif)/.test(h)) return 'price';
    if (/(type)/.test(h)) return 'type';
    if (/(tva|vat|taxe)/.test(h)) return 'vatRate';
    if (/(categorie|category|famille)/.test(h)) return 'category';
    return 'ignore';
  }
  if (/(prenom|firstname|first)/.test(h)) return 'firstName';
  if (/(raison|societe|company|entreprise)/.test(h)) return 'companyName';
  if (/(nom complet|fullname|^name$|^nom$)/.test(h)) return 'name';
  if (/(nom|lastname|last)/.test(h)) return 'lastName';
  if (/(whatsapp)/.test(h)) return 'ignore';
  if (/(tel|phone|mobile|numero|gsm)/.test(h)) return 'phone';
  if (/(email|mail|courriel)/.test(h)) return 'email';
  if (/(role|type|categorie)/.test(h)) return 'role';
  if (/(tag|etiquette)/.test(h)) return 'tags';
  return 'ignore';
}

export function isValidEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
}

/** Valide un téléphone : au moins 6 chiffres. */
export function isValidPhone(v: string): boolean {
  return v.replace(/\D/g, '').length >= 6;
}

/** Mappe une valeur de rôle libre (CSV) vers l'enum interne. */
export function mapRole(v: string): string | undefined {
  const h = norm(v);
  if (/(client|customer)/.test(h)) return 'customer';
  if (/(prospect|lead)/.test(h)) return 'prospect';
  if (/(fournisseur|supplier|vendor)/.test(h)) return 'supplier';
  if (h) return 'other';
  return undefined;
}
