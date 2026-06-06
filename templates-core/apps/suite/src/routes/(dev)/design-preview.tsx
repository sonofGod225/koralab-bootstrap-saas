/**
 * Route specimen design system Base & Brand — dev only (Story 2.14).
 *
 * Présente toutes les primitives @__SCOPE__/ui comme source de vérité visuelle.
 * URL en dev : http://localhost:3000/design-preview
 *
 * En production, la page retourne null (non destinée aux utilisateurs finaux).
 */

import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';

// Layout
import { Container } from '@__SCOPE__/ui/container';
import { Topbar } from '@__SCOPE__/ui/topbar';
import { PageHeader } from '@__SCOPE__/ui/page-header';
import {
  Sidebar,
  SidebarHeader,
  SidebarSection,
  SidebarItem,
  SidebarRail,
  NavIcon,
} from '@__SCOPE__/ui/sidebar';

// Primitives custom
import { PetalSymbol } from '@__SCOPE__/ui/petal-symbol';
import { MoneyDisplay } from '@__SCOPE__/ui/money-display';
import { KPI } from '@__SCOPE__/ui/kpi';
import { EditorialQuote } from '@__SCOPE__/ui/editorial-quote';
import { StatusDot } from '@__SCOPE__/ui/status-dot';

// Boutons
import { Button } from '@__SCOPE__/ui/button';
import { LoadingButton } from '@__SCOPE__/ui/loading-button';

// Badges & statuts
import { Badge } from '@__SCOPE__/ui/badge';
import { Trend } from '@__SCOPE__/ui/trend';

// Formulaires
import { Input } from '@__SCOPE__/ui/input';
import { Textarea } from '@__SCOPE__/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@__SCOPE__/ui/select';
import { Checkbox } from '@__SCOPE__/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@__SCOPE__/ui/radio-group';
import { Switch } from '@__SCOPE__/ui/switch';
import { Slider } from '@__SCOPE__/ui/slider';
import { Label } from '@__SCOPE__/ui/label';
import { Combobox } from '@__SCOPE__/ui/combobox';
import { MoneyInput } from '@__SCOPE__/ui/money-input';
import { DateInput } from '@__SCOPE__/ui/date-input';
import { PhoneInput } from '@__SCOPE__/ui/phone-input';
import { CountrySelect } from '@__SCOPE__/ui/country-select';

// Données
import { Card, CardContent, CardHeader, CardTitle } from '@__SCOPE__/ui/card';
import { StatCard } from '@__SCOPE__/ui/stat-card';
import { DataTable } from '@__SCOPE__/ui/data-table';
import { EmptyState } from '@__SCOPE__/ui/empty-state';
import { TableSkeleton } from '@__SCOPE__/ui/table-skeleton';
import { Progress } from '@__SCOPE__/ui/progress';
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup } from '@__SCOPE__/ui/avatar';

// Feedback
import { Alert, AlertTitle, AlertDescription } from '@__SCOPE__/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@__SCOPE__/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@__SCOPE__/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@__SCOPE__/ui/tooltip';
import { Toaster, toast } from '@__SCOPE__/ui/sonner';

// Navigation
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@__SCOPE__/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@__SCOPE__/ui/breadcrumb';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@__SCOPE__/ui/pagination';
import { Stepper } from '@__SCOPE__/ui/stepper';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@__SCOPE__/ui/accordion';

// Icônes Lucide
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  BarChart2,
  Settings,
  Moon,
  Sun,
  Bell,
  Plus,
} from 'lucide-react';

export const Route = createFileRoute('/(dev)/design-preview')({ component: DesignPreviewPage });

// ─── Palette nuanciers ──────────────────────────────────────────────────────

interface Swatch {
  name: string;
  hex: string;
  variable: string;
  textOnHex: string;
}

