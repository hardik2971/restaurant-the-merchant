import { z } from 'zod';

export const INVENTORY_CATEGORIES = [
  'Produce',
  'Meat & Fish',
  'Dairy',
  'Beverage',
  'Dry Goods',
  'Bakery',
] as const;

export const inventoryItemSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  category: z.enum(INVENTORY_CATEGORIES),
  unit: z.string().min(1, 'Unit is required'),
  quantity: z.coerce.number().min(0),
  reorderLevel: z.coerce.number().min(0),
  costPerUnit: z.coerce.number().min(0),
  supplier: z.string().optional(),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];
