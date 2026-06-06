/**
 * _app — shell des écrans authentifiés (Story 3.17).
 *
 * Layout pathless (n'ajoute aucun segment d'URL) partagé par tout l'espace
 * authentifié. Composé sur les primitives officielles du design system :
 *  - `AppShell` (`@__SCOPE__/ui/app-shell`) : grille 4 zones
 *  - `Topbar` (`@__SCOPE__/ui/topbar`) : barre supérieure 60px
 *  - `SidebarRail` + `NavIcon` (`@__SCOPE__/ui/sidebar`) : rail d'icônes modules
 *  - `BottomNav` + `BottomNavItem` (`@__SCOPE__/ui/bottom-nav`) : nav mobile (<lg)
 *
 * La sous-sidebar Paramètres (256px) est ajoutée par `_app/settings/route.tsx`
 * dans le `<Outlet />` content area (composition layout enfant), pas via le
 * slot `sidebar` de AppShell.
 *
 * Garde d'accès : `getSession` nul → redirection `/signin` (besoin reload pour
 * vider le state local — c'est volontaire).
 */
import { useCallback, useEffect, useState } from 'react';
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { ChevronDown, LayoutDashboard, Package, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AppShell } from '@__SCOPE__/ui/app-shell';
import { Topbar } from '@__SCOPE__/ui/topbar';
import { SidebarRail, NavIcon } from '@__SCOPE__/ui/sidebar';
import { BottomNav, BottomNavItem } from '@__SCOPE__/ui/bottom-nav';
import { OrgSwitcher } from '@__SCOPE__/ui/org-switcher';
import type { Organization } from '@__SCOPE__/ui/org-switcher';
import { Avatar, AvatarFallback } from '@__SCOPE__/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@__SCOPE__/ui/dropdown-menu';
import { __PROJECT_NAME__Loader, __PROJECT_NAME__Symbol } from '../components/__PROJECT_SLUG__-logo';
import { EstablishmentSwitcher } from '../components/establishment-switcher';
import { SettingsNav } from '../components/settings-nav';
import { OfflineScreen } from '../components/offline-screen';
import { authClient } from '../lib/auth-client';
import { trpc } from '../lib/trpc-client';
import { isNetworkError, isOffline } from '../lib/network';

export const Route = createFileRoute('/_app')({ component: AppShellRoute });

/** Couleur signature appliquée aux items actifs du rail / bottom nav. */
const ACCENT = 'var(--color-soleil-400)';

/** Libellé français d'un rôle d'organisation. */
function roleLabel(role: string | undefined): string {
  switch (role) {
    case 'owner':
      return 'Propriétaire';
    case 'admin':
      return 'Administrateur';
    case 'guest':
      return 'Invité';
    default:
      return 'Membre';
  }
}

interface RailItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Module pas encore livré — icône grisée, non cliquable. */
  soon?: boolean;
  /**
   * Préfixes d'URL supplémentaires rattachés à ce module (au-delà de `href`).
   * Ex. Facturation possède aussi `/quotes` (devis) hors de `/invoicing`.
   */
  match?: string[];
}

/** Un item du rail est-il actif pour le pathname courant (href + alias `match`). */
function isRailItemActive(item: RailItem, pathname: string): boolean {
  if (item.href === '/dashboard') return pathname === '/dashboard';
  return [item.href, ...(item.match ?? [])].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Rail de navigation. Groupe **Données** (référentiels-socle Epic 6 : Contacts,
 * Catalogue — ADR 0013, jamais fusionnés en « Pôle Commercial ») puis groupe
 * **Activité** (modules workflow). Le rail est icon-only : l'ordre matérialise les
 * deux groupes (Données en tête, juste après le tableau de bord).
 */
const RAIL: RailItem[] = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  // Example product module (duplicate this row when you add modules).
  { label: 'Example', href: '/example', icon: Package },
];

interface ShellUser {
  name: string;
  email: string;
}

