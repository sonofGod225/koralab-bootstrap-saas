/**
 * Logger — interface partagée du logger structuré.
 *
 * Type uniquement (aucune implémentation). L'implémentation Axiom vit dans
 * `apps/api` (Story 1.6) ; cette interface permet aux packages domaine
 * (`@__SCOPE__/auth`, `@__SCOPE__/notifications`) de recevoir un logger en
 * dépendance sans dépendre de la couche observabilité.
 */

export type LogLevel = 'info' | 'warn' | 'error';

export type LogFields = Record<string, unknown>;

export interface Logger {
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
  /** Envoie le buffer d'événements (impl. Axiom). À passer à `ctx.waitUntil()`. */
  flush(): Promise<void>;
}
