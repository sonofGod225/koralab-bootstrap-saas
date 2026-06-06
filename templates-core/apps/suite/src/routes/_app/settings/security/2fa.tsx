/**
 * /settings/security/2fa — double authentification (Stories 3.5 + 3.17).
 *
 * Refonte pixel-perfect sur le bundle Claude Design "__PROJECT_NAME__ shadcn Canvas"
 * (`settings-security.jsx`, ll. 1-466) — vues **Desktop + Mobile** conformes
 * au design (clair / sombre via tokens DS automatiques).
 *
 * Composition (top-down) :
 *  - `<TwoFAStatusCard>` : card horizontal success (activé) vs base (off),
 *    icône 48×48 + titre + Badge/StatusDot + description + Switch.
 *  - `<TwoFAActivationFlow>` : SectionCard avec Steps indicator visuel + grid
 *    `lg:grid-cols-[200px_1fr]` (QR + clé manuelle à gauche, OTP à droite).
 *    Pas de wizard step-by-step — QR et OTP visibles simultanément.
 *  - `<RecoveryCodesCard>` : grid 5-cols avec numéros 01-10 + alert warning-50.
 *  - `<EnablePasswordDialog>` / `<DisableConfirmDialog>` : modals password.
 *  - `<OwnerPolicyCard>` : info SectionCard "2FA obligatoire pour Propriétaires".
 *  - `<MobileTwoFAView>` : layout cards stackées sous md (768px).
 *
 * Backend câblage Better-Auth (`packages/auth/src/auth.ts`) :
 *  - `twoFactor.enable({password})` → `{totpURI, backupCodes}` (génère secret)
 *  - `twoFactor.verifyTotp({code})` → finalise activation (twoFactorEnabled=true)
 *  - `twoFactor.disable({password})` → désactive (twoFactorEnabled=false)
 *
 * Audit log (Story 3.12) : hook `databaseHooks.user.update` détecte le delta
 * `twoFactorEnabled` et insère `user.twoFactor_enabled` / `_disabled` dans
 * `audit_log` automatiquement. Visible dans `/settings/audit-log`.
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangle, Check, Copy, Download, Info, Key, Shield, ShieldCheck } from 'lucide-react';
import { Badge } from '@__SCOPE__/ui/badge';
import { Button } from '@__SCOPE__/ui/button';
import { Input } from '@__SCOPE__/ui/input';
import { Label } from '@__SCOPE__/ui/label';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { Skeleton } from '@__SCOPE__/ui/skeleton';
import { Switch } from '@__SCOPE__/ui/switch';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@__SCOPE__/ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@__SCOPE__/ui/dialog';
import { SectionCard, SettingsPageHeader } from '../../../../components/settings-page';
import { authClient } from '../../../../lib/auth-client';

export const Route = createFileRoute('/_app/settings/security/2fa')({ component: TwoFactorPage });

type Phase = 'loading' | 'off' | 'enrolling' | 'on';

/** Extrait le secret TOTP brut de l'URI `otpauth://…?secret=…`, formaté en
 * blocs de 5 caractères séparés par des espaces (lisibilité saisie manuelle). */
function extractSecret(uri: string): string {
  const raw = /[?&]secret=([^&]+)/i.exec(uri)?.[1] ?? '';
  return raw.match(/.{1,5}/g)?.join(' ') ?? raw;
}

/* ─── TwoFAStatusCard ────────────────────────────────────────────────────── */

