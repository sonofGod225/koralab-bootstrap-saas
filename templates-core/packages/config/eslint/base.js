import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Type discipline (cf. architecture.md step 5 patterns)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // No console (use packages/notifications or logger)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Enforce eqeqeq
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // No floating promises (handled by typescript-eslint type-aware lint when configured)
    },
  },
];
