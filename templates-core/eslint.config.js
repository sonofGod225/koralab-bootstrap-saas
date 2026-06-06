import baseConfig from '@__SCOPE__/config/eslint/base.js';

export default [
  ...baseConfig,
  {
    ignores: [
      '**/dist/**',
      '**/.tanstack/**',
      '**/.output/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/coverage/**',
      'docs/design-system/**',
      'docs/ui-designs/**',
    ],
  },
];
