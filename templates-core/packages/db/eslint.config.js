import baseConfig from '@__SCOPE__/config/eslint/base.js';

export default [
  ...baseConfig,
  {
    ignores: ['dist/', 'node_modules/', 'migrations/', 'drizzle.config.ts', 'scripts/'],
  },
];
