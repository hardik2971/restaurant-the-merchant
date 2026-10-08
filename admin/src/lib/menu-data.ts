// Menu seed data — mirrors the public site's lib/content.ts so the admin and
// website share one menu. Phase 4 (DB live) replaces this with Prisma queries;
// prisma/seed.ts loads the same items into MySQL.
import type { MenuCategory } from '@/schemas/menu';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  tag: string;
  category: MenuCategory;
  imageUrl: string;
  available: boolean;
}

const img = (id: string, w = 400): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Truffle Risotto', description: 'Carnaroli rice, black truffle, aged parmesan, herb oil.', price: 26, rating: 4.8, tag: 'Chef’s Pick', category: 'Main Meals', imageUrl: img('1476124369491-e7addf5db371'), available: true },
  { id: 'm2', name: 'Charred Octopus', description: 'Spanish octopus, smoked paprika, salsa verde, fingerling potato.', price: 29, rating: 4.9, tag: 'Popular', category: 'Fish', imageUrl: img('1565299624946-b28f40a0ae38'), available: true },
  { id: 'm3', name: 'Dry-aged Ribeye', description: '45-day aged ribeye, bone marrow butter, charred shallot.', price: 48, rating: 5.0, tag: 'Signature', category: 'Main Meals', imageUrl: img('1546964124-0cce460f38ef'), available: true },
  { id: 'm4', name: 'Garden Burrata', description: 'Creamy burrata, heirloom tomato, basil, aged balsamic.', price: 19, rating: 4.7, tag: 'Vegetarian', category: 'Starters', imageUrl: img('1608897013039-887f21d8c804'), available: true },
  { id: 'm5', name: 'Saffron Paella', description: 'Bomba rice, prawns, mussels, chorizo, saffron broth.', price: 34, rating: 4.8, tag: 'Sharing', category: 'Fish', imageUrl: img('1534080564583-6be75777b70a'), available: true },
  { id: 'm6', name: 'Dark Chocolate Tart', description: '70% ganache, sea salt, olive oil, crème fraîche.', price: 14, rating: 4.9, tag: 'Dessert', category: 'Desserts', imageUrl: img('1571877227200-a0d98ea607e9'), available: true },
  { id: 'm7', name: 'Shakshuka & Eggs', description: 'Slow-cooked tomato, peppers, baked eggs, warm flatbread.', price: 16, rating: 4.8, tag: 'Brunch', category: 'Breakfast', imageUrl: img('1590412200988-a436970781fa'), available: true },
  { id: 'm8', name: 'Heirloom Tomato Salad', description: 'Vine tomatoes, stracciatella, basil oil, toasted pine nuts.', price: 17, rating: 4.7, tag: 'Fresh', category: 'Pasta & Salads', imageUrl: img('1512621776951-a57141f2eefd'), available: true },
  { id: 'm9', name: 'Pomegranate Spritz', description: 'Pomegranate, prosecco, citrus, fresh mint, soda.', price: 12, rating: 4.9, tag: 'Signature', category: 'Drinks', imageUrl: img('1551024709-8f23befc6f87'), available: true },
  { id: 'm10', name: 'Avocado Toast', description: 'Sourdough, smashed avocado, chili, lemon, soft poached egg.', price: 14, rating: 4.7, tag: 'Brunch', category: 'Breakfast', imageUrl: img('1513104890138-7c749659a591'), available: true },
  { id: 'm11', name: 'Buttermilk Pancakes', description: 'Stacked pancakes, maple butter, seasonal berries.', price: 13, rating: 4.8, tag: 'Sweet', category: 'Breakfast', imageUrl: img('1473093295043-cdd812d0e601'), available: false },
  { id: 'm12', name: 'Roasted Tomato Soup', description: 'Slow-roasted tomato, basil oil, sourdough crouton.', price: 11, rating: 4.6, tag: 'Warm', category: 'Starters', imageUrl: img('1556910103-1c02745aae4d'), available: true },
  { id: 'm13', name: 'Crispy Calamari', description: 'Lightly fried squid, lemon aioli, fresh herbs.', price: 16, rating: 4.8, tag: 'Popular', category: 'Starters', imageUrl: img('1565299624946-b28f40a0ae38'), available: true },
  { id: 'm14', name: 'Herb Roast Chicken', description: 'Free-range chicken, lemon, thyme, roasted potatoes.', price: 28, rating: 4.7, tag: 'Classic', category: 'Main Meals', imageUrl: img('1504674900247-0877df9cc836'), available: true },
  { id: 'm15', name: 'Grilled Sea Bass', description: 'Whole sea bass, salsa verde, charred lemon, fennel.', price: 32, rating: 4.9, tag: 'Chef’s Pick', category: 'Fish', imageUrl: img('1467003909585-2f8a72700288'), available: true },
  { id: 'm16', name: 'Tagliatelle al Ragù', description: 'House-made pasta, slow-cooked beef ragù, parmesan.', price: 23, rating: 4.8, tag: 'Popular', category: 'Pasta & Salads', imageUrl: img('1551183053-bf91a1d81141'), available: true },
  { id: 'm17', name: 'Caesar Salad', description: 'Baby gem, anchovy dressing, parmesan, sourdough croutons.', price: 15, rating: 4.6, tag: 'Fresh', category: 'Pasta & Salads', imageUrl: img('1512621776951-a57141f2eefd'), available: true },
  { id: 'm18', name: 'Classic Tiramisu', description: 'Espresso-soaked savoiardi, mascarpone, cocoa.', price: 13, rating: 4.9, tag: 'Signature', category: 'Desserts', imageUrl: img('1571877227200-a0d98ea607e9'), available: true },
  { id: 'm19', name: 'Lemon Cheesecake', description: 'Baked vanilla cheesecake, lemon curd, shortbread base.', price: 12, rating: 4.7, tag: 'Sweet', category: 'Desserts', imageUrl: img('1473093295043-cdd812d0e601'), available: false },
  { id: 'm20', name: 'Espresso Martini', description: 'Vodka, fresh espresso, coffee liqueur, vanilla.', price: 14, rating: 4.9, tag: 'Popular', category: 'Drinks', imageUrl: img('1466978913421-dad2ebd01d17'), available: true },
  { id: 'm21', name: 'Aperol Sunset', description: 'Aperol, prosecco, soda, blood orange, rosemary.', price: 12, rating: 4.7, tag: 'Refreshing', category: 'Drinks', imageUrl: img('1525755662778-989d0524087e'), available: true },
];
