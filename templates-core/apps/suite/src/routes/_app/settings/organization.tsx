/**
 * /settings/organization — profil de l'organisation (Story 3.17).
 *
 * Affiche et édite l'intégralité du profil entreprise collecté au Step 1 de
 * l'onboarding (raison sociale, sigle, NINEA/RCCM, secteur, taille, adresse,
 * ville, NIF, pays, devise) + le nom d'affichage et le slug URL.
 *
 * Backend : `trpc.organization.get/update` — la mutation accepte désormais
 * tous les champs et les persiste dans `organizations.*` (migration 0010).
 * Permissions : `identity:organization:update` (owner uniquement).
 *
 * Notifications (email/sms/whatsapp/push) et rapport quotidien (Step 7
 * onboarding) sont gérés ailleurs — futur /settings/notifications.
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { Button } from '@__SCOPE__/ui/button';
import { Input } from '@__SCOPE__/ui/input';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';
import { Skeleton } from '@__SCOPE__/ui/skeleton';
import { LogoUpload } from '../../../components/logo-upload';
import {
  FormRow,
  SaveSuccessBanner,
  SectionCard,
  SettingsPageHeader,
} from '../../../components/settings-page';
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  legalIdHelper,
  legalIdMeta,
  SECTOR_OPTIONS,
  SIZE_OPTIONS,
} from '../../../lib/org-enums-labels';
import { trpc } from '../../../lib/trpc-client';

export const Route = createFileRoute('/_app/settings/organization')({ component: OrgPage });

type Phase = 'loading' | 'ready' | 'error';

interface FormState {
  name: string;
  slug: string;
  country: string;
  currency: string;
  legalName: string;
  tradeName: string;
  legalId: string;
  sector: string;
  size: string;
  address: string;
  city: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  country: 'SN',
  currency: 'XOF',
  legalName: '',
  tradeName: '',
  legalId: '',
  sector: 'commerce',
  size: 'tpe',
  address: '',
  city: '',
};

const SELECT_CLASS = 'border-border bg-card h-10 w-full rounded-[12px] border px-3 text-sm';

function OrgPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [initial, setInitial] = useState<FormState | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const org = await trpc.organization.get.query();
      const next: FormState = {
        name: org.name,
        slug: org.slug,
        country: org.country,
        currency: org.currency,
        legalName: org.legalName ?? '',
        tradeName: org.tradeName ?? '',
        legalId: org.legalId ?? '',
        sector: org.sector ?? 'commerce',
        size: org.size ?? 'tpe',
        address: org.address ?? '',
        city: org.city ?? '',
      };
      setForm(next);
      setInitial(next);
      setLogo(org.logo ?? null);
      setPhase('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty =
    initial !== null &&
    (Object.keys(form) as Array<keyof FormState>).some((k) => form[k] !== initial[k]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      await trpc.organization.update.mutate({
        name: form.name.trim(),
        slug: form.slug.trim(),
        country: form.country as 'SN',
        currency: form.currency as 'XOF',
        legalName: form.legalName.trim(),
        tradeName: form.tradeName.trim() ? form.tradeName.trim() : null,
        legalId: form.legalId.trim(),
        sector: form.sector as 'commerce',
        size: form.size as 'tpe',
        address: form.address.trim(),
        city: form.city.trim(),
      });
      setInitial(form);
      setSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    if (initial) setForm(initial);
  }

  return (
    <div>
      <SettingsPageHeader
        breadcrumbs={['Paramètres', 'Organisation', 'Profil']}
        eyebrow="Organisation"
        title="Le profil"
        italic="qui vous représente."
        subtitle="Ces informations apparaissent sur vos factures, vos relances et l'espace client. Mises à jour immédiatement."
        actions={
          phase === 'ready' ? (
            <>
              <Button variant="ghost" size="sm" onClick={cancel} disabled={!dirty || saving}>
                Annuler
              </Button>
              <LoadingButton
                type="button"
                size="sm"
                loading={saving}
                disabled={!dirty || saving}
                onClick={(e) => void onSubmit(e)}
              >
                Enregistrer
              </LoadingButton>
            </>
          ) : null
        }
      />

      {savedAt && !dirty ? (
        <SaveSuccessBanner
          whenAgo={`à ${savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
        />
      ) : null}

      {phase === 'loading' ? (
        <OrgPageSkeleton />
      ) : phase === 'error' ? (
        <p className="text-brique-700 text-sm">{error}</p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]"
        >
          {/* Colonne principale : 4 SectionCards */}
          <div className="flex flex-col gap-5">
            <SectionCard
              title="Identité légale"
              description="Raison sociale et identifiant officiel — apparaissent sur vos factures, devis et déclarations OHADA."
            >
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
                <FormRow label="Raison sociale" required>
                  <Input
                    value={form.legalName}
                    onChange={(e) => setForm((s) => ({ ...s, legalName: e.target.value }))}
                    placeholder="Distribution YK SARL"
                    required
                    minLength={2}
                    maxLength={200}
                  />
                </FormRow>
                <FormRow
                  label={legalIdMeta(form.country).label}
                  required
                  helper={legalIdHelper(form.country)}
                >
                  <Input
                    value={form.legalId}
                    onChange={(e) => setForm((s) => ({ ...s, legalId: e.target.value }))}
                    placeholder={legalIdMeta(form.country).placeholder}
                    required
                    minLength={5}
                    maxLength={80}
                  />
                </FormRow>
              </div>
            </SectionCard>

            <SectionCard
              title="Identité commerciale & URL"
              description="Le nom et l'identifiant tels qu'ils apparaissent à vos clients et dans l'URL de votre espace."
            >
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
                <FormRow
                  label="Nom affiché"
                  required
                  helper="Nom court affiché dans l'app et les emails — différent de la raison sociale."
                >
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Distribution YK"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </FormRow>
                <FormRow
                  label="Sigle commercial"
                  helper="Sigle apparaissant en pied de facture (facultatif)."
                >
                  <Input
                    value={form.tradeName}
                    onChange={(e) => setForm((s) => ({ ...s, tradeName: e.target.value }))}
                    placeholder="DYK"
                    maxLength={80}
                  />
                </FormRow>
                <FormRow
                  label="Identifiant URL"
                  required
                  helper="Visible dans l'adresse de votre espace __PROJECT_NAME__."
                  span={2}
                >
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value.toLowerCase() }))}
                    placeholder="diop-consulting"
                    pattern="^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
                    required
                    minLength={2}
                    maxLength={60}
                  />
                </FormRow>
              </div>
            </SectionCard>

            <SectionCard
              title="Localisation"
              description="Pays du siège, adresse complète — utilisée sur vos documents et pour la fiscalité par défaut."
            >
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
                <FormRow label="Pays" required>
                  <select
                    value={form.country}
                    onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
                    className={SELECT_CLASS}
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="Ville" required>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                    placeholder="Abidjan"
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </FormRow>
                <FormRow label="Adresse" required span={2}>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                    placeholder="Rue des Jardins, Cocody"
                    required
                    minLength={3}
                    maxLength={200}
                  />
                </FormRow>
              </div>
            </SectionCard>

            <SectionCard
              title="Activité & devise"
              description="Secteur, taille et devise principale — détermine le format des montants affichés."
            >
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
                <FormRow label="Secteur d'activité" required>
                  <select
                    value={form.sector}
                    onChange={(e) => setForm((s) => ({ ...s, sector: e.target.value }))}
                    className={SELECT_CLASS}
                  >
                    {SECTOR_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="Taille de l'entreprise" required>
                  <select
                    value={form.size}
                    onChange={(e) => setForm((s) => ({ ...s, size: e.target.value }))}
                    className={SELECT_CLASS}
                  >
                    {SIZE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label} — {s.description}
                      </option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="Devise" required helper="Format : 145 000 FCFA.">
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))}
                    className={SELECT_CLASS}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </FormRow>
              </div>
            </SectionCard>

            {error ? <p className="text-brique-700 text-sm">{error}</p> : null}
          </div>

          {/* Aside : logo + zone danger */}
          <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
            <SectionCard
              title="Logo"
              description="PNG ou SVG, format carré, fond transparent. 1 Mo max."
              padding={20}
            >
              <LogoUpload
                initialUrl={logo}
                fallbackInitial={form.name.charAt(0) || form.legalName.charAt(0) || 'B'}
                hint="PNG ou SVG, format carré, fond transparent. 1 Mo max."
                onUploaded={setLogo}
              />
            </SectionCard>

            <SectionCard
              title="Zone sensible"
              description="Actions destructrices — utilisez avec précaution."
              padding={20}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-brique-700 hover:text-brique-900 hover:bg-brique-50 w-full justify-start"
                disabled
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer l'organisation
              </Button>
            </SectionCard>
          </aside>
        </form>
      )}
    </div>
  );
}

