/**
 * ImageUpload — photo de contact / produit (Epic 6, design v7 §PhotoUpload,
 * epic6-shell.jsx:270-325).
 *
 * Slot cliquable (cercle pour une personne, arrondi pour entreprise/produit) avec
 * badge caméra, bouton « Téléverser » + glisser-déposer. Aperçu local immédiat,
 * `POST ${API_URL}/files/image` (multipart, hors tRPC), puis `onUploaded(url)` —
 * l'appelant persiste l'URL via `trpc.contacts.update`/`catalogue.update`.
 */
import { useEffect, useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';

/** Base URL du Worker API — l'upload passe hors tRPC (multipart). */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9187';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const IMAGE_MAX_BYTES = 2_000_000;

function errorMessage(code: string | undefined): string {
  switch (code) {
    case 'NO_ACTIVE_ORG':
      return 'Aucune organisation active. Reconnectez-vous puis réessayez.';
    case 'UNAUTHORIZED':
      return 'Session expirée. Reconnectez-vous puis réessayez.';
    case 'INVALID_TYPE':
      return 'Format non supporté (JPG, PNG, WEBP).';
    case 'TOO_LARGE':
      return 'Fichier trop volumineux (2 Mo max).';
    case 'NO_FILE':
      return 'Aucun fichier reçu. Réessayez.';
    default:
      return 'Échec du téléversement. Réessayez.';
  }
}

export type ImageUploadProps = {
  /** URL déjà persistée (préchargée) — affichée tant qu'aucun nouvel upload. */
  value?: string | null;
  /** Callback après upload réussi (URL distante R2). */
  onUploaded: (url: string) => void;
  /** Dossier R2 de destination. */
  folder: 'contact-photos' | 'product-images' | 'user-avatars';
  shape?: 'circle' | 'rounded';
  size?: number;
  radius?: number;
  hint?: string;
  caption?: string;
  /** Contenu de remplacement quand il n'y a pas d'image (initiale, icône…). */
  fallback?: React.ReactNode;
};

export function ImageUpload({
  value,
  onUploaded,
  folder,
  shape = 'rounded',
  size = 96,
  radius = 16,
  hint = 'Photo',
  caption = 'JPG ou PNG · 2 Mo max',
  fallback,
}: ImageUploadProps) {
  const [remoteUrl, setRemoteUrl] = useState<string | null>(value ?? null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRemoteUrl(value ?? null);
  }, [value]);
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const shownUrl = localPreview ?? remoteUrl;
  const isCircle = shape === 'circle';

  async function handleFile(file: File) {
    setError(null);
    if (!IMAGE_TYPES.includes(file.type)) {
      setError(errorMessage('INVALID_TYPE'));
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setError(errorMessage('TOO_LARGE'));
      return;
    }
    const preview = URL.createObjectURL(file);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await fetch(`${API_URL}/files/image`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'upload_failed');
      }
      setRemoteUrl(data.url);
      onUploaded(data.url);
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err.message : undefined));
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setUploading(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void handleFile(file);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative shrink-0"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Choisir une image"
          style={{ width: size, height: size, borderRadius: isCircle ? 9999 : radius }}
          className={`bg-base-100 text-base-400 flex items-center justify-center overflow-hidden border-[0.5px] transition-colors ${
            dragOver ? 'border-brand-400' : 'border-border-subtle'
          }`}
        >
          {shownUrl ? (
            <img src={shownUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            (fallback ?? <Camera className="h-6 w-6" />)
          )}
        </button>
        <span className="border-card bg-base-900 text-base-25 pointer-events-none absolute -right-1.5 -bottom-1.5 inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border-[2.5px] shadow-sm">
          <Camera className="h-[15px] w-[15px]" />
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-base-900 text-[13.5px] font-medium">{hint}</div>
        <div className="text-base-500 mt-0.5 text-[12px] leading-snug">{caption}</div>
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="bg-base-50 text-base-800 border-border-default inline-flex items-center gap-1.5 rounded-[9px] border-[0.5px] px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-60"
          >
            <Upload className="text-base-600 h-3.5 w-3.5" />
            {uploading ? 'Téléversement…' : 'Téléverser'}
          </button>
          <span className="text-base-400 text-[12px]">ou glisser-déposer</span>
        </div>
        {error ? <div className="text-danger-700 mt-1.5 text-[11px]">{error}</div> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}
