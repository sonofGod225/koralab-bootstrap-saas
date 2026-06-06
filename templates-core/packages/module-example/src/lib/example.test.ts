import { describe, expect, it } from 'vitest';

import { countByStatus, type Item } from './example';

describe('countByStatus', () => {
  it('counts items per status and defaults missing keys to 0', () => {
    const items: Item[] = [
      { id: '1', name: 'A', status: 'active' },
      { id: '2', name: 'B', status: 'active' },
      { id: '3', name: 'C', status: 'draft' },
    ];
    expect(countByStatus(items)).toEqual({ draft: 1, active: 2, archived: 0 });
  });
});