function AppShellRoute() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [user, setUser] = useState<ShellUser | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeId, setActiveId] = useState('');
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const load = useCallback(async () => {
    setPhase('loading');
    try {
      const session = await authClient.getSession();
      if (!session.data) {
        // Hors-ligne, `getSession` peut renvoyer `data: null` faute de réseau —
        // ne pas éjecter vers `/signin` : afficher l'écran hors-ligne.
        if (isOffline()) {
          setPhase('offline');
          return;
        }
        window.location.assign('/signin');
        return;
      }
      setUser(session.data.user);
      const active = session.data.session.activeOrganizationId ?? '';
      if (!active) {
        // Pas d'organisation active : compte neuf (l'org n'est plus créée à
        // l'inscription) ou invité pas encore rattaché. La route `/onboarding`
        // crée/active l'org puis ouvre le wizard.
        window.location.assign('/onboarding');
        return;
      }
      // Gating : l'accès à l'espace authentifié exige l'onboarding obligatoire
      // terminé (`completedObligatoryAt`). Sinon on renvoie au wizard — l'index
      // route `/onboarding` rouvre l'étape courante. (`/onboarding/*` est hors
      // `_app`, donc pas de boucle de redirection.) Une panne réseau ici ne doit
      // PAS être lue comme « onboarding incomplet » : elle remonte au catch.
      const progress = await trpc.onboarding.get.query();
      if (!progress?.completedObligatoryAt) {
        window.location.assign('/onboarding');
        return;
      }
      const [list, member] = await Promise.all([
        authClient.organization.list(),
        authClient.organization.getActiveMember(),
      ]);
      const items: Organization[] = (list.data ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        role: o.id === active ? roleLabel(member.data?.role) : 'Membre',
      }));
      setOrgs(items);
      setActiveId(active || items[0]?.id || '');
      setPhase('ready');
    } catch (err) {
      // Panne réseau (hors-ligne / fetch échoué) : écran hors-ligne + reprise
      // auto au retour du réseau. Les vraies erreurs serveur remontent à
      // l'ErrorBoundary Sentry du root.
      if (isNetworkError(err)) {
        setPhase('offline');
        return;
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function switchOrg(id: string) {
    if (id === activeId) return;
    const { error } = await authClient.organization.setActive({ organizationId: id });
    // Reload volontaire : recharge le shell avec la nouvelle org active (permissions, rôle).
    if (!error) window.location.reload();
  }

  async function signOut() {
    await authClient.signOut();
    window.location.assign('/signin');
  }

  if (phase === 'offline') {
    return <OfflineScreen onRetry={() => void load()} />;
  }

  if (phase === 'loading') {
    return <__PROJECT_NAME__Loader />;
  }

  const settingsActive = pathname.startsWith('/settings');
  /** Items du rail enrichis du flag `active` (calculé sur `pathname`). */
  const railItems = RAIL.map((item) => ({
    ...item,
    active: isRailItemActive(item, pathname),
  }));

  return (
    <>
      <AppShell
        topbar={
          <Topbar
            start={
              <>
                <Link to="/" aria-label="__PROJECT_NAME__ — accueil">
                  <__PROJECT_NAME__Symbol size={24} />
                </Link>
                {orgs.length > 0 && activeId ? (
                  <OrgSwitcher
                    organizations={orgs}
                    activeId={activeId}
                    onSelect={switchOrg}
                    onCreateOrg={() => window.location.assign('/onboarding?create=true')}
                    onAcceptInvite={() => window.location.assign('/invitations')}
                  />
                ) : null}
                {activeId ? <EstablishmentSwitcher /> : null}
              </>
            }
            end={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border bg-card hover:bg-subtle flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 transition-colors"
                    aria-label="Menu utilisateur"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-subtle text-foreground text-xs font-semibold">
                        {user?.name.charAt(0).toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-terre-900 hidden max-w-[140px] truncate text-sm font-medium sm:block">
                      {user?.name ?? '…'}
                    </span>
                    <ChevronDown className="text-terre-500 h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <span className="block">{user?.name}</span>
                    <span className="text-muted-foreground block text-xs font-normal">
                      {user?.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void navigate({ to: '/settings/profile' })}>
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void signOut()}>
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        }
        sidebar={settingsActive ? <SettingsNav /> : undefined}
        rail={
          <SidebarRail aria-label="Navigation principale">
            {railItems.map((item) => {
              const Icon = item.icon;
              if (item.soon) {
                return (
                  <NavIcon
                    key={item.href}
                    icon={<Icon className="h-5 w-5" />}
                    label={`${item.label} — bientôt`}
                    disabled
                    className="cursor-not-allowed opacity-40"
                  />
                );
              }
              return (
                <NavIcon
                  key={item.href}
                  icon={<Icon className="h-5 w-5" />}
                  label={item.label}
                  active={item.active}
                  signatureColor={ACCENT}
                  onClick={() => void navigate({ to: item.href })}
                />
              );
            })}
            <div className="flex-1" />
            <NavIcon
              icon={<Settings className="h-5 w-5" />}
              label="Paramètres"
              active={settingsActive}
              signatureColor={ACCENT}
              onClick={() => void navigate({ to: '/settings/team' })}
            />
          </SidebarRail>
        }
      >
        {/* Padding bas pour ne pas cacher le bas du contenu derrière la BottomNav mobile. */}
        <div className="pb-[72px] lg:pb-0">
          <Outlet />
        </div>
      </AppShell>

      {/* BottomNav mobile (<lg) — fixed bottom, par-dessus le content. */}
      <BottomNav className="lg:hidden">
        {RAIL.filter((i) => !i.soon).map((item) => {
          const Icon = item.icon;
          const active = isRailItemActive(item, pathname);
          return (
            <BottomNavItem
              key={item.href}
              icon={<Icon className="h-5 w-5" />}
              label={item.label}
              active={active}
              onClick={() => void navigate({ to: item.href })}
            />
          );
        })}
        <BottomNavItem
          icon={<Settings className="h-5 w-5" />}
          label="Paramètres"
          active={settingsActive}
          onClick={() => void navigate({ to: '/settings/team' })}
        />
      </BottomNav>
    </>
  );
}