const PALETTE: Array<{ family: string; swatches: ReadonlyArray<Swatch> }> = [
  {
    family: 'Base',
    swatches: [
      { name: 'Base 25', hex: '#FCF7EE', variable: '--color-base-25', textOnHex: '#2A1A0F' },
      { name: 'Base 100', hex: '#F4E4CC', variable: '--color-base-100', textOnHex: '#2A1A0F' },
      { name: 'Base 300', hex: '#BFA378', variable: '--color-base-300', textOnHex: '#2A1A0F' },
      { name: 'Base 600', hex: '#6B4423', variable: '--color-base-600', textOnHex: '#FCF7EE' },
      { name: 'Base 900', hex: '#2A1A0F', variable: '--color-base-900', textOnHex: '#FCF7EE' },
    ],
  },
  {
    family: 'Brand (≤ 15% surface)',
    swatches: [
      { name: 'Brand 100', hex: '#FBE2BA', variable: '--color-brand-100', textOnHex: '#3D200A' },
      { name: 'Brand 200', hex: '#F5C994', variable: '--color-brand-200', textOnHex: '#3D200A' },
      { name: 'Brand 400', hex: '#E89B5A', variable: '--color-brand-400', textOnHex: '#2A1A0F' },
      { name: 'Brand 600', hex: '#B86A28', variable: '--color-brand-600', textOnHex: '#FCF7EE' },
    ],
  },
  {
    family: 'Success (success)',
    swatches: [
      {
        name: 'Success 200',
        hex: '#A8C083',
        variable: '--color-success-200',
        textOnHex: '#1A3010',
      },
      {
        name: 'Success 400',
        hex: '#6A9C42',
        variable: '--color-success-400',
        textOnHex: '#FCF7EE',
      },
      {
        name: 'Success 800',
        hex: '#2C4F1F',
        variable: '--color-success-800',
        textOnHex: '#FCF7EE',
      },
    ],
  },
  {
    family: 'Danger (danger)',
    swatches: [
      { name: 'Danger 200', hex: '#E6A084', variable: '--color-danger-200', textOnHex: '#4A180A' },
      { name: 'Danger 400', hex: '#D85F36', variable: '--color-danger-400', textOnHex: '#FCF7EE' },
      { name: 'Danger 800', hex: '#7A2A0E', variable: '--color-danger-800', textOnHex: '#FCF7EE' },
    ],
  },
  {
    family: 'Warning (warning)',
    swatches: [
      { name: 'Warning 200', hex: '#FFDF8C', variable: '--color-warning-200', textOnHex: '#2A1A0F' },
      { name: 'Warning 400', hex: '#EFC548', variable: '--color-warning-400', textOnHex: '#2A1A0F' },
      { name: 'Warning 600', hex: '#BD9420', variable: '--color-warning-600', textOnHex: '#FCF7EE' },
    ],
  },
];

const SEMANTIC_TOKENS = [
  { name: 'bg-background', label: 'background' },
  { name: 'bg-card', label: 'card' },
  { name: 'bg-muted', label: 'muted' },
  { name: 'bg-subtle', label: 'subtle' },
  { name: 'bg-primary', label: 'primary' },
  { name: 'bg-destructive', label: 'destructive' },
];

// ─── Données mockées ────────────────────────────────────────────────────────

interface Invoice {
  id: string;
  client: string;
  amount: bigint;
  status: 'paid' | 'pending' | 'late' | 'draft';
  date: string;
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'FAC-2024-001',
    client: 'Diallo Conseils SARL',
    amount: 875000n,
    status: 'paid',
    date: '12/03/2025',
  },
  {
    id: 'FAC-2024-002',
    client: 'Groupe Konaté BTP',
    amount: 2340000n,
    status: 'pending',
    date: '28/03/2025',
  },
  {
    id: 'FAC-2024-003',
    client: 'Mme Aïssatou Mbaye',
    amount: 145000n,
    status: 'late',
    date: '05/02/2025',
  },
  {
    id: 'FAC-2024-004',
    client: 'Orange CI Distribution',
    amount: 6500000n,
    status: 'draft',
    date: '15/04/2025',
  },
];

const INVOICE_COLUMNS: ColumnDef<Invoice>[] = [
  { accessorKey: 'id', header: 'Référence', enableSorting: true },
  { accessorKey: 'client', header: 'Client', enableSorting: true },
  {
    accessorKey: 'amount',
    header: 'Montant',
    meta: { type: 'money', currency: 'XOF' },
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => (
      <Badge variant={row.original.status}>{STATUS_LABELS[row.original.status]}</Badge>
    ),
  },
  { accessorKey: 'date', header: 'Date' },
];

