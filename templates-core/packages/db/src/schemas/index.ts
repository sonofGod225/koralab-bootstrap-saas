/**
 * Drizzle schema index — aggregates all modules for the client.
 * Infra schemas + one example vertical. Add your own with `export * from './<x>'`.
 */
export * from './identity';
export * from './audit';
export * from './rbac';
export * from './onboarding';
export * from './establishments';
// Example vertical (duplicate for your own domain).
export * from './example';
