/**
 * Pure business logic of the Example module — no UI/network dependency, so it is
 * testable in isolation via the package's own vitest.
 */
export type ItemStatus = 'draft' | 'active' | 'archived';

export interface Item {
  id: string;
  name: string;
  status: ItemStatus;
}

/** Counts items by status. Always returns all keys (0 by default). */
export function countByStatus(items: Item[]): Record<ItemStatus, number> {
  const counts: Record<ItemStatus, number> = { draft: 0, active: 0, archived: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}
