/**
 * LogoUpload — composant partagé d'upload du logo d'organisation.
 *
 * Utilisé par l'onboarding (étape « company ») et le profil compagnie
 * (`/settings/organization`). Encapsule :
 *  - input fichier caché + bouton (états vide / upload en cours / changer) ;
 *  - validation type + taille (alignée sur la route `/files/logo`) ;
 *  - aperçu LOCAL instantané via `URL.createObjectURL` dès la sélection
 *    (indépendant du réseau), remplacé par l'URL distante au succès ;
 *  - `POST ${API_URL}/files/logo` (FormData, cookies de session inclus) ;
 *  - messages d'erreur explicites dérivés du code renvoyé par l'API.
 *
 * Architecture (Epic 5) : l'upload est persisté côté serveur dans R2 +
 * `organizations.logo` par le handler ; ce composant ne fait que piloter
 * l'appel et l'affichage.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@__SCOPE__/ui/button';

/** Base URL du Worker API — l'upload du logo passe hors tRPC (multipart). */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9187';

/** Types image acceptés pour le logo (alignés sur la route `/files/logo`). */
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const LOGO_MAX_BYTES = 1_000_000;

/** Mappe les codes d'erreur de l'API vers des messages FR lisibles. */
function errorMessage(code: string | undefined): string {
  switch (code) {
    case 'NO_ACTIVE_ORG':
      return 'Aucune organisation active. Reconnectez-vous puis réessayez.';
    case 'UNAUTHORIZED':
      return 'Session expirée. Reconnectez-vous puis réessayez.';
    case 'INVALID_TYPE':
      return 'Format non supporté (PNG, JPG, WEBP, SVG).';
    case 'TOO_LARGE':
      return 'Fichier trop volumineux (1 Mo max).';
    case 'NO_FILE':
      return 'Aucun fichier reçu. Réessayez.';
    default:
      return 'Échec du téléversement. Réessayez.';
  }
}

export type LogoUploadProps = {
  /** Logo déjà persisté sur l'org (préchargé) — affiché tant qu'aucun nouvel upload. */
  initialUrl?: string | null;
  /** Initiale affichée en fallback quand il n'y a pas d'image. */
  fallbackInitial?: string;
  /** Callback après upload réussi (URL distante R2). */
  onUploaded?: (url: string) => void;
  /** Libellé secondaire sous le bouton (par défaut : contraintes de format). */
  hint?: string;
};

export function LogoUpload({
  initialUrl,
  fallbackInitial = 'E',
  onUploaded,
  hint = 'PNG, JPG, SVG — 1 Mo max.',
}: LogoUploadProps) {
  // URL distante persistée (org). Synchronisée si `initialUrl` arrive après coup.
  const [remoteUrl, setRemoteUrl] = useState<string | null>(initialUrl ?? null);
  // Aperçu local (object URL) — feedback immédiat, indépendant du réseau/CORP.
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Si le parent fournit `initialUrl` de façon asynchrone (ex. après fetch org).
  useEffect(() => {
    if (initialUrl) setRemoteUrl(initialUrl);
  }, [initialUrl]);

  // Révoque l'object URL local au démontage (évite les fuites mémoire).
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const shownUrl = localPreview ?? remoteUrl;

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (!LOGO_TYPES.includes(file.type)) {
      setError(errorMessage('INVALID_TYPE'));
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError(errorMessage('TOO_LARGE'));
      return;
    }

    // Aperçu local immédiat — l'utilisateur voit l'image avant la fin du réseau.
    const preview = URL.createObjectURL(file);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/files/logo`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'upload_failed');
      }
      setRemoteUrl(data.url);
      onUploaded?.(data.url);
    } catch (err) {
      const code = err instanceof Error ? err.message : undefined;
      setError(errorMessage(code));
      // Échec : on retire l'aperçu local pour ne pas laisser croire au succès.
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="bg-brand-100 text-base-900 font-display relative inline-flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] text-[36px] font-medium"
        aria-label="Choisir un logo"
      >
        {shownUrl ? (
          <img src={shownUrl} alt="Logo" className="h-full w-full object-cover" />
        ) : (
          (fallbackInitial.charAt(0) || 'E').toUpperCase()
        )}
      </button>
      <div className="flex flex-col gap-1.5">
        <span className="text-base-700 text-[13px] font-medium">Logo de l'entreprise</span>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Téléversement…' : shownUrl ? 'Changer le logo' : 'Téléverser'}
          </Button>
          <span className="text-base-500 text-[11px]">{hint}</span>
        </div>
        {error ? <span className="text-danger-700 text-[11px]">{error}</span> : null}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={onPickLogo}
      />
    </div>
  );
}