/* ─── OrgPageSkeleton ───────────────────────────────────────────────────── */

function OrgPageSkeleton() {
  return (
    <div
      className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]"
      aria-busy="true"
      aria-label="Chargement du profil de l'organisation"
    >
      <div className="flex flex-col gap-5">
        <SectionCard
          title="Identité légale"
          description="Raison sociale et identifiant officiel — apparaissent sur vos factures, devis et déclarations OHADA."
        >
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton withHelper />
          </div>
        </SectionCard>

        <SectionCard
          title="Identité commerciale & URL"
          description="Le nom et l'identifiant tels qu'ils apparaissent à vos clients et dans l'URL de votre espace."
        >
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
            <FieldSkeleton withHelper />
            <FieldSkeleton withHelper />
            <div className="sm:col-span-2">
              <FieldSkeleton withHelper />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Localisation"
          description="Pays du siège, adresse complète — utilisée sur vos documents et pour la fiscalité par défaut."
        >
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="sm:col-span-2">
              <FieldSkeleton />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Activité & devise"
          description="Secteur, taille et devise principale — détermine le format des montants affichés."
        >
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton withHelper />
          </div>
        </SectionCard>
      </div>

      <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
        <SectionCard
          title="Logo"
          description="PNG ou SVG, format carré, fond transparent. 1 Mo max."
          padding={20}
        >
          <div className="flex items-center gap-4">
            <Skeleton className="h-[100px] w-[100px] shrink-0 rounded-[22px]" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-9 w-full rounded-[10px]" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Zone sensible"
          description="Actions destructrices — utilisez avec précaution."
          padding={20}
        >
          <Skeleton className="h-9 w-full rounded-[10px]" />
        </SectionCard>
      </aside>
    </div>
  );
}

function FieldSkeleton({ withHelper }: { withHelper?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-[13px] w-24" />
      <Skeleton className="h-10 w-full rounded-[12px]" />
      {withHelper ? <Skeleton className="h-[11px] w-2/3" /> : null}
    </div>
  );
}
