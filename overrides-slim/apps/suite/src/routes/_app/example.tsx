/**
 * /_app/example — mount point of the Example module (Voie A).
 *
 * This file (critical route) + example.lazy.tsx (component) live in apps/suite and
 * own the ROUTING — path `/example` and the module-activation gate. The module's
 * UI/logic lives in `@__SCOPE__/module-example`, imported ONLY by the lazy shim → a
 * separate chunk, absent from the initial bundle.
 *
 * The pendingComponent (skeleton) is defined HERE, in the critical bundle, so it
 * shows on click — including while the lazy chunk loads. It imports ONLY @__SCOPE__/ui
 * (never the module), otherwise the code-split gate would flag it.
 */
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Skeleton } from '@__SCOPE__/ui/skeleton';

import { isModuleActive } from '../../lib/module-access';

/** Module code in DB (see packages/db/scripts/seed-modules.ts). */
const MODULE_CODE = 'example';

export const Route = createFileRoute('/_app/example')({
  beforeLoad: async () => {
    // Client-only guard: no session cookies during SSR.
    if (import.meta.env.SSR) return;
    if (!(await isModuleActive(MODULE_CODE))) {
      throw redirect({ to: '/settings/modules' });
    }
  },
  pendingMs: 100,
  pendingComponent: ExamplePending,
});

function ExamplePending() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-16">
      <header className="mb-10">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-12 w-64" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </section>
      <Skeleton className="mt-6 h-32 w-full rounded-2xl" />
    </main>
  );
}
