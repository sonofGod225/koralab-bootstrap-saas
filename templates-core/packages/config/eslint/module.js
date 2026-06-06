/**
 * Preset ESLint des modules produit (`packages/module-*`).
 *
 * Étend la config React et VERROUILLE MÉCANIQUEMENT la frontière de modularité
 * décidée en archi (la pièce « non négociable ») :
 *
 *   Un module ne peut importer QUE `@__SCOPE__/ui`, `@__SCOPE__/types`,
 *   `@__SCOPE__/config` et des libs externes. Il lui est INTERDIT d'importer :
 *     - un autre module          (`@__SCOPE__/module-*`)
 *     - une application          (`@__SCOPE__/suite`, `@__SCOPE__/admin`, `@__SCOPE__/api`)
 *
 * Ainsi un module reste autonome et extractible : le jour où l'on voudra le
 * déployer indépendamment, il n'a aucune arête entrante interdite à défaire.
 *
 * Mécanisme : `eslint-plugin-boundaries` règle `external` — contrôle les
 * dépendances node_modules (donc les packages workspace) autorisées par type
 * d'élément. Tous les fichiers d'un module sont classés type `module`.
 */
import boundaries from 'eslint-plugin-boundaries';

import reactConfig from './react.js';

export default [
  ...reactConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [{ type: 'module', pattern: 'src/**', mode: 'full' }],
    },
    rules: {
      'boundaries/external': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['module'],
              disallow: [
                '@__SCOPE__/module-*',
                '@__SCOPE__/suite',
                '@__SCOPE__/admin',
                '@__SCOPE__/api',
              ],
              message:
                "Frontière de modularité : un module ne peut importer ni un autre module ni une application. N'importez que @__SCOPE__/ui, @__SCOPE__/types ou des libs externes.",
            },
          ],
        },
      ],
    },
  },
];
