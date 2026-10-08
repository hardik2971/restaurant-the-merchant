import { describe, it, expect } from 'vitest';
import { nextStatuses } from '@/lib/orders-data';

describe('orders nextStatuses (state machine)', () => {
  it('advances forward through the flow and allows cancel', () => {
    expect(nextStatuses('PENDING')).toEqual(['PREPARING', 'CANCELED']);
    expect(nextStatuses('PREPARING')).toEqual(['READY', 'CANCELED']);
    expect(nextStatuses('READY')).toEqual(['COMPLETED', 'CANCELED']);
  });

  it('has no transitions from terminal states', () => {
    expect(nextStatuses('COMPLETED')).toEqual([]);
    expect(nextStatuses('CANCELED')).toEqual([]);
  });
});
