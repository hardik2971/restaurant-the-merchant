import { z } from 'zod';

export const MENU_CATEGORIES = [
  'Breakfast',
  'Starters',
  'Main Meals',
  'Fish',
  'Pasta & Salads',
  'Desserts',
  'Drinks',
] as const;

export const menuItemSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(4, 'Add a short description'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  rating: z.coerce.number().min(0).max(5).default(0),
  tag: z.string().optional(),
  category: z.enum(MENU_CATEGORIES),
  imageUrl: z.string().url('Enter a valid image URL'),
  available: z.boolean().default(true),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type MenuCategory = (typeof MENU_CATEGORIES)[number];
