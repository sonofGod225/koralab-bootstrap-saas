/**
 * Composants identité __PROJECT_NAME__ — symbole, logo (symbole + wordmark), loader.
 *
 * Trois exports :
 *  - [[__PROJECT_NAME__Symbol]] : SVG petal 4 quadrants seul (sans wordmark)
 *  - [[__PROJECT_NAME__Logo]]   : symbole + wordmark "__PROJECT_NAME__" en Fraunces
 *  - [[__PROJECT_NAME__Loader]] : loader plein écran avec le symbole en pulse animé
 *
 * `AuthLogo` (cf. `auth-screen.tsx`) reste séparé : il enveloppe le SVG dans
 * un `<a href="/">` pour sortir vers la home publique depuis les écrans Auth.
 */

/** Symbole __PROJECT_NAME__ — 4 quadrants : 3 Terre 900 + 1 accent Soleil 400 bottom-right. */
export function __PROJECT_NAME__Symbol({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      style={{ width: size, height: size }}
      className={className}
      aria-label="__PROJECT_NAME__"
      role="img"
    >
      <path d="M 8 28 L 8 18 Q 8 8 18 8 L 28 8 L 28 28 Z" fill="var(--color-terre-900)" />
      <path d="M 30 28 L 30 8 L 48 8 Q 48 8 48 18 L 48 28 Z" fill="var(--color-terre-900)" />
      <path d="M 8 30 L 28 30 L 28 48 L 18 48 Q 8 48 8 38 Z" fill="var(--color-terre-900)" />
      <path d="M 30 30 L 48 30 L 48 38 Q 48 48 38 48 L 30 48 Z" fill="var(--color-soleil-400)" />
    </svg>
  );
}

/**
 * Logo complet — symbole + wordmark "__PROJECT_NAME__" en Fraunces. Pas de lien
 * (l'enrobage est géré par le consommateur, ex: `<Link to="/">…</Link>`).
 */
export function __PROJECT_NAME__Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="__PROJECT_NAME__">
      <__PROJECT_NAME__Symbol size={size} />
      <span className="font-display text-terre-900 text-base font-semibold tracking-tight">
        __PROJECT_NAME__
      </span>
    </span>
  );
}

/**
 * Loader plein écran — symbole 56px en `animate-pulse` (opacity 0.5↔1 sur
 * 2s, sobre et cohérent avec le ton __PROJECT_NAME__). Affiché pendant le bootstrap
 * du shell `_app.tsx` (resolution session + orgs).
 */
export function __PROJECT_NAME__Loader({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div
      className="bg-background flex min-h-screen flex-col items-center justify-center gap-5"
      role="status"
      aria-live="polite"
    >
      <__PROJECT_NAME__Symbol size={56} className="animate-pulse" />
      <p className="text-terre-600 text-sm">{message}</p>
    </div>
  );
}
