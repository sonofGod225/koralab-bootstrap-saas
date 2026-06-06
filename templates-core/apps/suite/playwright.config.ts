/**
 * Configuration Playwright e2e (apps/suite) — socle posé Story (consolidation
 * pré-Epic 8, garde-fou ADR 0013).
 *
 * Lancement local :
 *   pnpm --filter @__SCOPE__/suite exec playwright install chromium   # 1re fois
 *   pnpm dev                       # stack complète (suite 9100 + api 9187)
 *   E2E_NO_SERVER=1 pnpm --filter @__SCOPE__/suite test:e2e
 *
 * Sans `E2E_NO_SERVER`, Playwright démarre le front suite lui-même (webServer).
 * Le smoke test (page /signin) ne nécessite pas de DB ; les specs adossées aux
 * données (isolation cross-établissement) exigent l'API + une DB de test seedée
 * (cf. e2e/README.md). Le `DATABASE_URL` / `BETTER_AUTH_SECRET` ne sont pas
 * gérés ici — ils relèvent de l'environnement (`.dev.vars`, secrets CI).
 */
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:9100';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Démarre le front suite si on ne pointe pas déjà sur un serveur lancé à la
  // main (`E2E_NO_SERVER=1`). En local, réutilise un serveur existant.
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: 'pnpm --filter @__SCOPE__/suite dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
