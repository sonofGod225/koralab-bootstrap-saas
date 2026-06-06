/**
 * Composants partagés des écrans d'authentification.
 *
 * Alignés pixel-perfect sur le bundle de design `__PROJECT_NAME__-Auth` :
 * coquille split-screen (`AuthLayout` + `MarketingSide`), en-tête de
 * formulaire, champ à icône, rangée OAuth, séparateur, jauge de mot de
 * passe et parcours OTP téléphone.
 */
import { Fragment, forwardRef, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@__SCOPE__/ui/button';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { Input } from '@__SCOPE__/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@__SCOPE__/ui/input-otp';
import { PhoneInput } from '@__SCOPE__/ui/phone-input';
import { Label } from '@__SCOPE__/ui/label';
import { authClient } from '../lib/auth-client';

/* ─── Titre éditorial ───────────────────────────────────────────────────── */

/**
 * Titre du panneau marketing — la portion encadrée par `*…*` est rendue en
 * italique Fraunces couleur Brand. Le retour à la ligne est forcé juste
 * avant cette portion (et non laissé à l'algorithme de césure), pour une
 * coupure nette entre la phrase et son emphase.
 */
function EditorialTitle({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  let breakInserted = false;
  return (
    <h2 className="text-foreground font-display text-[3rem] leading-[1.05] font-light tracking-[-1.4px]">
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          const withBreak = !breakInserted;
          breakInserted = true;
          return (
            <Fragment key={i}>
              {withBreak ? <br /> : null}
              <em className="text-brand-400 font-normal italic">{part.slice(1, -1)}</em>
            </Fragment>
          );
        }
        return <Fragment key={i}>{part.replace(/\s+$/, ' ')}</Fragment>;
      })}
    </h2>
  );
}

/* ─── Logo ──────────────────────────────────────────────────────────────── */

/** Marque __PROJECT_NAME__ — symbole 4 quadrants + nom (cf. `Logo` du design). */
export function AuthLogo() {
  return (
    <a href="/" className="inline-flex items-center gap-2.5" aria-label="__PROJECT_NAME__ — accueil">
      <svg viewBox="0 0 56 56" className="size-7" aria-hidden="true">
        <path d="M 8 28 L 8 18 Q 8 8 18 8 L 28 8 L 28 28 Z" fill="var(--color-base-900)" />
        <path d="M 30 28 L 30 8 L 48 8 Q 48 8 48 18 L 48 28 Z" fill="var(--color-base-900)" />
        <path d="M 8 30 L 28 30 L 28 48 L 18 48 Q 8 48 8 38 Z" fill="var(--color-base-900)" />
        <path d="M 30 30 L 48 30 L 48 38 Q 48 48 38 48 L 30 48 Z" fill="var(--color-brand-400)" />
      </svg>
      <span className="font-display text-base-900 text-xl font-medium tracking-[-0.8px]">
        __PROJECT_NAME__
      </span>
    </a>
  );
}

/* ─── AuthScreen — coquille split-screen ────────────────────────────────── */

export interface AuthMarketing {
  eyebrow: string;
  /** Titre éditorial — la portion entre `*…*` passe en italique Brand. */
  title: string;
  description: string;
  /** Chemin de l'illustration (servie depuis `public/`). */
  illustration: string;
}

/** Dégradé radial des « soleils » décoratifs du panneau marketing. */
const SUN = (stop: string) =>
  `radial-gradient(circle, var(--color-brand-200) 0%, transparent ${stop})`;

