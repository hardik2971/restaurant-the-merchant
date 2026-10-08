import { describe, it, expect } from 'vitest';
import { nextStatuses } from '@/lib/reservations-data';

describe('reservations nextStatuses (kind-aware)', () => {
  it('table bookings can be seated and marked no-show', () => {
    expect(nextStatuses('TABLE', 'REQUESTED')).toEqual(['CONFIRMED', 'CANCELED', 'NO_SHOW']);
    expect(nextStatuses('TABLE', 'CONFIRMED')).toEqual(['SEATED', 'CANCELED', 'NO_SHOW']);
    expect(nextStatuses('TABLE', 'SEATED')).toEqual(['COMPLETED', 'CANCELED', 'NO_SHOW']);
  });

  it('private events skip seating and have no no-show', () => {
    expect(nextStatuses('PRIVATE_EVENT', 'REQUESTED')).toEqual(['CONFIRMED', 'CANCELED']);
    expect(nextStatuses('PRIVATE_EVENT', 'CONFIRMED')).toEqual(['COMPLETED', 'CANCELED']);
  });

  it('terminal states have no transitions', () => {
    expect(nextStatuses('TABLE', 'COMPLETED')).toEqual([]);
    expect(nextStatuses('TABLE', 'CANCELED')).toEqual([]);
    expect(nextStatuses('TABLE', 'NO_SHOW')).toEqual([]);
  });
});
