import baseConfig from './base.js';

export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      globals: {
        // Cloudflare Workers globals
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        crypto: 'readonly',
        fetch: 'readonly',
        addEventListener: 'readonly',
        ExecutionContext: 'readonly',
        ScheduledEvent: 'readonly',
        MessageBatch: 'readonly',
        Queue: 'readonly',
        KVNamespace: 'readonly',
        R2Bucket: 'readonly',
        DurableObjectNamespace: 'readonly',
      },
    },
  },
];
