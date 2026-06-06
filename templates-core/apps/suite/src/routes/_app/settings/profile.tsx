/**
 * /settings/profile — profil & compte de l'utilisateur connecté (Story 3.24).
 *
 * Self-service : photo (avatar R2), nom, langue préférée, email (changement avec
 * confirmation), mot de passe (ou variante OAuth si pas de provider credential).
 * Données via Better-Auth (`authClient.getSession`/`updateUser`/`changeEmail`/
 * `changePassword`/`listAccounts`) — pas de tRPC. Design : bundle « Mon Profil »
 * (`settings-account.jsx`). Pattern Settings calqué sur `organization.tsx`.
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Check, Lock, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@__SCOPE__/ui/button';
import { Input } from '@__SCOPE__/ui/input';
import { Label } from '@__SCOPE__/ui/label';
import { Badge } from '@__SCOPE__/ui/badge';
import { Skeleton } from '@__SCOPE__/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@__SCOPE__/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@__SCOPE__/ui/select';
import {
  FormRow,
  SaveSuccessBanner,
  SectionCard,
  SettingsPageHeader,
} from '../../../components/settings-page';
import { ImageUpload } from '../../../components/image-upload';
import { authClient } from '../../../lib/auth-client';

export const Route = createFileRoute('/_app/settings/profile')({ component: ProfilePage });

type Phase = 'loading' | 'ready' | 'error';

const LANGS = [
  { value: 'fr', label: 'Français (FR)' },
  { value: 'fr-af', label: 'Français (Afrique)' },
  { value: 'en', label: 'English' },
  { value: 'wo', label: 'Wolof' },
];

function ProfilePage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('fr');
  const [image, setImage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(true);
  const [hasPassword, setHasPassword] = useState(true);

  const [initialName, setInitialName] = useState('');
  const [initialLang, setInitialLang] = useState('fr');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [{ data: session }, accounts] = await Promise.all([
        authClient.getSession(),
        authClient.listAccounts().catch(() => ({ data: null })),
      ]);
      if (!session?.user) throw new Error('Session expirée. Reconnectez-vous.');
      const u = session.user;
      setName(u.name);
      setInitialName(u.name);
      setLanguage(u.language ?? 'fr');
      setInitialLang(u.language ?? 'fr');
      setImage(u.image ?? null);
      setEmail(u.email);
      setEmailVerified(u.emailVerified ?? false);
      const list = accounts.data ?? [];
      setHasPassword(list.length === 0 || list.some((a) => a.providerId === 'credential'));
      setPhase('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = name !== initialName || language !== initialLang;

  async function saveProfile() {
    if (!dirty || saving || name.trim() === '') return;
    setSaving(true);
    setError(null);
    try {
      const res = await authClient.updateUser({ name: name.trim(), language });
      if (res.error) throw new Error(res.error.message ?? 'Échec.');
      setInitialName(name.trim());
      setInitialLang(language);
      setSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarUploaded(url: string) {
    setImage(url);
    setSavedAt(null);
    await authClient.updateUser({ image: url }).catch(() => undefined);
  }

  if (phase === 'loading') {
    return (
      <div className="mx-auto w-full max-w-[1060px]">
        <SettingsPageHeader
          breadcrumbs={['Paramètres', 'Mon compte', 'Profil']}
          eyebrow="Mon compte"
          title="Votre"
          italic="profil."
          subtitle="Votre photo, votre nom et la façon dont vous vous connectez à __PROJECT_NAME__."
        />
        <div aria-busy="true" className="flex flex-col gap-5">
          {[180, 90, 130].map((w) => (
            <SectionCard key={w} padding={24}>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-4 h-16 w-full rounded-xl" />
            </SectionCard>
          ))}
        </div>
      </div>
    );
  }

  const initial = (name.trim()[0] ?? 'M').toUpperCase();

  return (
    <div className="mx-auto w-full max-w-[1060px]">
      <SettingsPageHeader
        breadcrumbs={['Paramètres', 'Mon compte', 'Profil']}
        eyebrow="Mon compte"
        title="Votre"
        italic="profil."
        subtitle="Votre photo, votre nom et la façon dont vous vous connectez à __PROJECT_NAME__."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={!dirty || saving}
              onClick={() => {
                setName(initialName);
                setLanguage(initialLang);
              }}
            >
              Annuler
            </Button>
            <Button size="sm" disabled={!dirty || saving} onClick={() => void saveProfile()}>
              <Check className="mr-1.5 h-4 w-4" /> Enregistrer
            </Button>
          </>
        }
      />

      {error ? (
        <div className="border-danger-200 bg-danger-50 text-danger-800 mb-4 rounded-xl border px-4 py-3 text-[13px]">
          {error}
        </div>
      ) : savedAt ? (
        <SaveSuccessBanner
          message={
            <>
              <strong>Profil enregistré.</strong>{' '}
              <span className="text-success-600">
                Vos modifications sont visibles immédiatement.
              </span>
            </>
          }
          whenAgo="à l'instant"
        />
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Colonne principale */}
        <div className="flex max-w-[720px] flex-col gap-5">
          <SectionCard
            title="Profil"
            description="Ces informations sont visibles par les membres de votre organisation."
            padding={24}
          >
            <div className="flex flex-col gap-6">
              <ImageUpload
                folder="user-avatars"
                shape="circle"
                size={96}
                hint="Photo de profil"
                caption="JPG ou PNG · 2 Mo max"
                value={image}
                fallback={initial}
                onUploaded={(url) => void onAvatarUploaded(url)}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormRow label="Nom" required helper="Affiché sur vos actions et commentaires.">
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSavedAt(null);
                    }}
                    placeholder="Votre nom complet"
                  />
                </FormRow>
                <FormRow label="Langue préférée" helper="Pour l'interface et les emails __PROJECT_NAME__.">
                  <Select
                    value={language}
                    onValueChange={(v) => {
                      setLanguage(v);
                      setSavedAt(null);
                    }}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
              </div>
            </div>
          </SectionCard>

          {/* Email */}
          <SectionCard
            title="Email"
            description="L'adresse utilisée pour vous connecter et recevoir les notifications de __PROJECT_NAME__."
            padding={24}
            action={
              <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
                <Mail className="mr-1.5 h-4 w-4" /> Changer d'email
              </Button>
            }
          >
            <div className="border-border-subtle bg-base-25 flex items-center justify-between gap-4 rounded-xl border-[0.5px] px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] ${emailVerified ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'}`}
                >
                  <Mail className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <div className="text-base-900 truncate font-mono text-[14px]">{email}</div>
                  <div className="text-base-500 mt-0.5 text-[12px]">Adresse de connexion</div>
                </div>
              </div>
              {emailVerified ? (
                <Badge variant="paid">Vérifié</Badge>
              ) : (
                <Badge variant="pending">Non vérifié</Badge>
              )}
            </div>
            {emailNotice ? (
              <div className="bg-brand-50 border-brand-200 text-brand-800 mt-3 rounded-xl border-[0.5px] px-3.5 py-3 text-[12px] leading-[1.5]">
                {emailNotice}
              </div>
            ) : null}
            {!emailVerified ? (
              <div className="bg-warning-50 border-warning-200 mt-3 flex items-center gap-3 rounded-xl border-[0.5px] px-3.5 py-3">
                <span className="text-warning-600 flex-1 text-[12px] leading-[1.5]">
                  Votre adresse n'est pas vérifiée. Vérifiez votre boîte de réception.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-warning-600"
                  onClick={() =>
                    void authClient.emailOtp
                      .sendVerificationOtp({ email, type: 'email-verification' })
                      .then(() =>
                        setEmailNotice(`Un code de vérification a été renvoyé à ${email}.`),
                      )
                  }
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Renvoyer
                </Button>
              </div>
            ) : null}
          </SectionCard>

          {/* Mot de passe / OAuth */}
          {hasPassword ? (
            <PasswordCard onError={setError} />
          ) : (
            <SectionCard
              title="Mot de passe"
              description="La connexion de votre compte est gérée par un fournisseur externe."
              padding={24}
            >
              <div className="border-border-subtle bg-base-25 flex items-center gap-4 rounded-xl border-[0.5px] px-4 py-4">
                <span className="bg-card border-border inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border-[0.5px]">
                  <ShieldCheck className="text-brand-600 h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-base-900 text-[14px] font-medium">
                    Connexion via un fournisseur externe.
                  </div>
                  <p className="text-base-600 m-0 mt-1 text-[12px] leading-[1.5]">
                    Votre mot de passe est géré par votre fournisseur (Google / Microsoft). Pour le
                    modifier, rendez-vous dans votre compte fournisseur.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Aside */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
          <SectionCard
            title="Aperçu"
            description="Comment vous apparaissez à votre équipe."
            padding={20}
          >
            <div className="border-border-subtle bg-base-25 flex items-center gap-3 rounded-[14px] border-[0.5px] p-4">
              <span className="bg-brand-100 text-base-900 font-display inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-medium">
                {image ? (
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <div className="min-w-0">
                <div className="text-base-900 truncate text-[14px] font-medium">{name || '—'}</div>
                <div className="text-base-500 truncate text-[12px]">{email}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {emailVerified ? (
                <Badge variant="paid">Email vérifié</Badge>
              ) : (
                <Badge variant="pending">Email non vérifié</Badge>
              )}
            </div>
          </SectionCard>

          <SectionCard padding={18}>
            <div className="flex items-start gap-3">
              <span className="bg-brand-50 text-brand-700 inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]">
                <ShieldCheck className="h-[17px] w-[17px]" />
              </span>
              <div className="min-w-0">
                <div className="text-base-900 text-[13px] font-medium">Sécurité du compte</div>
                <p className="text-base-600 m-0 mt-1 mb-2 text-[12px] leading-[1.5]">
                  Double authentification et sessions actives.
                </p>
                <Link
                  to="/settings/security/2fa"
                  className="text-brand-700 hover:text-brand-800 inline-flex items-center gap-1 text-[12.5px] font-medium"
                >
                  Gérer la sécurité →
                </Link>
              </div>
            </div>
          </SectionCard>
        </aside>
      </div>

      <EmailChangeDialog
        open={emailDialogOpen}
        currentEmail={email}
        onOpenChange={setEmailDialogOpen}
        onSent={(msg) => setEmailNotice(msg)}
      />
    </div>
  );
}

/* ─── Carte mot de passe ──────────────────────────────────────────────────── */

function scorePw(v: string): number {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 12) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return Math.min(4, s);
}

function StrengthMeter({ value }: { value: string }) {
  const score = scorePw(value);
  const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
  const fill = [
    'bg-base-200',
    'bg-danger-400',
    'bg-warning-400',
    'bg-success-400',
    'bg-success-600',
  ][score];
  return (
    <div className="mt-2 flex items-center gap-2.5">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? fill : 'bg-base-100'}`}
          />
        ))}
      </div>
      <span className="text-base-500 min-w-[38px] text-[11px]">{value ? labels[score] : ''}</span>
    </div>
  );
}

function PasswordCard({ onError }: { onError: (msg: string | null) => void }) {
  const [cur, setCur] = useState('');
  const [npw, setNpw] = useState('');
  const [cpw, setCpw] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const mismatch = cpw.length > 0 && cpw !== npw;
  const ready = Boolean(cur) && npw.length >= 12 && cpw === npw && cpw.length > 0;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setLocalError(null);
    onError(null);
    try {
      const res = await authClient.changePassword({
        currentPassword: cur,
        newPassword: npw,
        revokeOtherSessions: true,
      });
      if (res.error) throw new Error(res.error.message ?? 'Échec.');
      setCur('');
      setNpw('');
      setCpw('');
      setDone(true);
    } catch (err) {
      setLocalError(
        err instanceof Error && /password|incorrect|invalid/i.test(err.message)
          ? 'Mot de passe actuel incorrect.'
          : 'Impossible de mettre à jour le mot de passe.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard
      title="Mot de passe"
      description="Choisissez un mot de passe d'au moins 12 caractères, unique à __PROJECT_NAME__."
      padding={24}
    >
      <div className="flex flex-col gap-[18px]">
        {done ? (
          <div className="border-success-200 bg-success-50 text-success-800 rounded-xl border-[0.5px] px-3.5 py-3 text-[13px]">
            Mot de passe mis à jour. Les autres appareils ont été déconnectés.
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label className="text-base-700 text-[13px] font-medium">Mot de passe actuel</Label>
          <Input
            type="password"
            value={cur}
            onChange={(e) => {
              setCur(e.target.value);
              setDone(false);
            }}
            placeholder="••••••••"
          />
          {localError ? <p className="text-danger-700 text-[11px]">{localError}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 sm:items-start">
          <div className="flex flex-col gap-1.5">
            <Label className="text-base-700 text-[13px] font-medium">Nouveau mot de passe</Label>
            <Input
              type="password"
              value={npw}
              onChange={(e) => setNpw(e.target.value)}
              placeholder="12 caractères minimum"
            />
            <StrengthMeter value={npw} />
            <p className="text-base-500 text-[11px]">
              {npw && npw.length < 12
                ? `Encore ${12 - npw.length} caractère(s).`
                : '12 caractères minimum.'}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-base-700 text-[13px] font-medium">
              Confirmer le nouveau mot de passe
            </Label>
            <Input
              type="password"
              value={cpw}
              onChange={(e) => setCpw(e.target.value)}
              placeholder="••••••••"
            />
            {mismatch ? (
              <p className="text-danger-700 text-[11px]">Les mots de passe ne correspondent pas.</p>
            ) : null}
          </div>
        </div>
        <div className="flex justify-end pt-0.5">
          <Button size="sm" disabled={!ready || busy} onClick={() => void submit()}>
            <Lock className="mr-1.5 h-4 w-4" /> Mettre à jour le mot de passe
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Dialog changement d'email ───────────────────────────────────────────── */

function EmailChangeDialog({
  open,
  currentEmail,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  currentEmail: string;
  onOpenChange: (open: boolean) => void;
  onSent: (message: string) => void;
}) {
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mismatch = confirm.length > 0 && confirm !== next;
  const ready = Boolean(next) && next === confirm;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.changeEmail({ newEmail: next.trim() });
      if (res.error) throw new Error(res.error.message ?? 'Échec.');
      onSent(
        `Un email de confirmation a été envoyé à votre adresse actuelle (${currentEmail}). Le changement vers ${next.trim()} sera effectif après validation.`,
      );
      onOpenChange(false);
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de changer l’email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span className="bg-brand-100 text-brand-700 inline-flex h-8 w-8 items-center justify-center rounded-[10px]">
              <Mail className="h-4 w-4" />
            </span>
            Changer d'email
          </DialogTitle>
          <DialogDescription>
            Saisissez votre nouvelle adresse. Elle remplacera votre email de connexion une fois le
            changement confirmé.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="border-border-subtle bg-base-25 flex items-center gap-2.5 rounded-xl border-[0.5px] px-3.5 py-2.5">
            <span className="text-base-500 text-[12px]">Email actuel</span>
            <span className="text-base-800 font-mono text-[13px]">{currentEmail}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-base-700 text-[13px] font-medium">Nouvel email</Label>
            <Input
              type="email"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="vous@exemple.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-base-700 text-[13px] font-medium">
              Confirmer le nouvel email
            </Label>
            <Input
              type="email"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="vous@exemple.com"
            />
            {mismatch ? (
              <p className="text-danger-700 text-[11px]">Les adresses ne correspondent pas.</p>
            ) : null}
          </div>
          <div className="bg-brand-50 border-brand-200 text-brand-800 flex items-start gap-2.5 rounded-xl border-[0.5px] px-3.5 py-3 text-[12px] leading-[1.5]">
            Un email de confirmation sera envoyé à votre adresse actuelle ; le changement prend
            effet après validation.
          </div>
          {error ? <p className="text-danger-700 text-[12px]">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button disabled={!ready || busy} onClick={() => void submit()}>
            <Mail className="mr-1.5 h-4 w-4" /> Envoyer le lien
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