export function AuthScreen({
  marketing,
  children,
}: {
  marketing: AuthMarketing;
  children: ReactNode;
}) {
  return (
    <main className="bg-base-25 flex min-h-screen flex-col md:flex-row">
      {/* Panneau formulaire — logo en haut, contenu centré */}
      <div className="flex flex-1 flex-col px-6 py-10 sm:px-14">
        <AuthLogo />
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="animate-in fade-in-50 slide-in-from-bottom-2 w-full max-w-[380px] duration-300 ease-out">
            {children}
          </div>
        </div>
      </div>

      {/* Panneau marketing */}
      <aside className="bg-base-100 animate-in fade-in zoom-in-95 relative hidden flex-1 flex-col justify-between gap-10 overflow-hidden p-14 duration-500 ease-out md:flex">
        {/* Soleils décoratifs */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 size-[460px] rounded-full opacity-60"
          style={{ background: SUN('65%') }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 -left-44 size-[480px] rounded-full opacity-35"
          style={{ background: SUN('60%') }}
        />
        <div className="relative flex flex-col gap-5">
          <p className="text-brand-700 text-[11px] font-medium tracking-[1.6px] uppercase">
            {marketing.eyebrow}
          </p>
          <EditorialTitle text={marketing.title} />
          <p className="text-base-700 max-w-[480px] text-[1rem] leading-[1.55] text-pretty">
            {marketing.description}
          </p>
        </div>
        <img
          src={marketing.illustration}
          alt=""
          aria-hidden="true"
          className="relative mx-auto w-full max-w-[380px]"
        />
      </aside>
    </main>
  );
}

/* ─── En-tête de formulaire ─────────────────────────────────────────────── */

export function FormHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-base-900 font-display text-[2rem] leading-[1.05] font-light tracking-tighter sm:text-[2.25rem]">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-base-600 text-[0.875rem] leading-[1.55]">{subtitle}</p>
      ) : null}
    </header>
  );
}

/* ─── Champ à icône ─────────────────────────────────────────────────────── */

const FIELD_ICON = { mail: Mail, lock: Lock, user: User } satisfies Record<string, LucideIcon>;

export interface IconInputProps extends ComponentProps<'input'> {
  /** Icône affichée à gauche du champ. */
  icon?: keyof typeof FIELD_ICON;
}

/**
 * `Input` du design system enveloppé : icône à gauche, hauteur 46 px et —
 * pour les mots de passe — bascule afficher/masquer à droite.
 */
export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(function IconInput(
  { icon, type, className, ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const Leading = icon ? FIELD_ICON[icon] : null;
  return (
    <div className="relative">
      {Leading ? (
        <Leading className="text-base-500 pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
      ) : null}
      <Input
        ref={ref}
        type={isPassword && show ? 'text' : type}
        className={`h-[46px] ${Leading ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''} ${className ?? ''}`}
        {...props}
      />
      {isPassword ? (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-base-500 hover:text-base-700 absolute top-1/2 right-3 -translate-y-1/2"
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      ) : null}
    </div>
  );
});

/* ─── Rangée OAuth ──────────────────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8c1.8-4.3 6-7.5 11.1-7.5 3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.6 34.6 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5c-.4.4 6.3-4.6 6.3-15.1 0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

/**
 * Rangée OAuth — boutons natifs (rayon 12 px, comme le design ; les boutons
 * du design system sont en pilule, inadaptés ici).
 */
export function OAuthRow({ callbackURL }: { callbackURL: string }) {
  const [busy, setBusy] = useState(false);
  async function connect(provider: 'google' | 'microsoft') {
    setBusy(true);
    // Better-Auth résout les `callbackURL` relatifs contre `baseURL` (= API),
    // donc on force une URL absolue contre l'origin du front. L'origin est
    // dans `trustedOrigins` côté serveur (cf. packages/auth/src/auth.ts).
    const absoluteCallback = /^https?:\/\//.test(callbackURL)
      ? callbackURL
      : `${window.location.origin}${callbackURL}`;
    await authClient.signIn.social({ provider, callbackURL: absoluteCallback });
  }
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => connect('google')}
        className="border-border bg-card text-base-900 hover:bg-muted flex h-[46px] items-center justify-center gap-2.5 rounded-[12px] border text-sm font-medium transition-colors disabled:opacity-50"
      >
        <GoogleIcon />
        Google
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => connect('microsoft')}
        className="border-border bg-card text-base-900 hover:bg-muted flex h-[46px] items-center justify-center gap-2.5 rounded-[12px] border text-sm font-medium transition-colors disabled:opacity-50"
      >
        <MicrosoftIcon />
        Microsoft
      </button>
    </div>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="text-base-500 flex items-center gap-3">
      <span className="bg-base-200 h-px flex-1" />
      <span className="text-xs tracking-[0.3px]">{label}</span>
      <span className="bg-base-200 h-px flex-1" />
    </div>
  );
}

/* ─── Jauge de robustesse du mot de passe ───────────────────────────────── */

