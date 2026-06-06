/**
 * Config Vitest separee de vite.config.ts.
 *
 * Pourquoi ? Le plugin @cloudflare/vite-plugin est incompatible avec
 * l'environnement SSR de Vitest (il force `resolve.external` Node, que
 * Vitest n'accepte pas dans son worker env). On reconstruit donc une
 * config minimale pour les tests unitaires.
 *
 * environment: 'node' — pas de DOM (les tests apps/suite actuels sont
 * juste des assertions JSON sur les fichiers i18n messages). Si futurs
 * tests UI ont besoin de DOM, passer à happy-dom (plus léger que jsdom
 * et sans dépendance ESM problématique html-encoding-sniffer).
 */

import { defineConfig } from 'vitest/config';
import viteReact from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [viteReact()],
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
});
