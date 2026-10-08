import { MenuManager } from '@/components/menu/MenuManager';
import { requirePermission } from '@/lib/guard';
import { getMenuItems, getMenuCategories } from '@/lib/queries';
import { MENU_ITEMS } from '@/lib/menu-data';

export default async function MenuPage() {
  await requirePermission('manage:menu');
  // Live from MySQL; fall back to seed data if the DB is unreachable.
  const [items, categories] = await Promise.all([
    getMenuItems().catch(() => MENU_ITEMS),
    getMenuCategories().catch(() => []),
  ]);
  return <MenuManager initialItems={items} initialCategories={categories} />;
}
