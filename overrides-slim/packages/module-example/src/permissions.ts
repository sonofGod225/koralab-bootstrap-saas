/**
 * RBAC permission manifest for the Example module (uni-directional: rbac → module).
 *
 * Pure-data sub-export (`@__SCOPE__/module-example/permissions`): an `as const` object
 * with NO dependency — not UI/React, not @__SCOPE__/rbac. The @__SCOPE__/rbac registry
 * aggregates it. Do NOT `import type { ModuleManifest }` here (it would create a
 * rbac ↔ module package cycle that Turbo rejects); the shape is validated at the
 * aggregation site in @__SCOPE__/rbac.
 */
export const examplePermissions = {
  module: 'example',
  label: 'Example',
  icon: 'box',
  resources: [{ id: 'item', label: 'Item' }],
  actions: ['read', 'create', 'update', 'delete'],
} as const;
