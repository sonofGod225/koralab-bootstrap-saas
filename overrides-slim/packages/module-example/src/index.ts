/**
 * @__SCOPE__/module-example — public entry point of the module.
 *
 * Boundary rule (enforced by @__SCOPE__/config/eslint/module.js): this module imports
 * only @__SCOPE__/ui and its own files. It knows nothing about apps/suite or any other
 * module, and owns NO routing — apps/suite mounts it on a URL (see
 * apps/suite/src/routes/_app/example.tsx + example.lazy.tsx).
 */
export { ExamplePage } from './example-page';
export type { Item, ItemStatus } from './lib/example';
export { countByStatus } from './lib/example';
