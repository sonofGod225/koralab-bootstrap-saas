import reactConfig from '@__SCOPE__/config/eslint/react.js';

export default [
  ...reactConfig,
  {
    ignores: ['dist/', 'node_modules/', 'fonts/', 'scripts/'],
  },
];
