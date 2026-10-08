// Inventory seed/fallback data. Phase 10 (DB live) replaces this with Prisma
// queries over the InventoryItem model; prisma/seed.ts loads these rows.
import type { InventoryCategory } from '@/schemas/inventory';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  quantity: number;
  reorderLevel: number;
  costPerUnit: number;
  supplier: string;
}

export const INVENTORY_ITEMS: InventoryItem[] = [
  { id: 'i1', name: 'Sea Bass (whole)', category: 'Meat & Fish', unit: 'kg', quantity: 18, reorderLevel: 10, costPerUnit: 22, supplier: 'Boston Seafood Co.' },
  { id: 'i2', name: 'Dry-aged Ribeye', category: 'Meat & Fish', unit: 'kg', quantity: 6, reorderLevel: 8, costPerUnit: 34, supplier: 'Prime Cuts' },
  { id: 'i3', name: 'Spanish Octopus', category: 'Meat & Fish', unit: 'kg', quantity: 9, reorderLevel: 6, costPerUnit: 19, supplier: 'Boston Seafood Co.' },
  { id: 'i4', name: 'Carnaroli Rice', category: 'Dry Goods', unit: 'kg', quantity: 40, reorderLevel: 15, costPerUnit: 4, supplier: 'Italiano Imports' },
  { id: 'i5', name: 'Bomba Rice', category: 'Dry Goods', unit: 'kg', quantity: 12, reorderLevel: 10, costPerUnit: 6, supplier: 'Italiano Imports' },
  { id: 'i6', name: 'Black Truffle', category: 'Produce', unit: 'g', quantity: 120, reorderLevel: 150, costPerUnit: 3, supplier: 'Forage Fine Foods' },
  { id: 'i7', name: 'Heirloom Tomatoes', category: 'Produce', unit: 'kg', quantity: 22, reorderLevel: 12, costPerUnit: 5, supplier: 'Green Valley Farm' },
  { id: 'i8', name: 'Burrata', category: 'Dairy', unit: 'units', quantity: 14, reorderLevel: 20, costPerUnit: 4, supplier: 'Latteria Co.' },
  { id: 'i9', name: 'Parmesan (aged)', category: 'Dairy', unit: 'kg', quantity: 8, reorderLevel: 5, costPerUnit: 18, supplier: 'Latteria Co.' },
  { id: 'i10', name: 'Mascarpone', category: 'Dairy', unit: 'kg', quantity: 4, reorderLevel: 6, costPerUnit: 9, supplier: 'Latteria Co.' },
  { id: 'i11', name: 'Prosecco', category: 'Beverage', unit: 'bottles', quantity: 36, reorderLevel: 24, costPerUnit: 11, supplier: 'Vine & Vault' },
  { id: 'i12', name: 'Espresso Beans', category: 'Beverage', unit: 'kg', quantity: 15, reorderLevel: 8, costPerUnit: 14, supplier: 'Roast House' },
  { id: 'i13', name: 'Vodka', category: 'Beverage', unit: 'bottles', quantity: 7, reorderLevel: 10, costPerUnit: 16, supplier: 'Vine & Vault' },
  { id: 'i14', name: 'Sourdough Loaf', category: 'Bakery', unit: 'units', quantity: 0, reorderLevel: 12, costPerUnit: 3, supplier: 'Daily Bread' },
  { id: 'i15', name: 'Savoiardi', category: 'Bakery', unit: 'packs', quantity: 9, reorderLevel: 6, costPerUnit: 2, supplier: 'Daily Bread' },
  { id: 'i16', name: 'Dark Chocolate (70%)', category: 'Dry Goods', unit: 'kg', quantity: 11, reorderLevel: 5, costPerUnit: 12, supplier: 'Cacao Trade' },
];

export type StockStatus = 'IN_STOCK' | 'LOW' | 'OUT';

export function stockStatus(item: InventoryItem): StockStatus {
  if (item.quantity <= 0) return 'OUT';
  if (item.quantity <= item.reorderLevel) return 'LOW';
  return 'IN_STOCK';
}
