/**
 * SettingsNav — sidebar de l'espace Paramètres (Story 3.17).
 *
 * Composant autonome rendu dans le **slot `sidebar` natif de AppShell** depuis
 * `_app.tsx` quand `pathname.startsWith('/settings')`. Pas dans le content area
 * — sinon le wrapper `mx-auto max-w-7xl` de `AppShellContent` la pousserait
 * vers le centre (gap visible avec le rail). Pattern aligné sur le preview de
 * référence `apps/suite/src/routes/(dev)/dashboard-preview.tsx:929`.
 *
 * Visuel : `Sidebar` 256px collée au rail 64px, pleine hauteur viewport,
 * header filet 3px Brand, sections labellisées, ergot Brand sur l'item actif.
 */
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CircleUser,
  History,
  KeyRound,
  Monitor,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sidebar, SidebarHeader, SidebarItem, SidebarSection } from '@__SCOPE__/ui/sidebar';

import { getActiveModules } from '../lib/module-access';

/** Couleur signature de la section Paramètres (filet header + ergot actif). */
const ACCENT = 'var(--color-brand-400)';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Écran pas encore livré — affiché grisé, non cliquable. */
  soon?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: 'Mon compte',
    items: [{ label: 'Profil', href: '/settings/profile', icon: CircleUser }],
  },
  {
    title: 'Organisation',
    items: [
      { label: 'Profil', href: '/settings/organization', icon: Building2 },
      { label: 'Établissements', href: '/settings/establishments', icon: Store },
      { label: 'Équipe', href: '/settings/team', icon: Users },
      { label: 'Rôles & permissions', href: '/settings/team/roles', icon: ShieldCheck },
    ],
  },
  {
    title: 'Sécurité',
    items: [
      { label: 'Double authentification', href: '/settings/security/2fa', icon: KeyRound },
      { label: 'Sessions actives', href: '/settings/security/sessions', icon: Monitor },
      { label: "Journal d'audit", href: '/settings/audit-log', icon: History },
    ],
  },
];

/**
 * Section « Modules » — paramètres des modules produit dans le settings global
 * (convention projet : les réglages d'un module vivent ici, pas dans une sidebar
 * de module). Affichée **uniquement** si le module correspondant est actif (cf.
 * `useActiveModulesNav`). Chaque entrée porte le `moduleCode` qui conditionne sa
 * visibilité ; `sub` rend l'item indenté (sous-item).
 */
interface ModuleNavItem extends NavItem {
  /** Code du module en base (cf. seed-modules.ts) — gate la visibilité. */
  moduleCode: string;
  /** Sous-item indenté (ex. « Relances » sous « Facturation »). */
  sub?: boolean;
}

// Generic core ships no module-specific settings. Add one entry per module that
// exposes settings under the global settings (convention: module settings live here).
const MODULE_NAV: ModuleNavItem[] = [];

/**
 * Résout un libellé de fil d'ariane Paramètres vers sa route, à partir de `NAV` :
 *  - « Paramètres » → 1ʳᵉ page de la nav (accueil de facto, pas d'index `/settings`) ;
 *  - un **titre de section** (catégorie : Organisation, Sécurité…) → 1ʳᵉ page de la section ;
 *  - un **libellé de page** → sa route (désambiguïsée via la catégorie parente, ex. « Profil »
 *    existe sous « Mon compte » et « Organisation »).
 * `undefined` si non résoluble → le crumb reste un simple texte non cliquable.
 */
export function settingsCrumbHref(label: string, parentLabel?: string): string | undefined {
  if (label === 'Paramètres') return NAV[0]?.items[0]?.href;
  const section = NAV.find((s) => s.title === label);
  if (section) return (section.items.find((i) => !i.soon) ?? section.items[0])?.href;
  const parent = parentLabel ? NAV.find((s) => s.title === parentLabel) : undefined;
  for (const s of parent ? [parent, ...NAV] : NAV) {
    const item = s.items.find((i) => i.label === label && !i.soon);
    if (item) return item.href;
  }
  // Section « Modules » (paramètres de module dans le settings global).
  const moduleItem = MODULE_NAV.find((i) => i.label === label);
  if (moduleItem) return moduleItem.href;
  return undefined;
}

/** Props optionnelles — `onNavigate` est appelé après un changement de route,
 * utile pour fermer un drawer parent (cf. usage dans `SettingsPageHeader`
 * sous lg : tap item → drawer ferme + route change). */
export interface SettingsNavProps {
  onNavigate?: () => void;
}

export function SettingsNav({ onNavigate }: SettingsNavProps = {}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Modules actifs (cache TTL partagé avec le gating de routes). Tant que la
  // requête n'a pas résolu, on n'affiche pas la section « Modules » (évite un
  // flash d'entrées qui disparaîtraient). Si l'appel échoue, on masque aussi.
  const activeModulesQuery = useQuery({
    queryKey: ['module-access', 'active'],
    queryFn: () => getActiveModules(),
    staleTime: 30_000,
  });
  const activeModules = activeModulesQuery.data;
  const moduleItems = activeModules
    ? MODULE_NAV.filter((i) => activeModules.has(i.moduleCode))
    : [];

  // "Best match wins" — la href la plus longue qui est préfixe du pathname
  // gagne. Évite que `/settings/team` matche aussi sur `/settings/team/roles`
  // (le préfixe `/settings/team/` ne doit gagner que pour `/settings/team`,
  // pas pour ses sous-routes plus spécifiques).
  const bestMatchHref = [...NAV.flatMap((s) => s.items), ...MODULE_NAV]
    .map((i) => i.href)
    .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
    .reduce((best, current) => (current.length > best.length ? current : best), '');

  return (
    <Sidebar>
      <SidebarHeader eyebrow="Paramètres" title="Configuration" accent={ACCENT} />

      <nav aria-label="Navigation Paramètres" className="flex-1 overflow-y-auto pb-3">
        {NAV.map((section) => (
          <SidebarSection key={section.title} label={section.title}>
            {section.items.map((item) => {
              const active = item.href === bestMatchHref;
              const Icon = item.icon;
              if (item.soon) {
                return (
                  <SidebarItem
                    key={item.href}
                    icon={<Icon className="h-4 w-4" />}
                    label={item.label}
                    disabled
                    className="cursor-not-allowed opacity-50"
                    title={`${item.label} — bientôt`}
                  />
                );
              }
              return (
                <SidebarItem
                  key={item.href}
                  icon={<Icon className="h-4 w-4" />}
                  label={item.label}
                  active={active}
                  signatureColor={ACCENT}
                  onClick={() => {
                    void navigate({ to: item.href });
                    onNavigate?.();
                  }}
                />
              );
            })}
          </SidebarSection>
        ))}

        {/* Section « Modules » — visible seulement si au moins un module actif. */}
        {moduleItems.length > 0 ? (
          <SidebarSection label="Modules">
            {moduleItems.map((item) => {
              const active = item.href === bestMatchHref;
              const Icon = item.icon;
              return (
                <SidebarItem
                  key={item.href}
                  icon={<Icon className="h-4 w-4" />}
                  label={item.label}
                  active={active}
                  signatureColor={ACCENT}
                  className={item.sub ? 'pl-9' : undefined}
                  onClick={() => {
                    void navigate({ to: item.href });
                    onNavigate?.();
                  }}
                />
              );
            })}
          </SidebarSection>
        ) : null}
      </nav>
    </Sidebar>
  );
}
