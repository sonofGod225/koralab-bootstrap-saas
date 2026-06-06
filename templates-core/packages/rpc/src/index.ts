/**
 * @__SCOPE__/rpc — tRPC server entry
 *
 * Exporté vers `apps/api` qui monte le router via `@hono/trpc-server`.
 * Pour le **client TS type-safe**, voir `@__SCOPE__/rpc/client` (type-only export).
 */
export { appRouter, type AppRouter, createCaller } from './router';
export { createContext, type RpcContext, type RpcEnv, type CreateContextOptions } from './context';
export { getOwnerEmailForOrganization } from './services/organization-queries';
export {
  router,
  publicProcedure,
  protectedProcedure,
  orgProcedure,
  appProcedure,
  auditedProtectedProcedure,
  staffProcedure,
  auditedStaffProcedure,
  trpcError,
} from './trpc';
export { auditMiddleware } from './middleware/audit';
export { requireStaffRole } from './middleware/require-staff-role';
export { rateLimit, type RateLimitOptions, type Duration } from './middleware/rate-limit';
export { requireMfaForOwners } from './middleware/require-mfa-for-owners';
export { requirePermission } from './middleware/require-permission';
export { requireOnboardingCompleted } from './middleware/require-onboarding-completed';
