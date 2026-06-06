/**
 * appRouter — aggregate of all tRPC sub-routers.
 *
 * Generic boilerplate core: infra routers + a single `example` vertical.
 * Add your own routers here (duplicate `example`).
 */
import { router, createCallerFactory } from './trpc';
import { healthRouter } from './routers/health';
import { rbacRouter } from './routers/rbac';
import { onboardingRouter } from './routers/onboarding';
import { organizationRouter } from './routers/organization';
import { invitationRouter } from './routers/invitation';
import { memberRouter } from './routers/member';
import { establishmentsRouter } from './routers/establishments';
import { auditRouter } from './routers/audit';
import { statusRouter } from './routers/status';
import { exampleRouter } from './routers/example';

export const appRouter = router({
  health: healthRouter,
  rbac: rbacRouter,
  onboarding: onboardingRouter,
  organization: organizationRouter,
  invitation: invitationRouter,
  member: memberRouter,
  establishments: establishmentsRouter,
  audit: auditRouter,
  status: statusRouter,
  // Example product vertical (duplicate this for your own modules).
  example: exampleRouter,
});

export type AppRouter = typeof appRouter;

/** Server caller — used by apps/api for the public /status.json. */
export const createCaller = createCallerFactory(appRouter);
