/**
 * Module access gating (generic core).
 *
 * The generic boilerplate has no plan/subscription entitlement, so every module
 * is considered active. Replace these with your own entitlement source (e.g. a
 * billing/subscription tRPC query) when you introduce gated modules.
 */

/** Codes of active modules for the org. Generic core: the example module. */
export async function getActiveModules(): Promise<Set<string>> {
  return new Set<string>(['example']);
}

/** Generic core: every module is active. */
export async function isModuleActive(_code: string): Promise<boolean> {
  return true;
}

/** No-op in the generic core (no entitlement cache to invalidate). */
export function invalidateModuleAccess(): void {}