const PWD_CRITERIA = [
  { key: 'len', label: 'Au moins 8 caractères', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: 'Une lettre majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'digit', label: 'Un chiffre', test: (p: string) => /\d/.test(p) },
  { key: 'special', label: 'Un caractère spécial', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

const PWD_LABELS = ['Trop court', 'Faible', 'Moyen', 'Bon', 'Fort'];
const PWD_BAR = [
  'bg-base-200',
  'bg-danger-400',
  'bg-warning-400',
  'bg-success-400',
  'bg-success-600',
];

/** Indicateur de force du mot de passe + check-list des 4 critères. */
export function PasswordStrength({ password }: { password: string }) {
  const passed = PWD_CRITERIA.map((c) => c.test(password));
  const score = passed.filter(Boolean).length;
  const labelColor =
    score === 0
      ? 'text-base-500'
      : score <= 1
        ? 'text-danger-800'
        : score <= 2
          ? 'text-warning-600'
          : 'text-success-800';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-base-600">Force du mot de passe</span>
        <span className={labelColor}>{PWD_LABELS[score]}</span>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i < score ? PWD_BAR[score] : 'bg-base-200'}`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {PWD_CRITERIA.map((c, i) => (
          <li
            key={c.key}
            className={`flex items-center gap-1.5 text-xs ${passed[i] ? 'text-success-800' : 'text-base-500'}`}
          >
            <span
              className={`flex size-3.5 shrink-0 items-center justify-center rounded-full ${
                passed[i] ? 'bg-success-600' : 'bg-base-200'
              }`}
            >
              {passed[i] ? <Check className="size-2.5 text-white" strokeWidth={3} /> : null}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Saisie OTP 6 chiffres ─────────────────────────────────────────────── */

/** Champ OTP 6 cases (2 groupes de 3), aligné sur l'`OTPInput` du design. */
export function OtpField({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <InputOTP maxLength={6} value={value} onChange={onChange} autoFocus={autoFocus}>
      <InputOTPGroup>
        <InputOTPSlot index={0} className="h-14 w-12 rounded-[12px]" />
        <InputOTPSlot index={1} className="h-14 w-12 rounded-[12px]" />
        <InputOTPSlot index={2} className="h-14 w-12 rounded-[12px]" />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} className="h-14 w-12 rounded-[12px]" />
        <InputOTPSlot index={4} className="h-14 w-12 rounded-[12px]" />
        <InputOTPSlot index={5} className="h-14 w-12 rounded-[12px]" />
      </InputOTPGroup>
    </InputOTP>
  );
}

/* ─── Parcours OTP téléphone (2 étapes) ─────────────────────────────────── */

export function PhoneOtpForm({
  redirectTo,
  onBack,
  backLabel,
}: {
  redirectTo: string;
  onBack: () => void;
  backLabel: string;
}) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp() {
    setError(null);
    setBusy(true);
    const { error: err } = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
    setBusy(false);
    if (err) {
      setError(err.message ?? "Impossible d'envoyer le code. Vérifiez le numéro.");
      return;
    }
    setStep('otp');
  }

  async function verify() {
    setError(null);
    setBusy(true);
    const { error: err } = await authClient.phoneNumber.verify({ phoneNumber: phone, code });
    setBusy(false);
    if (err) {
      setError(err.message ?? 'Code incorrect ou expiré.');
      return;
    }
    window.location.assign(redirectTo);
  }

  return (
    <div className="flex flex-col gap-4">
      {step === 'phone' ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-phone">Numéro de téléphone</Label>
            <PhoneInput
              id="auth-phone"
              value={phone}
              onValueChange={setPhone}
              defaultCountry="SN"
            />
            <p className="text-base-500 text-xs">
              Un code de vérification à 6 chiffres vous sera envoyé par SMS.
            </p>
          </div>
          {error ? <p className="text-danger-700 text-sm">{error}</p> : null}
          <LoadingButton
            type="button"
            size="lg"
            loading={busy}
            disabled={phone.length < 8}
            className="w-full"
            onClick={sendOtp}
          >
            Recevoir le code
          </LoadingButton>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label>Code de vérification</Label>
            <OtpField value={code} onChange={setCode} autoFocus />
            <p className="text-base-500 text-xs">Code envoyé au {phone}.</p>
          </div>
          {error ? <p className="text-danger-700 text-sm">{error}</p> : null}
          <LoadingButton
            type="button"
            size="lg"
            loading={busy}
            disabled={code.length !== 6}
            className="w-full"
            onClick={verify}
          >
            Vérifier et continuer
          </LoadingButton>
        </>
      )}
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        {backLabel}
      </Button>
    </div>
  );
}
