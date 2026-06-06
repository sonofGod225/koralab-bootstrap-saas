//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    // Outils hors `src/` (non couverts par le tsconfig typé du lint) — la
    // sûreté de type des e2e passe par `e2e/tsconfig.json` (cf. script typecheck).
    ignores: ['eslint.config.js', 'prettier.config.js', 'playwright.config.ts', 'e2e/**'],
  },
];
