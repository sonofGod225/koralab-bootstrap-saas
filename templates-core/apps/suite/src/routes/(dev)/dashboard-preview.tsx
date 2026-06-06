/**
 * Route prévisualisation dashboard — Desktop + Mobile layout fidèle au design Story 2.7.
 * URL en dev : http://localhost:3000/dashboard-preview
 *
 * Dev-only : retourne null en production.
 * Un seul arbre React — bascules via classes Tailwind `lg:` / `hidden`.
 *
 * Desktop (≥ 1024px) : AppShell avec rail + sidebar + contenu.
 * Mobile  (< 1024px) : Topbar simplifiée + contenu responsive + BottomNav.
 *                       Hamburger ouvre un Sheet (drawer) côté gauche.
 */

import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

// ── Layout primitives ──────────────────────────────────────────────────────
import { AppShell } from '@__SCOPE__/ui/app-shell';
import { Topbar } from '@__SCOPE__/ui/topbar';
import {
  SidebarRail,
  NavIcon,
  Sidebar,
  SidebarHeader,
  SidebarSection,
  SidebarItem,
} from '@__SCOPE__/ui/sidebar';
import { PageHeader } from '@__SCOPE__/ui/page-header';
import { BottomNav, BottomNavItem } from '@__SCOPE__/ui/bottom-nav';
import { OrgSwitcher } from '@__SCOPE__/ui/org-switcher';
import type { Organization } from '@__SCOPE__/ui/org-switcher';

// ── UI primitives ──────────────────────────────────────────────────────────
import { Button } from '@__SCOPE__/ui/button';
import { Badge } from '@__SCOPE__/ui/badge';
import { Avatar, AvatarFallback } from '@__SCOPE__/ui/avatar';
import { StatCard } from '@__SCOPE__/ui/stat-card';
import { Trend } from '@__SCOPE__/ui/trend';
import { Kbd } from '@__SCOPE__/ui/kbd';
import { Sheet, SheetContent, SheetTitle } from '@__SCOPE__/ui/sheet';

// ── Icônes Lucide ──────────────────────────────────────────────────────────
import {
  Home,
  Users,
  FileText,
  Coins,
  BookOpen,
  Settings,
  ChevronsUpDown,
  Search,
  Plus,
  Bell,
  Download,
  ArrowRight,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Clock,
  Send,
  AlertTriangle,
  CreditCard,
  Info,
  CheckCheck,
  AlertCircle,
  Sparkles,
  Menu,
} from 'lucide-react';