function TwoFAStatusCard({
  enabled,
  pending,
  onToggle,
}: {
  enabled: boolean;
  /** En cours d'enrôlement — switch visuellement à OFF mais désactivé. */
  pending?: boolean;
  onToggle: (on: boolean) => void;
}) {
  if (enabled) {
    return (
      <div className="bg-success-50 border-success-200 flex items-center gap-4 rounded-[16px] border p-5 sm:gap-5">
        <span className="bg-success-200 text-success-800 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base-900 text-[15px] font-medium">Double authentification</span>
            <span className="bg-success-400 inline-block h-1.5 w-1.5 rounded-full" aria-hidden />
            <span className="text-success-800 text-xs font-medium">Active</span>
          </div>
          <p className="text-base-700 mt-1 text-[13px] leading-[1.5]">
            Application configurée. Un code à 6 chiffres est demandé à chaque connexion.
          </p>
        </div>
        <Switch checked onCheckedChange={onToggle} />
      </div>
    );
  }
  return (
    <div className="bg-card border-border flex items-center gap-4 rounded-[16px] border p-5 sm:gap-5">
      <span className="bg-base-100 text-base-700 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]">
        <Shield className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base-900 text-[15px] font-medium">Double authentification</span>
          <Badge variant="pending">{pending ? 'En cours de configuration' : 'Désactivée'}</Badge>
        </div>
        <p className="text-base-600 mt-1 text-[13px] leading-[1.5]">
          Renforcez la sécurité de votre compte en exigeant un code à 6 chiffres à chaque connexion.
        </p>
      </div>
      <Switch checked={false} disabled={pending} onCheckedChange={onToggle} />
    </div>
  );
}

/* ─── StepsIndicator (visuel pur, pas de navigation) ────────────────────── */

const ACTIVATION_STEPS = ['Scanner', 'Confirmer', 'Sauvegarder'] as const;

