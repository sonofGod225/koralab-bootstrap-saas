import workerConfig from '@__SCOPE__/config/eslint/worker.js';

export default [
  ...workerConfig,
  {
    ignores: ['dist/**', '.wrangler/**', 'node_modules/**'],
  },
];
