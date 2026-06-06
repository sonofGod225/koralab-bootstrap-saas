/**
 * redact() — masquage des données sensibles avant écriture dans `audit_log`
 * (Story 3.12).
 *
 * Traversée récursive d'une valeur (objet/array/scalaire) :
 * - les clés sensibles (mots de passe, tokens, secrets…) sont entièrement
 *   masquées ;
 * - dans les chaînes, les motifs PII (email, téléphone E.164, IBAN, NINEA)
 *   sont remplacés in-place — le reste de la chaîne (contexte) est conservé.
 *
 * Sur-masquage assumé : mieux vaut masquer trop que laisser fuiter une PII
 * dans un journal conservé 10 ans (obligations OHADA / CDP).
 */

const PLACEHOLDER = '[REDACTED]';

/** Clés dont la valeur est toujours masquée intégralement (comparaison lowercase). */
const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'passwordconfirm',
  'token',
  'apikey',
  'secret',
  'clientsecret',
  'authtoken',
  'mfacode',
  'totpcode',
  'backupcode',
  'otp',
]);

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g;
const PHONE_RE = /\+\d[\d\s().-]{7,}\d/g;
/** NINEA sénégalais — approximation : 7 chiffres + 1 caractère alphanumérique. */
const NINEA_RE = /\b\d{7}[A-Za-z0-9]\b/g;

/** Garde-fou contre les structures cycliques / trop profondes. */
const MAX_DEPTH = 8;

function redactString(value: string): string {
  return value
    .replace(EMAIL_RE, PLACEHOLDER)
    .replace(IBAN_RE, PLACEHOLDER)
    .replace(PHONE_RE, PLACEHOLDER)
    .replace(NINEA_RE, PLACEHOLDER);
}

/** Masque récursivement les PII et les clés sensibles d'une valeur arbitraire. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return PLACEHOLDER;
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? PLACEHOLDER : redact(val, depth + 1);
    }
    return out;
  }
  return value;
}