const STATUS_LABELS: Record<Invoice['status'], string> = {
  paid: 'Payé',
  pending: 'En attente',
  late: 'En retard',
  draft: 'Brouillon',
};

const STEPPER_STEPS = [
  { label: 'Informations client', description: 'Nom, adresse, contacts' },
  { label: 'Détails facture', description: 'Lignes, TVA, remise' },
  { label: 'Mode de paiement', description: 'Wave, Paystack, virement' },
  { label: 'Confirmation', description: 'Vérification et envoi' },
];

// ─── SectionLabel helper ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-muted-foreground mb-6 text-xs font-semibold tracking-[1.4px] uppercase">
      {children}
    </h2>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────

function DesignPreviewPage() {
  if (import.meta.env.PROD) return null;

  // État toggle clair/sombre
  const [dark, setDark] = useState(false);
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // États formulaires
  const [moneyValue, setMoneyValue] = useState<bigint>(875000n);
  const [dateValue, setDateValue] = useState<Date | undefined>(undefined);
  const [phoneValue, setPhoneValue] = useState('');
  const [countryValue, setCountryValue] = useState('SN');
  const [comboValue, setComboValue] = useState('');
  const [sliderValue, setSliderValue] = useState([40]);
  const [switchOn, setSwitchOn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('wave');
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <TooltipProvider>
      <Toaster />

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <Topbar
        start={
          <div className="flex items-center gap-3">
            <PetalSymbol size={32} />
            <span className="font-display text-foreground text-lg font-medium tracking-tight">
              Design Preview
            </span>
          </div>
        }
        center={
          <span className="text-muted-foreground text-xs tracking-widest uppercase">
            Story 2.14 · Specimen dev only
          </span>
        }
        end={
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDark}
            aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? 'Clair' : 'Sombre'}
          </Button>
        }
      />

      {/* ── Corps principal ──────────────────────────────────────────────── */}
      <Container size="lg" className="space-y-20 py-12">
        {/* ── En-tête ────────────────────────────────────────────────────── */}
        <header className="flex items-center gap-8">
          <PetalSymbol size={80} />
          <div>
            <h1 className="font-display tracking-display text-foreground mb-2 text-5xl font-light">
              Base &amp; Brand v3.0
            </h1>
            <EditorialQuote attribution="Design system __PROJECT_NAME__">
              Encaissez plus vite. Gérez plus sereinement.
            </EditorialQuote>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1 — COULEURS
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>1 · Couleurs — nuanciers</SectionLabel>
          <div className="space-y-8">
            {PALETTE.map((group) => (
              <div key={group.family}>
                <h3 className="font-display text-foreground mb-3 text-base font-medium">
                  {group.family}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {group.swatches.map((swatch) => (
                    <div
                      key={swatch.variable}
                      className="rounded-2xl p-4 text-xs"
                      style={{ backgroundColor: swatch.hex, color: swatch.textOnHex }}
                    >
                      <div className="font-display mb-1 text-sm font-medium">{swatch.name}</div>
                      <div className="font-mono opacity-80">{swatch.hex}</div>
                      <div className="font-mono text-[10px] opacity-60">{swatch.variable}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tokens sémantiques */}
          <div className="mt-8">
            <h3 className="font-display text-foreground mb-3 text-base font-medium">
              Tokens sémantiques
            </h3>
            <div className="flex flex-wrap gap-3">
              {SEMANTIC_TOKENS.map((token) => (
                <div key={token.name} className="flex flex-col items-center gap-1.5">
                  <div className={`border-border h-12 w-20 rounded-xl border ${token.name}`} />
                  <span className="text-muted-foreground font-mono text-[10px]">{token.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2 — TYPOGRAPHIE
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>2 · Typographie</SectionLabel>
          <div className="space-y-4">
            <p className="font-display text-foreground text-6xl leading-none font-light tracking-tight">
              .t-hero — Encaissez.
            </p>
            <p className="font-display text-foreground text-4xl font-light tracking-tight">
              .t-h1 — Gérez vos factures
            </p>
            <p className="font-display text-foreground text-2xl font-medium tracking-tight">
              .t-h2 — Tableau de bord
            </p>
            <p className="font-display text-foreground text-lg font-medium">
              .t-h3 — Revenus du mois
            </p>
            <p className="font-display text-brand-600 text-xl tracking-tight italic">
              .t-editorial — Un seul outil, quatre modules.
            </p>
            <p className="text-foreground font-mono text-sm">
              .t-mono — FAC-2025-001 · 875 000 FCFA · Wave Money
            </p>
            <p className="text-foreground text-base leading-relaxed">
              Texte courant (Inter) — Suite SaaS modulaire de gestion d&apos;entreprise pour TPE et
              PME d&apos;Afrique francophone. Côte d&apos;Ivoire · Sénégal · diacritiques
              (éàùçêïôû).
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3 — BOUTONS
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>3 · Boutons</SectionLabel>

          <div className="space-y-6">
            {/* Variants × tailles */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Variants
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="default">Principal</Button>
                <Button variant="accent">Accent Brand</Button>
                <Button variant="outline">Contour</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructif</Button>
                <Button variant="link">Lien</Button>
              </div>
            </div>

            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Tailles
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <Button size="sm">Petit</Button>
                <Button size="default">Défaut</Button>
                <Button size="lg">Grand</Button>
                <Button size="icon" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                États
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Désactivé</Button>
                <LoadingButton
                  loading={loading}
                  loadingText="Envoi en cours…"
                  onClick={simulateLoading}
                >
                  {loading ? 'Envoi…' : 'Envoyer la facture'}
                </LoadingButton>
                <LoadingButton loading variant="accent">
                  Chargement
                </LoadingButton>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4 — BADGES & STATUTS
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>4 · Badges &amp; statuts</SectionLabel>

          <div className="space-y-6">
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Badge — variants métier
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="paid">Payé</Badge>
                <Badge variant="pending">En attente</Badge>
                <Badge variant="late">En retard</Badge>
                <Badge variant="draft">Brouillon</Badge>
                <Badge variant="neutral">Neutre</Badge>
                <Badge variant="default">Défaut</Badge>
                <Badge variant="secondary">Secondaire</Badge>
                <Badge variant="destructive">Destructif</Badge>
                <Badge variant="outline">Contour</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                StatusDot
              </h3>
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    'paid',
                    'pending',
                    'overdue',
                    'draft',
                    'success',
                    'warning',
                    'error',
                    'neutral',
                  ] as const
                ).map((status) => (
                  <span key={status} className="flex items-center gap-1.5 text-sm">
                    <StatusDot status={status} />
                    {status}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Trend
              </h3>
              <div className="flex flex-wrap gap-4">
                <Trend value="+18%" direction="up" />
                <Trend value="-6%" direction="down" />
                <Trend value="0%" direction="flat" />
                <Trend value="+142 000 FCFA" direction="up" />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 5 — FORMULAIRES
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>5 · Formulaires</SectionLabel>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Input */}
            <div className="space-y-1.5">
              <Label htmlFor="demo-input">Nom du client</Label>
              <Input id="demo-input" placeholder="Diallo Conseils SARL" />
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="demo-textarea">Objet de la facture</Label>
              <Textarea
                id="demo-textarea"
                placeholder="Prestation de conseil en gestion financière…"
                rows={3}
              />
            </div>

            {/* Select */}
            <div className="space-y-1.5">
              <Label>Module</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un module…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facturation">Facturation</SelectItem>
                  <SelectItem value="encaissement">Encaissement</SelectItem>
                  <SelectItem value="comptabilite">Comptabilité</SelectItem>
                  <SelectItem value="rh">Ressources humaines</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Combobox */}
            <div className="space-y-1.5">
              <Label>Ville</Label>
              <Combobox
                value={comboValue}
                onValueChange={setComboValue}
                placeholder="Rechercher une ville…"
                options={[
                  { value: 'dakar', label: 'Dakar' },
                  { value: 'abidjan', label: 'Abidjan' },
                  { value: 'bamako', label: 'Bamako' },
                  { value: 'conakry', label: 'Conakry' },
                  { value: 'ouagadougou', label: 'Ouagadougou' },
                  { value: 'lome', label: 'Lomé' },
                  { value: 'cotonou', label: 'Cotonou' },
                ]}
              />
            </div>

            {/* MoneyInput */}
            <div className="space-y-1.5">
              <Label htmlFor="demo-money">Montant (FCFA)</Label>
              <MoneyInput
                id="demo-money"
                value={moneyValue}
                onValueChange={setMoneyValue}
                currency="XOF"
                placeholder="0 FCFA"
              />
              <p className="text-muted-foreground text-xs">
                Valeur : <MoneyDisplay amount={moneyValue} currency="XOF" />
              </p>
            </div>

            {/* DateInput */}
            <div className="space-y-1.5">
              <Label htmlFor="demo-date">Date d&apos;échéance</Label>
              <DateInput id="demo-date" value={dateValue} onValueChange={setDateValue} />
            </div>

            {/* PhoneInput */}
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <PhoneInput
                value={phoneValue}
                onValueChange={(val) => setPhoneValue(val)}
                defaultCountry="SN"
              />
            </div>

            {/* CountrySelect */}
            <div className="space-y-1.5">
              <Label>Pays</Label>
              <CountrySelect
                value={countryValue}
                onValueChange={setCountryValue}
                className="w-full"
              />
            </div>

            {/* Checkbox */}
            <div className="space-y-3">
              <Label>Options</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="demo-checkbox"
                  checked={checked}
                  onCheckedChange={(v) => setChecked(v === true)}
                />
                <Label htmlFor="demo-checkbox">Envoyer par e-mail au client</Label>
              </div>
            </div>

            {/* RadioGroup */}
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="wave" id="pay-wave" />
                  <Label htmlFor="pay-wave">Wave Money</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="paystack" id="pay-paystack" />
                  <Label htmlFor="pay-paystack">Paystack</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="virement" id="pay-virement" />
                  <Label htmlFor="pay-virement">Virement bancaire</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Switch */}
            <div className="flex items-center gap-3">
              <Switch id="demo-switch" checked={switchOn} onCheckedChange={setSwitchOn} />
              <Label htmlFor="demo-switch">
                Rappels automatiques {switchOn ? '(actifs)' : '(inactifs)'}
              </Label>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <Label>Remise commerciale : {sliderValue[0]}%</Label>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                min={0}
                max={50}
                step={5}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 6 — DONNÉES
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>6 · Données</SectionLabel>

          <div className="space-y-8">
            {/* StatCards */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                StatCard
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  variant="hero"
                  label="Chiffre d'affaires"
                  value="14,5 M"
                  unit="FCFA"
                  trend={<Trend value="+18%" direction="up" />}
                  meta="vs mois précédent"
                />
                <StatCard
                  label="Factures émises"
                  value="134"
                  meta="Ce mois"
                  trend={<Trend value="+12" direction="up" />}
                />
                <StatCard
                  label="En attente"
                  value="2,3 M"
                  unit="FCFA"
                  trend={<Trend value="-3%" direction="down" />}
                  meta="23 factures"
                />
                <StatCard
                  label="Taux de recouvrement"
                  value="87"
                  unit="%"
                  trend={<Trend value="0%" direction="flat" />}
                  meta="Cible : 90%"
                />
              </div>
            </div>

            {/* Card générique */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Card
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Dernière transaction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Diallo Conseils SARL — 12 mars 2025
                    </p>
                    <MoneyDisplay
                      amount={875000n}
                      currency="XOF"
                      size="lg"
                      className="font-display mt-2 block font-light"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Prochaine échéance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Groupe Konaté BTP — 28 mars 2025
                    </p>
                    <MoneyDisplay
                      amount={2340000n}
                      currency="XOF"
                      size="lg"
                      className="font-display mt-2 block font-light"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Progress */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Progress
              </h3>
              <div className="max-w-md space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Recouvrement</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Objectif facturation</span>
                    <span>62%</span>
                  </div>
                  <Progress value={62} />
                </div>
              </div>
            </div>

            {/* Avatar */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Avatar &amp; AvatarGroup
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="" alt="Fatou Diallo" />
                    <AvatarFallback>FD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Fatou Diallo</p>
                    <p className="text-muted-foreground text-xs">Comptable</p>
                  </div>
                </div>

                <AvatarGroup max={3}>
                  <Avatar>
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>BK</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>CM</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>DT</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>EO</AvatarFallback>
                  </Avatar>
                </AvatarGroup>
              </div>
            </div>

            {/* DataTable */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                DataTable (4 lignes)
              </h3>
              <DataTable
                columns={INVOICE_COLUMNS}
                data={MOCK_INVOICES}
                emptyState={{
                  title: 'Aucune facture',
                  description: 'Créez votre première facture.',
                }}
              />
            </div>

            {/* TableSkeleton */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                TableSkeleton (état de chargement)
              </h3>
              <TableSkeleton rows={3} columns={4} />
            </div>

            {/* EmptyState */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                EmptyState
              </h3>
              <div className="border-border rounded-xl border">
                <EmptyState
                  title="Aucun encaissement ce mois"
                  description="Envoyez votre première facture pour commencer à suivre vos paiements."
                  action={
                    <Button variant="accent">
                      <Plus className="h-4 w-4" />
                      Créer une facture
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 7 — FEEDBACK
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>7 · Feedback</SectionLabel>

          <div className="space-y-6">
            {/* Alerts */}
            <div className="space-y-3">
              <Alert variant="default">
                <AlertTitle>Mise à jour disponible</AlertTitle>
                <AlertDescription>
                  __PROJECT_NAME__ v2.1.0 est disponible avec de nouvelles fonctionnalités.
                </AlertDescription>
              </Alert>
              <Alert variant="info">
                <AlertTitle>Délai de traitement Wave</AlertTitle>
                <AlertDescription>
                  Les virements Wave peuvent prendre 24h en dehors des heures ouvrées.
                </AlertDescription>
              </Alert>
              <Alert variant="success">
                <AlertTitle>Paiement reçu</AlertTitle>
                <AlertDescription>
                  875 000 FCFA de Diallo Conseils SARL ont été crédités sur votre compte.
                </AlertDescription>
              </Alert>
              <Alert variant="warning">
                <AlertTitle>Facture bientôt échue</AlertTitle>
                <AlertDescription>
                  La facture FAC-2025-003 arrive à échéance dans 3 jours.
                </AlertDescription>
              </Alert>
              <Alert variant="danger">
                <AlertTitle>Paiement en retard</AlertTitle>
                <AlertDescription>
                  Mme Aïssatou Mbaye a une facture impayée depuis 42 jours.
                </AlertDescription>
              </Alert>
            </div>

            {/* Dialog */}
            <div className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Ouvrir une boîte de dialogue</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmer l&apos;envoi</DialogTitle>
                    <DialogDescription>
                      La facture FAC-2025-002 sera envoyée par e-mail à Groupe Konaté BTP. Cette
                      action est irréversible.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="ghost">Annuler</Button>
                    <Button variant="accent">Envoyer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Ouvrir un panneau latéral</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Détails du client</SheetTitle>
                    <SheetDescription>
                      Informations complètes de Diallo Conseils SARL.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="text-muted-foreground text-xs tracking-wider uppercase">
                        Entreprise
                      </p>
                      <p className="text-foreground mt-1 font-medium">Diallo Conseils SARL</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs tracking-wider uppercase">
                        Localisation
                      </p>
                      <p className="text-foreground mt-1">Dakar, Sénégal</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs tracking-wider uppercase">
                        Total facturé
                      </p>
                      <MoneyDisplay
                        amount={3250000n}
                        currency="XOF"
                        size="lg"
                        className="font-display mt-1 block font-light"
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Informations">
                    <Bell className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>3 rappels envoyés ce mois</p>
                </TooltipContent>
              </Tooltip>

              {/* Toast */}
              <Button
                variant="outline"
                onClick={() =>
                  toast.success('Facture envoyée', {
                    description: 'FAC-2025-002 envoyée à Groupe Konaté BTP.',
                  })
                }
              >
                Toast success
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.error('Paiement échoué', {
                    description: 'La transaction Wave a été refusée.',
                  })
                }
              >
                Toast error
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.warning('Solde insuffisant', {
                    description: 'Le solde Wave est inférieur à 50 000 FCFA.',
                  })
                }
              >
                Toast warning
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info('Nouvelle fonctionnalité', {
                    description: 'Exportez vos factures en PDF depuis le tableau de bord.',
                  })
                }
              >
                Toast info
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 8 — NAVIGATION
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>8 · Navigation</SectionLabel>

          <div className="space-y-8">
            {/* Tabs */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Tabs
              </h3>
              <Tabs defaultValue="factures">
                <TabsList>
                  <TabsTrigger value="factures">Factures</TabsTrigger>
                  <TabsTrigger value="paiements">Paiements</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                </TabsList>
                <TabsContent value="factures" className="mt-4">
                  <p className="text-muted-foreground text-sm">
                    134 factures émises ce mois · 87% recouvrées
                  </p>
                </TabsContent>
                <TabsContent value="paiements" className="mt-4">
                  <p className="text-muted-foreground text-sm">
                    Wave · Paystack · Virement bancaire
                  </p>
                </TabsContent>
                <TabsContent value="clients" className="mt-4">
                  <p className="text-muted-foreground text-sm">
                    48 clients actifs · 3 nouveaux ce mois
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Breadcrumb */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Breadcrumb
              </h3>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">__PROJECT_NAME__</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Facturation</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>FAC-2025-002</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Pagination */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Pagination
              </h3>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      2
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>

            {/* Stepper */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Stepper — horizontal (étape 2/4)
              </h3>
              <Stepper steps={STEPPER_STEPS} currentStep={1} orientation="horizontal" />
            </div>

            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Stepper — vertical
              </h3>
              <div className="max-w-xs">
                <Stepper steps={STEPPER_STEPS} currentStep={2} orientation="vertical" />
              </div>
            </div>

            {/* Accordion */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                Accordion
              </h3>
              <Accordion type="single" collapsible className="max-w-xl">
                <AccordionItem value="q1">
                  <AccordionTrigger>Comment fonctionne le paiement Wave ?</AccordionTrigger>
                  <AccordionContent>
                    Le client reçoit un lien de paiement par SMS. Il confirme le montant dans
                    l&apos;application Wave. Le paiement est crédité instantanément.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2">
                  <AccordionTrigger>Puis-je émettre des factures en XOF et EUR ?</AccordionTrigger>
                  <AccordionContent>
                    Oui. __PROJECT_NAME__ supporte XOF, XAF, EUR et USD. La devise est configurable par
                    client ou par facture.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3">
                  <AccordionTrigger>Quelles normes comptables sont supportées ?</AccordionTrigger>
                  <AccordionContent>
                    SYSCOHADA révisé (Afrique de l&apos;Ouest et Centrale) et le plan comptable
                    général français (PCG 2005). Le FNE Côte d&apos;Ivoire est également pris en
                    charge.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 9 — LAYOUT
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>9 · Layout — aperçu statique</SectionLabel>

          {/* PageHeader */}
          <div className="border-border mb-8 rounded-xl border p-6">
            <h3 className="text-muted-foreground mb-4 text-xs font-medium tracking-wider uppercase">
              PageHeader
            </h3>
            <PageHeader
              eyebrow="Facturation · Avril 2025"
              title="Tableau de bord"
              subtitle="Vue d'ensemble de vos factures, encaissements et indicateurs clés."
              actions={
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Exporter
                  </Button>
                  <Button variant="accent" size="sm">
                    <Plus className="h-4 w-4" />
                    Nouvelle facture
                  </Button>
                </div>
              }
            />
          </div>

          {/* Topbar + SidebarRail + Sidebar — maquette statique */}
          <div>
            <h3 className="text-muted-foreground mb-4 text-xs font-medium tracking-wider uppercase">
              Topbar + SidebarRail + Sidebar (statique, mockées)
            </h3>
            <div
              className="border-border overflow-hidden rounded-xl border"
              style={{ height: 320 }}
            >
              {/* Topbar miniature */}
              <Topbar
                start={<PetalSymbol size={24} />}
                center={<span className="text-muted-foreground text-xs">Aperçu layout</span>}
                end={
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px]">FD</AvatarFallback>
                  </Avatar>
                }
                className="h-12 px-3"
              />

              {/* Corps sidebar */}
              <div className="flex h-[calc(100%-48px)]">
                {/* Rail */}
                <SidebarRail className="w-12 gap-1 py-2">
                  <NavIcon icon={<LayoutDashboard size={18} />} label="Tableau de bord" active />
                  <NavIcon icon={<FileText size={18} />} label="Facturation" badge={{ value: 3 }} />
                  <NavIcon icon={<CreditCard size={18} />} label="Encaissement" />
                  <NavIcon icon={<BarChart2 size={18} />} label="Comptabilité" />
                  <NavIcon icon={<Settings size={18} />} label="Paramètres" />
                </SidebarRail>

                {/* Panneau secondaire */}
                <Sidebar className="w-48">
                  <SidebarHeader eyebrow="Module" title="Facturation" accent="#E89B5A" />
                  <SidebarSection label="Vues">
                    <SidebarItem label="Toutes les factures" active />
                    <SidebarItem label="En attente" badge={{ value: 12, tone: 'pending' }} />
                    <SidebarItem label="En retard" badge={{ value: 3, tone: 'late' }} />
                    <SidebarItem label="Brouillons" />
                  </SidebarSection>
                </Sidebar>

                {/* Zone contenu */}
                <div className="bg-background flex-1 overflow-hidden p-4">
                  <p className="text-muted-foreground text-xs">Zone contenu applicatif</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 10 — PRIMITIVES CUSTOM
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionLabel>10 · Primitives custom</SectionLabel>

          <div className="space-y-8">
            {/* MoneyDisplay */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                MoneyDisplay
              </h3>
              <div className="flex flex-wrap items-baseline gap-6">
                <MoneyDisplay amount={875000n} currency="XOF" size="sm" />
                <MoneyDisplay amount={2340000n} currency="XOF" size="md" />
                <MoneyDisplay amount={6500000n} currency="XOF" size="lg" />
                <MoneyDisplay amount={14500n} currency="EUR" size="md" />
                <MoneyDisplay amount={-145000n} currency="XOF" size="md" />
              </div>
            </div>

            {/* KPI */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                KPI
              </h3>
              <div className="flex flex-wrap gap-8">
                <KPI
                  label="Chiffre d'affaires"
                  value={<MoneyDisplay amount={14500000n} currency="XOF" />}
                  trend={{ direction: 'up', value: '+18%' }}
                />
                <KPI
                  label="Créances en retard"
                  value={<MoneyDisplay amount={2340000n} currency="XOF" />}
                  trend={{ direction: 'down', value: '-6%' }}
                />
                <KPI label="Clients actifs" value="48" trend={{ direction: 'flat', value: '0' }} />
              </div>
            </div>

            {/* EditorialQuote */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                EditorialQuote (max 2 par page)
              </h3>
              <div className="max-w-xl space-y-6">
                <EditorialQuote attribution="Mamadou Diallo, dirigeant TPE, Dakar">
                  « __PROJECT_NAME__ m&apos;a permis de réduire mes délais de recouvrement de 45 jours à 12
                  jours. »
                </EditorialQuote>
              </div>
            </div>

            {/* PetalSymbol */}
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                PetalSymbol — tailles
              </h3>
              <div className="flex items-end gap-8">
                <PetalSymbol size={24} />
                <PetalSymbol size={32} />
                <PetalSymbol size={48} />
                <PetalSymbol size={72} />
                <PetalSymbol size={96} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Pied de page ─────────────────────────────────────────────────── */}
        <footer className="border-border border-t pt-8 pb-4">
          <p className="text-muted-foreground font-mono text-xs tracking-widest">
            story 2.14 · design-preview · dev only ·{' '}
            <span className="text-foreground">Base &amp; Brand v3.0</span>
          </p>
        </footer>
      </Container>
    </TooltipProvider>
  );
}
