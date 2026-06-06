/**
 * /settings — layout de l'espace Paramètres (Story 3.17).
 *
 * Layout pathless qui ajoute le segment `/settings` aux routes enfants
 * (`team`, `organization`, `audit-log`, `team/roles`, `security/2fa`,
 * `security/sessions`). Ne rend plus de sidebar locale — celle-ci est passée
 * au **slot `sidebar` natif de `<AppShell>`** depuis [`_app.tsx`](../_app.tsx)
 * via le composant [`<SettingsNav>`](../../components/settings-nav.tsx) (slot
 * conditionné par `pathname.startsWith('/settings')`).
 *
 * Ce layout fournit donc uniquement le `<main>` qui borne et centre le content
 * des routes settings (max-w-3xl, padding responsive).
 */
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings')({ component: SettingsLayout });

function SettingsLayout() {
  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <Outlet />
      </div>
    </main>
  );
}