function StepsIndicator({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="mb-6 flex items-center gap-2">
      {ACTIVATION_STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2 last:flex-initial">
          <span
            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${
              i <= current ? 'bg-base-900 text-base-100' : 'bg-base-100 text-base-600'
            }`}
          >
            {i + 1}
          </span>
          <span
            className={`text-xs ${i <= current ? 'text-base-900 font-medium' : 'text-base-500'}`}
          >
            {label}
          </span>
          {i < ACTIVATION_STEPS.length - 1 ? (
            <span className="bg-base-200 h-px flex-1" aria-hidden />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/* ─── TwoFAActivationFlow ────────────────────────────────────────────────── */

function TwoFAActivationFlow({
  totpURI,
  code,
  setCode,
  busy,
  error,
  onCancel,
  onVerify,
}: {
  totpURI: string;
  code: string;
  setCode: (v: string) => void;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onVerify: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const secret = extractSecret(totpURI);

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret.replace(/\s/g, ''));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard inaccessible — silencieux */
    }
  }

  return (
    <SectionCard
      title="Configurer la double authentification"
      description="Trois étapes : scannez le QR code, saisissez le code à 6 chiffres généré par votre application, puis sauvegardez vos codes de récupération."
    >
      <StepsIndicator current={1} />

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[200px_1fr]">
        {/* QR + caption — colonne gauche desktop, au-dessus mobile */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-card border-border rounded-[14px] border p-2.5">
            <QRCodeSVG
              value={totpURI}
              size={168}
              fgColor="var(--color-base-900)"
              bgColor="transparent"
              level="M"
            />
          </div>
          <p className="text-base-500 max-w-[180px] text-center text-[11px]">
            Compatible Google Authenticator, 1Password, Authy, Bitwarden.
          </p>
        </div>

        {/* Instructions + clé + OTP — colonne droite desktop */}
        <div className="min-w-0">
          <p className="text-base-500 mb-2 text-[11px] font-semibold tracking-[1.2px] uppercase">
            Étape 1 · Scannez le QR code
          </p>
          <p className="text-base-700 mb-3.5 text-[13px] leading-[1.5]">
            Ouvrez votre application d'authentification, ajoutez un nouveau compte et scannez
            l'image. Vous préférez le mode manuel&nbsp;?
          </p>

          {/* Clé manuelle — chip base-100 + copy button */}
          <div className="bg-base-100 mb-6 inline-flex max-w-full items-center gap-2 rounded-[10px] px-3 py-2">
            <Key className="text-base-700 h-3.5 w-3.5 shrink-0" />
            <code className="text-base-900 truncate font-mono text-xs font-medium tracking-[0.5px]">
              {secret}
            </code>
            <button
              type="button"
              onClick={() => void copySecret()}
              aria-label="Copier la clé"
              className="text-base-600 hover:text-base-900 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
            >
              {copied ? (
                <Check className="text-success-600 h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>

          <p className="text-base-500 mb-2.5 text-[11px] font-semibold tracking-[1.2px] uppercase">
            Étape 2 · Saisissez le code à 6 chiffres
          </p>
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-base-500 mt-2.5 mb-5 text-xs">
            Le code se renouvelle toutes les 30 secondes.
          </p>

          {error ? <p className="text-danger-700 mb-3 text-sm">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Annuler
            </Button>
            <LoadingButton
              type="button"
              size="sm"
              loading={busy}
              disabled={code.length !== 6}
              onClick={onVerify}
            >
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              Activer la 2FA
            </LoadingButton>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── RecoveryCodesCard ──────────────────────────────────────────────────── */

function RecoveryCodesCard({ codes, mobile = false }: { codes: string[]; mobile?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* silencieux */
    }
  }

  function downloadCodes() {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '__PROJECT_SLUG__-codes-recuperation.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (mobile) {
    // Variante mobile compacte — pas de grille de codes, juste counter + actions.
    return (
      <div className="bg-card border-border rounded-[16px] border p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="bg-brand-50 text-brand-700 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]">
            <Key className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-base-900 text-[13px] font-medium">Codes de récupération</div>
            <div className="text-base-500 text-[11px]">
              {codes.length} codes générés · 0 utilisé
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copyCodes()}
            className="flex-1"
          >
            {copied ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5" />
            )}
            {copied ? 'Copié' : 'Copier'}
          </Button>
          <Button type="button" size="sm" onClick={downloadCodes} className="flex-1">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Télécharger
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SectionCard
      title="Codes de récupération"
      description="Conservez ces codes en lieu sûr — ils permettent de récupérer votre compte si vous perdez votre téléphone. Chaque code n'est utilisable qu'une seule fois."
      action={
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void copyCodes()}>
            {copied ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5" />
            )}
            {copied ? 'Copié' : 'Copier'}
          </Button>
          <Button type="button" size="sm" onClick={downloadCodes}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Télécharger (.txt)
          </Button>
        </div>
      }
    >
      <div className="bg-base-50 border-border grid grid-cols-2 gap-2.5 rounded-[14px] border p-3 sm:grid-cols-3 sm:gap-3 sm:p-4 md:grid-cols-5">
        {codes.map((c, i) => (
          <div
            key={`${c}-${i}`}
            className="bg-card border-border text-base-900 relative rounded-[10px] border px-3 py-2.5 text-center font-mono text-[13px] tracking-[0.5px]"
          >
            <span className="text-base-400 absolute top-1 left-1.5 font-mono text-[9px]">
              {String(i + 1).padStart(2, '0')}
            </span>
            {c}
          </div>
        ))}
      </div>
      <div className="border-warning-200 bg-warning-50 mt-3.5 flex items-start gap-2.5 rounded-[12px] border p-3.5">
        <AlertTriangle className="text-warning-600 h-3.5 w-3.5 shrink-0" />
        <p className="text-warning-700 text-xs leading-[1.5]">
          Ces codes ne s'afficheront plus. Téléchargez-les ou imprimez-les maintenant.
        </p>
      </div>
    </SectionCard>
  );
}

/* ─── OwnerPolicyCard ─────────────────────────────────────────────────────── */

function OwnerPolicyCard() {
  return (
    <SectionCard padding={20}>
      <div className="flex items-center gap-3.5">
        <span className="bg-brand-50 text-brand-700 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]">
          <Info className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base-900 text-[13px] font-medium">
            2FA obligatoire pour les propriétaires
          </div>
          <p className="text-base-600 mt-1 text-xs leading-[1.5]">
            Toute personne avec le rôle <strong>Propriétaire</strong> doit activer la 2FA dans les
            7&nbsp;jours.
          </p>
        </div>
        <Badge variant="pending" className="shrink-0">
          Politique active
        </Badge>
      </div>
    </SectionCard>
  );
}

/* ─── EnablePasswordDialog ───────────────────────────────────────────────── */

function EnablePasswordDialog({
  open,
  onClose,
  password,
  setPassword,
  busy,
  error,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  password: string;
  setPassword: (v: string) => void;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span className="bg-brand-100 text-brand-700 inline-flex h-8 w-8 items-center justify-center rounded-[10px]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            Confirmez votre mot de passe
          </DialogTitle>
          <DialogDescription>
            Pour des raisons de sécurité, saisissez votre mot de passe avant d'activer la 2FA.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="twofa-pwd-enable">Mot de passe</Label>
          <Input
            id="twofa-pwd-enable"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-danger-700 text-sm">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <LoadingButton
            type="button"
            loading={busy}
            disabled={password.length < 1}
            onClick={onConfirm}
          >
            Continuer
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── DisableConfirmDialog ───────────────────────────────────────────────── */

function DisableConfirmDialog({
  open,
  onClose,
  password,
  setPassword,
  busy,
  error,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  password: string;
  setPassword: (v: string) => void;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span className="bg-danger-100 text-danger-700 inline-flex h-8 w-8 items-center justify-center rounded-[10px]">
              <AlertTriangle className="h-4 w-4" />
            </span>
            Désactiver la double authentification ?
          </DialogTitle>
          <DialogDescription>
            Votre compte ne sera plus protégé que par votre mot de passe. Nous vous le déconseillons
            fortement.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="twofa-pwd-disable">Confirmez avec votre mot de passe</Label>
          <Input
            id="twofa-pwd-disable"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-danger-700 text-sm">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Garder activée
          </Button>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={busy}
            disabled={password.length < 1}
            onClick={onConfirm}
          >
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Désactiver malgré tout
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── MobileTwoFAView ────────────────────────────────────────────────────── */

function MobileTwoFAView({
  phase,
  totpURI,
  code,
  setCode,
  backupCodes,
  justActivated,
  busy,
  error,
  onToggle,
  onVerify,
  onCancelEnroll,
}: {
  phase: Phase;
  totpURI: string;
  code: string;
  setCode: (v: string) => void;
  backupCodes: string[];
  justActivated: boolean;
  busy: boolean;
  error: string | null;
  onToggle: (on: boolean) => void;
  onVerify: () => void;
  onCancelEnroll: () => void;
}) {
  if (phase === 'loading') {
    return (
      <div
        className="md:hidden"
        aria-busy="true"
        aria-label="Chargement de la double authentification"
      >
        <TwoFAStatusCardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 md:hidden">
      <TwoFAStatusCard
        enabled={phase === 'on'}
        pending={phase === 'enrolling'}
        onToggle={onToggle}
      />

      {phase === 'enrolling' ? (
        <TwoFAActivationFlow
          totpURI={totpURI}
          code={code}
          setCode={setCode}
          busy={busy}
          error={error}
          onCancel={onCancelEnroll}
          onVerify={onVerify}
        />
      ) : null}

      {phase === 'on' && justActivated && backupCodes.length > 0 ? (
        <RecoveryCodesCard codes={backupCodes} mobile />
      ) : null}

      <OwnerPolicyCard />
    </div>
  );
}

/* ─── Orchestrateur TwoFactorPage ────────────────────────────────────────── */

function TwoFactorPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [totpUri, setTotpUri] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [justActivated, setJustActivated] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog mot de passe (activation ou désactivation).
  const [pwdDialog, setPwdDialog] = useState<'none' | 'enable' | 'disable'>('none');
  const [password, setPassword] = useState('');

  const load = useCallback(async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      window.location.assign('/signin');
      return;
    }
    setPhase(session.data.user.twoFactorEnabled ? 'on' : 'off');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function closeDialog() {
    setPwdDialog('none');
    setPassword('');
    setError(null);
  }

  function onSwitchToggle(on: boolean) {
    if (phase === 'enrolling') return; // ignore pendant enroll
    setPwdDialog(on ? 'enable' : 'disable');
  }

  async function confirmEnable() {
    setError(null);
    setBusy(true);
    const { data, error: err } = await authClient.twoFactor.enable({ password });
    setBusy(false);
    if (err || !data) {
      setError(err?.message ?? 'Mot de passe incorrect.');
      return;
    }
    setTotpUri(data.totpURI);
    setBackupCodes(data.backupCodes);
    setPhase('enrolling');
    closeDialog();
  }

  async function confirmDisable() {
    setError(null);
    setBusy(true);
    const { error: err } = await authClient.twoFactor.disable({ password });
    setBusy(false);
    if (err) {
      setError(err.message ?? 'Mot de passe incorrect.');
      return;
    }
    setPhase('off');
    setBackupCodes([]);
    setJustActivated(false);
    closeDialog();
  }

  async function verifyEnroll() {
    setError(null);
    setBusy(true);
    const { error: err } = await authClient.twoFactor.verifyTotp({ code });
    setBusy(false);
    if (err) {
      setError(err.message ?? 'Code incorrect. Réessayez.');
      return;
    }
    setCode('');
    setPhase('on');
    setJustActivated(true);
  }

  function cancelEnroll() {
    // L'utilisateur abandonne l'enrôlement avant verify — on remet en `off`.
    // Note : Better-Auth ne propose pas d'endpoint « cancel enroll » ; le secret
    // généré reste en DB jusqu'au prochain enable() qui le remplace.
    setPhase('off');
    setCode('');
    setError(null);
    setTotpUri('');
    setBackupCodes([]);
  }

  return (
    <>
      <SettingsPageHeader
        breadcrumbs={['Paramètres', 'Sécurité', 'Double authentification']}
        eyebrow="Sécurité"
        title="Double authentification"
        italic="par défaut."
        subtitle="Une couche de protection supplémentaire en plus de votre mot de passe. Obligatoire pour les propriétaires d'organisation."
      />

      {/* Vue mobile (md:hidden) — cards stackées simplifiées */}
      <MobileTwoFAView
        phase={phase}
        totpURI={totpUri}
        code={code}
        setCode={setCode}
        backupCodes={backupCodes}
        justActivated={justActivated}
        busy={busy}
        error={error}
        onToggle={onSwitchToggle}
        onVerify={() => void verifyEnroll()}
        onCancelEnroll={cancelEnroll}
      />

      {/* Vue desktop (hidden md:flex) — layout combiné conforme au design */}
      <div
        className="hidden flex-col gap-5 md:flex"
        aria-busy={phase === 'loading' ? 'true' : undefined}
      >
        {phase === 'loading' ? (
          <TwoFAStatusCardSkeleton />
        ) : (
          <>
            <TwoFAStatusCard
              enabled={phase === 'on'}
              pending={phase === 'enrolling'}
              onToggle={onSwitchToggle}
            />

            {phase === 'enrolling' ? (
              <TwoFAActivationFlow
                totpURI={totpUri}
                code={code}
                setCode={setCode}
                busy={busy}
                error={error}
                onCancel={cancelEnroll}
                onVerify={() => void verifyEnroll()}
              />
            ) : null}

            {phase === 'on' && justActivated && backupCodes.length > 0 ? (
              <RecoveryCodesCard codes={backupCodes} />
            ) : null}

            <OwnerPolicyCard />
          </>
        )}
      </div>

      <EnablePasswordDialog
        open={pwdDialog === 'enable'}
        onClose={closeDialog}
        password={password}
        setPassword={setPassword}
        busy={busy}
        error={error}
        onConfirm={() => void confirmEnable()}
      />
      <DisableConfirmDialog
        open={pwdDialog === 'disable'}
        onClose={closeDialog}
        password={password}
        setPassword={setPassword}
        busy={busy}
        error={error}
        onConfirm={() => void confirmDisable()}
      />
    </>
  );
}

/* ─── TwoFAStatusCardSkeleton ────────────────────────────────────────────── */

function TwoFAStatusCardSkeleton() {
  return (
    <div className="bg-card border-border flex items-center gap-4 rounded-[16px] border p-5 sm:gap-5">
      <Skeleton className="h-12 w-12 shrink-0 rounded-[14px]" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-[15px] w-44" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-3 w-3/4" />
      </div>
      <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
    </div>
  );
}
