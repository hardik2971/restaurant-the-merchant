import { describe, it, expect } from 'vitest';
import { stockStatus, type InventoryItem } from '@/lib/inventory-data';

const item = (quantity: number, reorderLevel: number): InventoryItem => ({
  id: 'x',
  name: 'Test',
  category: 'Dry Goods',
  unit: 'kg',
  quantity,
  reorderLevel,
  costPerUnit: 1,
  supplier: '',
});

describe('inventory stockStatus', () => {
  it('OUT when quantity is zero', () => {
    expect(stockStatus(item(0, 5))).toBe('OUT');
  });
  it('LOW when at or below reorder level', () => {
    expect(stockStatus(item(5, 5))).toBe('LOW');
    expect(stockStatus(item(3, 5))).toBe('LOW');
  });
  it('IN_STOCK when above reorder level', () => {
    expect(stockStatus(item(6, 5))).toBe('IN_STOCK');
  });
});
