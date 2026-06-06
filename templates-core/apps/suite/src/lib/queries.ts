/**
 * React Query key helpers + shared tRPC hooks.
 *
 * Centralises queryKeys (consistent invalidation) and shared queries reused by
 * several components (e.g. establishments) so they dedupe via the cache.
 */
import { useQuery } from '@tanstack/react-query';
import { trpc } from './trpc-client';

/* ─── Keys ─────────────────────────────────────────────────────────────────── */

export const qk = {
  establishments: ['establishments', 'mine'] as const,
};

/* ─── Shared hooks ───────────────────────────────────────────────────────────── */

/** Current user's establishments — shared by several components (single network call). */
export function useEstablishments() {
  return useQuery({
    queryKey: qk.establishments,
    queryFn: () => trpc.establishments.listMine.query(),
    staleTime: 5 * 60_000,
  });
}

/** Map id → establishment name (for visibility badges). */
export function useEstablishmentNames() {
  const { data } = useEstablishments();
  return new Map((data ?? []).map((e) => [e.id, e.name]));
}