export const Route = createFileRoute('/(dev)/dashboard-preview')({
  component: DashboardPreviewPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Données mockées — EXACTEMENT celles du design source
// ─────────────────────────────────────────────────────────────────────────────

interface InvoiceData {
  id: string;
  client: string;
  date: string;
  amount: string;
  status: 'pending' | 'paid' | 'overdue';
  daysLate?: number;
}

const INVOICES: InvoiceData[] = [
  {
    id: 'FAC-2026-0142',
    client: 'Aminata Diop',
    date: '12 mai 2026',
    amount: '145 000',
    status: 'pending',
  },
  {
    id: 'FAC-2026-0141',
    client: 'Sonatel SA',
    date: '11 mai 2026',
    amount: '2 480 000',
    status: 'paid',
  },
  {
    id: 'FAC-2026-0138',
    client: 'Boutique Teranga',
    date: '08 mai 2026',
    amount: '67 500',
    status: 'overdue',
    daysLate: 4,
  },
  {
    id: 'FAC-2026-0137',
    client: 'Cabinet Sarr & Frères',
    date: '06 mai 2026',
    amount: '890 000',
    status: 'overdue',
    daysLate: 6,
  },
  {
    id: 'FAC-2026-0135',
    client: 'Atelier Mbaye',
    date: '03 mai 2026',
    amount: '320 000',
    status: 'paid',
  },
];

const ACCENT = 'var(--color-brand-400)';

// ─────────────────────────────────────────────────────────────────────────────
// Organisations mockées — design « Switch organisation » (__PROJECT_NAME__-Auth)
// ─────────────────────────────────────────────────────────────────────────────

const ORGANIZATIONS: Organization[] = [
  { id: 'dist-yk', name: 'Distribution YK', role: 'Membre', initial: 'Y', tone: 'brand' },
  { id: 'atelier-fatou', name: 'Atelier Fatou', role: 'Propriétaire', initial: 'F', tone: 'base' },
  { id: 'cafe-marche', name: 'Café du marché', role: 'Comptable', initial: 'C', tone: 'success' },
];

// ─────────────────────────────────────────────────────────────────────────────
// CommandPaletteTrigger — slot center du Topbar (desktop, 480px)
// ─────────────────────────────────────────────────────────────────────────────

function CommandPaletteTrigger() {
  return (
    <button
      type="button"
      className="border-border bg-muted hover:bg-subtle flex h-[38px] w-[480px] cursor-pointer items-center gap-2.5 rounded-[12px] border px-3.5 text-left transition-colors duration-[120ms]"
      style={{ boxShadow: 'inset 0 1px 2px rgba(42,26,15,0.04)' }}
    >
      <Search size={15} className="text-muted-foreground shrink-0" />
      <span className="text-muted-foreground flex-1 text-[13px]">
        Rechercher une facture, un client…
      </span>
      <Kbd>⌘K</Kbd>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HeaderIconButton — icône 38×38 avec badge point optionnel
// ─────────────────────────────────────────────────────────────────────────────

interface HeaderIconButtonProps {
  label: string;
  badge?: boolean;
  children: React.ReactNode;
}

function HeaderIconButton({ label, badge, children }: HeaderIconButtonProps) {
  return (
    <button
      aria-label={label}
      type="button"
      className="text-foreground hover:bg-muted relative inline-flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent transition-colors duration-[120ms]"
    >
      {children}
      {badge && (
        <span className="ring-card bg-danger-400 absolute top-[7px] right-[7px] h-2 w-2 rounded-full ring-2" />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge — badge sémantique de statut facture
// ─────────────────────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: 'paid' | 'pending' | 'overdue';
  daysLate?: number;
}

function StatusBadge({ status, daysLate }: StatusBadgeProps) {
  if (status === 'paid') return <Badge variant="paid">Payée</Badge>;
  if (status === 'pending') return <Badge variant="pending">En attente</Badge>;
  return <Badge variant="late">{daysLate ? `En retard ${daysLate}j` : 'En retard'}</Badge>;
}

// ─────────────────────────────────────────────────────────────────────────────
// InvoiceRow — ligne desktop de la table Factures récentes
// ─────────────────────────────────────────────────────────────────────────────

function InvoiceRow({ id, client, date, amount, status, daysLate }: InvoiceData) {
  return (
    <div
      className="border-border grid items-center gap-4 border-t py-3.5"
      style={{ gridTemplateColumns: '120px 1fr 110px 130px 70px' }}
    >
      {/* Référence */}
      <span className="text-foreground font-mono text-xs">{id}</span>

      {/* Client */}
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="bg-subtle font-display text-foreground text-xs font-medium">
            {client[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-foreground truncate text-[13px] font-medium">{client}</div>
          <div className="text-muted-foreground text-[11px]">{date}</div>
        </div>
      </div>

      {/* Montant */}
      <div className="text-right">
        <span className="font-display text-foreground text-base font-normal tracking-[-0.3px] tabular-nums">
          {amount}
        </span>
        <span className="text-muted-foreground ml-1 text-[11px]">FCFA</span>
      </div>

      {/* Statut */}
      <div>
        <StatusBadge status={status} daysLate={daysLate} />
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Plus d'actions"
          className="text-muted-foreground hover:bg-muted inline-flex h-7 w-7 items-center justify-center rounded-lg border-none bg-transparent"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InvoiceRowMobile — ligne mobile (client + réf + montant + statut empilés)
// ─────────────────────────────────────────────────────────────────────────────

function InvoiceRowMobile({ id, client, amount, status, daysLate }: InvoiceData) {
  return (
    <div className="border-border border-t py-3.5">
      <div className="flex items-start justify-between gap-3">
        {/* Gauche : avatar + nom + réf */}
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-subtle font-display text-foreground text-xs font-medium">
              {client[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-foreground text-[13px] font-medium">{client}</div>
            <div className="text-muted-foreground font-mono text-[10px]">{id}</div>
          </div>
        </div>
        {/* Droite : montant + statut */}
        <div className="shrink-0 text-right">
          <div className="font-display text-foreground text-[15px] font-normal tracking-[-0.3px]">
            {amount} <span className="text-muted-foreground text-[10px]">FCFA</span>
          </div>
          <div className="mt-1">
            <StatusBadge status={status} daysLate={daysLate} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ActivityItem — entrée du flux d'activité
// ─────────────────────────────────────────────────────────────────────────────

type ActivityTone = 'paid' | 'sent' | 'late' | 'draft';

interface ActivityItemProps {
  tone: ActivityTone;
  title: React.ReactNode;
  meta: string;
  value?: string;
  icon: React.ReactNode;
}

const ACTIVITY_TONE_CLASSES: Record<ActivityTone, { bg: string; fg: string }> = {
  paid: { bg: 'bg-success-50', fg: 'text-success-600' },
  sent: { bg: 'bg-brand-50', fg: 'text-brand-600' },
  late: { bg: 'bg-danger-50', fg: 'text-danger-600' },
  draft: { bg: 'bg-subtle', fg: 'text-foreground' },
};

function ActivityItem({ tone, title, meta, value, icon }: ActivityItemProps) {
  const { bg, fg } = ACTIVITY_TONE_CLASSES[tone];
  return (
    <div className="border-border flex items-start gap-3 border-b py-3">
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${bg} ${fg}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-foreground text-[13px] leading-[1.4]">{title}</div>
        <div className="text-muted-foreground mt-0.5 text-[11px]">{meta}</div>
      </div>
      {value && <div className="text-foreground shrink-0 font-mono text-xs">{value}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel — carte blanche avec titre + action + contenu
// ─────────────────────────────────────────────────────────────────────────────

interface PanelProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Panel({ title, action, children, className = '' }: PanelProps) {
  return (
    <div
      className={`border-border bg-card overflow-hidden rounded-[20px] border shadow-xs ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-[22px] pt-[18px] pb-3">
          <h3 className="font-display text-foreground m-0 text-[17px] font-medium tracking-[-0.3px]">
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className="px-[22px] pb-[22px]">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppRail — Sidebar1 (rail d'icônes, desktop uniquement)
// ─────────────────────────────────────────────────────────────────────────────

function AppRail() {
  return (
    <SidebarRail>
      {/* Home — séparé */}
      <NavIcon
        icon={<Home size={20} strokeWidth={1.5} />}
        label="Accueil"
        signatureColor="var(--color-base-700)"
      />

      {/* Séparateur */}
      <div className="bg-border mx-auto my-1 h-px w-7" />

      {/* CRM */}
      <NavIcon
        icon={<Users size={20} strokeWidth={1.5} />}
        label="CRM"
        signatureColor="var(--color-base-600)"
      />

      {/* Facturation — badge 3 */}
      <NavIcon
        icon={<FileText size={20} strokeWidth={1.5} />}
        label="Facturation"
        signatureColor="var(--color-warning-600)"
        badge={{ value: 3 }}
      />

      {/* Encaissements — actif */}
      <NavIcon
        icon={<Coins size={20} strokeWidth={1.75} />}
        label="Encaissements"
        active
        signatureColor="var(--color-brand-400)"
      />

      {/* Comptabilité */}
      <NavIcon
        icon={<BookOpen size={20} strokeWidth={1.5} />}
        label="Comptabilité"
        signatureColor="var(--color-success-600)"
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Paramètres */}
      <NavIcon
        icon={<Settings size={20} strokeWidth={1.5} />}
        label="Paramètres"
        signatureColor="var(--color-base-600)"
      />
    </SidebarRail>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppSidebar — Sidebar2 Encaissements sub-navigation
// ─────────────────────────────────────────────────────────────────────────────

function AppSidebar() {
  return (
    <Sidebar style={{ borderRightWidth: '0.5px' }}>
      <SidebarHeader eyebrow="Pôle Commercial" title="Encaissements" accent={ACCENT} />
      <div className="bg-border h-px" style={{ opacity: 0.5 }} />

      <div className="flex-1 overflow-y-auto pb-3">
        {/* Aperçu */}
        <SidebarSection label="Aperçu">
          <SidebarItem
            icon={<Home size={16} strokeWidth={1.75} />}
            label="Tableau de bord"
            active
            signatureColor={ACCENT}
          />
          <SidebarItem icon={<Calendar size={16} strokeWidth={1.5} />} label="Échéancier" />
          <SidebarItem icon={<TrendingUp size={16} strokeWidth={1.5} />} label="Rapports" />
        </SidebarSection>

        {/* Suivi */}
        <SidebarSection label="Suivi">
          <SidebarItem
            icon={<Clock size={16} strokeWidth={1.5} />}
            label="À encaisser"
            badge={{ value: 12, tone: 'pending' }}
          />
          <SidebarItem
            icon={<Send size={16} strokeWidth={1.5} />}
            label="Relances"
            badge={{ value: 4, tone: 'late' }}
          />
          <SidebarItem icon={<CheckCheck size={16} strokeWidth={1.5} />} label="Paiements reçus" />
          <SidebarItem icon={<AlertCircle size={16} strokeWidth={1.5} />} label="Contestés" />
        </SidebarSection>

        {/* Configuration */}
        <SidebarSection label="Configuration">
          <SidebarItem
            icon={<CreditCard size={16} strokeWidth={1.5} />}
            label="Modes de paiement"
          />
          <SidebarItem icon={<Bell size={16} strokeWidth={1.5} />} label="Notifications" />
        </SidebarSection>
      </div>

      {/* Footer sync */}
      <div className="border-border text-muted-foreground flex items-center gap-2.5 border-t px-4 py-3.5 text-xs">
        <Info size={14} className="text-muted-foreground shrink-0" />
        <span>
          Synchronisé · <span className="text-foreground font-medium">il y a 2 min</span>
        </span>
      </div>
    </Sidebar>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DrawerNav — contenu du Sheet mobile (navigation Encaissements)
// ─────────────────────────────────────────────────────────────────────────────

function DrawerNav() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* En-tête drawer : logo + wordmark */}
      <div className="border-border flex items-center justify-between border-b px-5 py-5">
        <div className="flex items-center gap-2.5">
          {/* Petal symbol inline — reproduit AppLogo 26px */}
          <svg
            width={26}
            height={26}
            viewBox="0 0 56 56"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path d="M 8 28 L 8 18 Q 8 8 18 8 L 28 8 L 28 28 Z" fill="var(--color-base-900)" />
            <path d="M 30 28 L 30 8 L 48 8 Q 48 8 48 18 L 48 28 Z" fill="var(--color-base-900)" />
            <path d="M 8 30 L 28 30 L 28 48 L 18 48 Q 8 48 8 38 Z" fill="var(--color-base-900)" />
            <path
              d="M 30 30 L 48 30 L 48 38 Q 48 48 38 48 L 30 48 Z"
              fill="var(--color-brand-400)"
            />
          </svg>
          <span className="font-display text-foreground text-lg font-medium tracking-[-0.4px]">
            __PROJECT_NAME__
          </span>
        </div>
      </div>

      {/* Org switcher */}
      <div className="border-border border-b px-4 py-3.5">
        <div className="border-border bg-card flex items-center gap-2.5 rounded-xl border px-3 py-2.5">
          <span className="font-display bg-brand-100 text-foreground inline-flex h-8 w-8 items-center justify-center rounded-lg text-[15px] font-medium">
            D
          </span>
          <div className="flex-1">
            <div className="text-foreground text-[13px] font-medium">Diop Consulting</div>
            <div className="text-muted-foreground text-[10px]">
              Plan Croissance · 4 utilisateurs
            </div>
          </div>
          <ChevronsUpDown size={14} className="text-muted-foreground" />
        </div>
      </div>

      {/* Navigation scrollable */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Label Modules */}
        <div className="text-muted-foreground px-[22px] pt-3 pb-1.5 text-[10px] font-semibold tracking-[1.2px] uppercase">
          Modules
        </div>

        {/* CRM */}
        <div className="hover:bg-muted mx-3 mb-1 flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors">
          <span className="bg-muted text-base-600 inline-flex h-9 w-9 items-center justify-center rounded-[10px]">
            <Users size={18} strokeWidth={1.5} />
          </span>
          <div className="flex-1">
            <div className="text-foreground text-[14px] font-medium">CRM</div>
            <div className="text-muted-foreground text-[11px]">Pôle Commercial</div>
          </div>
        </div>

        {/* Facturation — badge */}
        <div className="hover:bg-muted mx-3 mb-1 flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors">
          <span className="bg-muted text-warning-600 inline-flex h-9 w-9 items-center justify-center rounded-[10px]">
            <FileText size={18} strokeWidth={1.5} />
          </span>
          <div className="flex-1">
            <div className="text-foreground text-[14px] font-medium">Facturation</div>
            <div className="text-muted-foreground text-[11px]">Pôle Commercial</div>
          </div>
          <Badge variant="pending">3</Badge>
        </div>

        {/* Encaissements — actif */}
        <div className="bg-card mx-3 mb-1 flex items-center gap-3 rounded-xl px-3.5 py-3 shadow-xs">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-white"
            style={{ backgroundColor: ACCENT }}
          >
            <Coins size={18} strokeWidth={1.75} />
          </span>
          <div className="flex-1">
            <div className="text-foreground text-[14px] font-medium">Encaissements</div>
            <div className="text-muted-foreground text-[11px]">Pôle Commercial</div>
          </div>
          <span className="bg-brand-400 h-1.5 w-1.5 rounded-full" />
        </div>

        {/* Comptabilité */}
        <div className="hover:bg-muted mx-3 mb-1 flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors">
          <span className="bg-muted text-success-600 inline-flex h-9 w-9 items-center justify-center rounded-[10px]">
            <BookOpen size={18} strokeWidth={1.5} />
          </span>
          <div className="flex-1">
            <div className="text-foreground text-[14px] font-medium">Comptabilité</div>
            <div className="text-muted-foreground text-[11px]">Administration</div>
          </div>
        </div>

        {/* Sous-nav Encaissements */}
        <div
          className="px-[22px] pt-4 pb-1.5 text-[10px] font-semibold tracking-[1.2px] uppercase"
          style={{ color: ACCENT }}
        >
          Encaissements
        </div>
        <SidebarItem
          icon={<Clock size={16} strokeWidth={1.5} />}
          label="À encaisser"
          badge={{ value: 12, tone: 'pending' }}
        />
        <SidebarItem
          icon={<Send size={16} strokeWidth={1.5} />}
          label="Relances"
          badge={{ value: 4, tone: 'late' }}
        />
        <SidebarItem icon={<CheckCheck size={16} strokeWidth={1.5} />} label="Paiements reçus" />
      </div>

      {/* Footer utilisateur */}
      <div className="border-border flex items-center gap-3 border-t px-4 py-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-brand-100 font-display text-foreground text-sm font-medium">
            M
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-foreground text-[13px] font-medium">Marius Diop</div>
          <div className="text-muted-foreground text-[11px]">marius@diopconsulting.sn</div>
        </div>
        <button
          type="button"
          aria-label="Paramètres"
          className="text-muted-foreground hover:bg-muted inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-none bg-transparent"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DashboardContent — PageHeader + KPIs + Panneaux (responsive)
// ─────────────────────────────────────────────────────────────────────────────

function DashboardContent() {
  return (
    <div className="bg-background flex-1 overflow-x-hidden overflow-y-auto">
      {/* Padding responsive : mobile pb-24 pour laisser place à la BottomNav */}
      <div className="px-4 pt-5 pb-24 lg:px-9 lg:pt-8 lg:pb-12">
        {/* PageHeader — subtitle abrégé sur mobile */}
        <PageHeader
          eyebrow="Encaissements · Vue d'ensemble"
          title={
            <>
              Bonjour Marius,{' '}
              <em className="font-display text-brand-600 font-normal italic">2 factures</em>{' '}
              attendent.
            </>
          }
          subtitle="Voici l'état de votre semaine — mardi 12 mai 2026"
          actions={
            /* Actions masquées sur mobile */
            <div className="hidden gap-2 lg:flex">
              <Button variant="outline" size="sm">
                <Download size={14} />
                Exporter
              </Button>
              <Button variant="accent" size="sm">
                <Plus size={14} />
                Nouvelle facture
              </Button>
            </div>
          }
        />

        {/* ── KPI row ──────────────────────────────────────────────────────
            Mobile  : KpiHero pleine largeur, puis 2 KpiCards en 2 cols.
            Desktop : 3 colonnes (1.4fr 1fr 1fr) via grille inline.
        ──────────────────────────────────────────────────────────────────── */}

        {/* Grille desktop 3 cols */}
        <div
          className="mb-4 hidden gap-4 lg:mb-6 lg:grid"
          style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}
        >
          <StatCard
            variant="hero"
            label="À encaisser cette semaine"
            value="1 245 000"
            unit="FCFA"
            meta={
              <>
                Dont <strong className="text-brand-400 font-medium">3 factures</strong> en retard
                sur 8 émises.
              </>
            }
          />
          <StatCard
            label="Payé ce mois"
            value="4,2 M"
            unit="FCFA"
            trend={<Trend value="+18%" direction="up" />}
            meta="vs mois dernier"
          />
          <StatCard
            label="Taux d'encaissement"
            value="76"
            unit="%"
            trend={<Trend value="−4 pts" direction="down" />}
            meta="médiane secteur 71%"
          />
        </div>

        {/* Grille mobile : hero 1 col + 2 KpiCards en 2 cols */}
        <div className="mb-4 flex flex-col gap-3 lg:hidden">
          <StatCard
            variant="hero"
            label="À encaisser cette semaine"
            value="1 245 000"
            unit="FCFA"
            meta={
              <>
                Dont <strong className="text-brand-400 font-medium">3 factures</strong> en retard
                sur 8 émises.
              </>
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Payé ce mois"
              value="4,2 M"
              unit="FCFA"
              trend={<Trend value="+18%" direction="up" />}
              meta="vs M−1"
            />
            <StatCard
              label="Encaissement"
              value="76"
              unit="%"
              trend={<Trend value="−4 pts" direction="down" />}
              meta=""
            />
          </div>
        </div>

        {/* ── Panneaux : Factures récentes + Activité ──────────────────────
            Mobile  : 1 colonne (panneau Activité masqué)
            Desktop : 2 colonnes (1.7fr 1fr)
        ──────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:[grid-template-columns:1.7fr_1fr] lg:gap-5">
          {/* Panneau Factures récentes */}
          <Panel
            title="Factures récentes"
            action={
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 border-none bg-transparent text-[13px]"
              >
                Voir tout <ArrowRight size={13} />
              </button>
            }
          >
            {/* En-têtes colonnes — desktop uniquement */}
            <div
              className="text-muted-foreground hidden gap-4 pt-2 pb-0 font-sans text-[10px] font-semibold tracking-[1px] uppercase lg:grid"
              style={{ gridTemplateColumns: '120px 1fr 110px 130px 70px' }}
            >
              <span>Référence</span>
              <span>Client</span>
              <span className="text-right">Montant</span>
              <span>Statut</span>
              <span />
            </div>

            {/* Lignes desktop (toutes) */}
            <div className="hidden lg:block">
              {INVOICES.map((inv) => (
                <InvoiceRow key={inv.id} {...inv} />
              ))}
            </div>

            {/* Lignes mobile (3 premières, format condensé) */}
            <div className="lg:hidden">
              {INVOICES.slice(0, 3).map((inv) => (
                <InvoiceRowMobile key={inv.id} {...inv} />
              ))}
            </div>
          </Panel>

          {/* Panneau Activité — desktop uniquement */}
          <Panel
            className="hidden lg:block"
            title="Activité"
            action={<span className="text-muted-foreground text-[11px]">Aujourd'hui</span>}
          >
            <ActivityItem
              tone="paid"
              icon={<CheckCheck size={15} />}
              title={
                <>
                  Sonatel SA a payé <strong>FAC-2026-0141</strong>
                </>
              }
              meta="Virement bancaire · il y a 14 min"
              value="2,4 M"
            />
            <ActivityItem
              tone="sent"
              icon={<Send size={15} />}
              title={
                <>
                  Relance envoyée à <strong>Cabinet Sarr</strong>
                </>
              }
              meta="SMS + email · il y a 1 h"
            />
            <ActivityItem
              tone="late"
              icon={<AlertTriangle size={15} />}
              title={
                <>
                  Échéance dépassée pour <strong>FAC-2026-0138</strong>
                </>
              }
              meta="Boutique Teranga · il y a 4 j"
              value="67 k"
            />
            <ActivityItem
              tone="draft"
              icon={<FileText size={15} />}
              title={<>3 brouillons à valider</>}
              meta="Facturation · ce matin"
            />

            {/* Bloc suggestion IA */}
            <div className="bg-subtle mt-3 flex items-start gap-2.5 rounded-[14px] px-4 py-3.5">
              <Sparkles size={16} className="text-brand-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-foreground text-[12px] font-medium">3 relances suggérées</div>
                <div className="text-muted-foreground mt-0.5 text-[11px]">
                  Auto-générées d'après vos échéances.
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPreviewPage() {
  if (import.meta.env.PROD) return null;

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <AppShell
        topbar={
          <Topbar
            start={
              <>
                {/* Mobile : hamburger + logo + wordmark */}
                <div className="flex items-center gap-2 lg:hidden">
                  <button
                    type="button"
                    aria-label="Ouvrir le menu"
                    onClick={() => setDrawerOpen(true)}
                    className="text-foreground hover:bg-muted inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-none bg-transparent transition-colors"
                  >
                    <Menu size={20} />
                  </button>
                  {/* Logo petal + wordmark */}
                  <div className="flex items-center gap-2">
                    <svg
                      width={22}
                      height={22}
                      viewBox="0 0 56 56"
                      aria-hidden="true"
                      style={{ flexShrink: 0 }}
                    >
                      <path
                        d="M 8 28 L 8 18 Q 8 8 18 8 L 28 8 L 28 28 Z"
                        fill="var(--color-base-900)"
                      />
                      <path
                        d="M 30 28 L 30 8 L 48 8 Q 48 8 48 18 L 48 28 Z"
                        fill="var(--color-base-900)"
                      />
                      <path
                        d="M 8 30 L 28 30 L 28 48 L 18 48 Q 8 48 8 38 Z"
                        fill="var(--color-base-900)"
                      />
                      <path
                        d="M 30 30 L 48 30 L 48 38 Q 48 48 38 48 L 30 48 Z"
                        fill="var(--color-brand-400)"
                      />
                    </svg>
                    <span className="font-display text-foreground text-base font-medium tracking-[-0.4px]">
                      __PROJECT_NAME__
                    </span>
                  </div>
                </div>

                {/* Desktop : OrgSwitcher */}
                <span className="hidden lg:flex">
                  <OrgSwitcher organizations={ORGANIZATIONS} activeId="dist-yk" />
                </span>
              </>
            }
            center={
              /* Barre de recherche masquée sur mobile */
              <span className="hidden lg:flex">
                <CommandPaletteTrigger />
              </span>
            }
            end={
              <>
                {/* Icône recherche mobile uniquement */}
                <span className="lg:hidden">
                  <HeaderIconButton label="Rechercher">
                    <Search size={18} />
                  </HeaderIconButton>
                </span>

                {/* Bouton + facture desktop uniquement */}
                <span className="hidden lg:flex">
                  <HeaderIconButton label="Nouvelle facture">
                    <Plus size={18} />
                  </HeaderIconButton>
                </span>

                <HeaderIconButton label="Notifications" badge>
                  <Bell size={18} />
                </HeaderIconButton>
                <Avatar className="ml-1 h-[30px] w-[30px] lg:h-[34px] lg:w-[34px]">
                  <AvatarFallback className="bg-brand-100 font-display text-foreground text-sm font-medium">
                    M
                  </AvatarFallback>
                </Avatar>
              </>
            }
          />
        }
        rail={<AppRail />}
        sidebar={<AppSidebar />}
      >
        <DashboardContent />
      </AppShell>

      {/* BottomNav — mobile uniquement (< lg) */}
      <BottomNav className="lg:hidden">
        <BottomNavItem icon={<Home size={20} strokeWidth={1.5} />} label="Accueil" />
        <BottomNavItem icon={<FileText size={20} strokeWidth={1.5} />} label="Factures" badge={3} />
        <BottomNavItem icon={<Coins size={20} strokeWidth={1.75} />} label="Encaisser" active />
        <BottomNavItem icon={<Users size={20} strokeWidth={1.5} />} label="Clients" />
        <BottomNavItem icon={<MoreHorizontal size={20} strokeWidth={1.5} />} label="Plus" />
      </BottomNav>

      {/* Drawer mobile — Sheet côté gauche */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[312px] max-w-[312px] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <DrawerNav />
        </SheetContent>
      </Sheet>
    </>
  );
}
