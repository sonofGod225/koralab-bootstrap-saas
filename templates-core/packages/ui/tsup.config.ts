/**
 * tsup — build de `@__SCOPE__/ui` (Story 2.1).
 *
 * Produit `dist/` : un bundle ESM + déclarations `.d.ts` par entrée, en
 * miroir de l'arborescence `src/` (`dist/components/ui/button.js`,
 * `dist/primitives/money-display.js`, `dist/index.js`, …).
 *
 * Contexte : le monorepo consomme les packages internes via leur **source**
 * (cf. `packages/db`, `packages/rpc`, `packages/types`) — les `exports` de
 * `package.json` pointent volontairement sur `./src/*`. Ce build sert donc
 * de cible de **validation CI** et de **publication future** ; il n'est pas
 * (encore) le chemin consommé par les apps. Voir ADR 0010.
 *
 * `react` / `react-dom` sont externalisés (peerDependencies) ; tsup
 * externalise automatiquement les autres `dependencies`.
 */

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/lib/*.ts',
    'src/lib/*.tsx',
    'src/primitives/index.ts',
    'src/primitives/*.tsx',
    'src/components/ui/*.tsx',
    'src/layouts/*.tsx',
  ],
  format: ['esm'],
  target: 'es2022',
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // Le tsconfig partagé active `incremental` + `baseUrl` (déprécié en TS 6) ;
  // on les neutralise pour l'émission des `.d.ts` (build standalone, sans
  // build-info ni résolution baseUrl — les imports source sont relatifs).
  dts: {
    compilerOptions: {
      incremental: false,
      composite: false,
      ignoreDeprecations: '6.0',
    },
  },
});
