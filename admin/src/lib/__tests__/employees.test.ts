import { describe, it, expect } from 'vitest';
import { EMPLOYEES, statusCounts } from '@/lib/employees-data';

describe('employees data', () => {
  it('generates exactly 120 employees', () => {
    expect(EMPLOYEES).toHaveLength(120);
  });

  it('status distribution matches the dashboard gauge', () => {
    const counts = statusCounts();
    expect(counts.ON_DUTY).toBe(83);
    expect(counts.ON_BREAK).toBe(10);
    expect(counts.ABSENT).toBe(7);
    expect(counts.OFF).toBe(20);
    expect(counts.ON_DUTY + counts.ON_BREAK + counts.ABSENT + counts.OFF).toBe(120);
  });

  it('is sorted by name', () => {
    const names = EMPLOYEES.map((e) => e.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
});
