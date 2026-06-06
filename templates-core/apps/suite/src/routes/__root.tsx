import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';

import appCss from '../styles.css?url';
import { initSentry } from '../lib/sentry';
import { initPostHog } from '../lib/posthog';
import { Toaster } from '@__SCOPE__/ui/sonner';
import { queryClient } from '../lib/query-client';
import { MaintenanceBanner } from '../components/maintenance-banner';
import { ConnectionStatus } from '../components/connection-status';

// Story 1.6 — Bootstrap observabilité côté client.
// Appels au niveau module : exécutés à l'import du root route, donc au tout
// début du bootstrap client. Chacun est un no-op côté SSR (garde
// `import.meta.env.SSR`) et si sa clé d'environnement est absente.
initSentry();
initPostHog();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // Theme color : Terre 900 — couleur de la status bar mobile (Story 1.10).
      { name: 'theme-color', content: '#2A1A0F' },
      // Hints PWA iOS (Add to Home Screen).
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: '__PROJECT_NAME__' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'application-name', content: '__PROJECT_NAME__' },
      { title: '__PROJECT_NAME__ — Suite SaaS pour les entreprises africaines' },
      {
        name: 'description',
        content:
          "Suite SaaS modulaire de gestion d'entreprise pour TPE et PME d'Afrique francophone. Facturation, encaissement Wave/Paystack, comptabilité SYSCOHADA, FNE Côte d'Ivoire.",
      },
    ],
    links: [
      // Story 2.3 — Google Fonts (Inter + JetBrains Mono) : preconnect + feuille.
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', href: '/icon-192.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* Story 1.6 — Error Boundary Sentry : capture les erreurs de rendu
            React côté client et affiche un fallback sobre en français. */}
        <Sentry.ErrorBoundary
          fallback={
            <div lang="fr" style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
              <h1>Une erreur est survenue</h1>
              <p>Veuillez rafraîchir la page. Si le problème persiste, contactez le support.</p>
            </div>
          }
        >
          <QueryClientProvider client={queryClient}>
            <MaintenanceBanner />
            <Toaster />
            <ConnectionStatus />
            {children}
          </QueryClientProvider>
        </Sentry.ErrorBoundary>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
