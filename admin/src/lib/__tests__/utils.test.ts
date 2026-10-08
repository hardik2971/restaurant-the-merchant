import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompact, formatDelta } from '@/lib/utils';

describe('utils formatters', () => {
  it('formatCurrency renders USD with no decimals', () => {
    expect(formatCurrency(15750)).toBe('$15,750');
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formatCompact abbreviates large numbers', () => {
    expect(formatCompact(5_000_000)).toBe('5M');
    expect(formatCompact(1500)).toBe('1.5K');
  });

  it('formatDelta adds a sign', () => {
    expect(formatDelta(7.5)).toBe('+7.5%');
    expect(formatDelta(-3.5)).toBe('-3.5%');
    expect(formatDelta(0)).toBe('0%');
  });
});
