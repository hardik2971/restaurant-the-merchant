import { InventoryManager } from '@/components/inventory/InventoryManager';
import { requirePermission } from '@/lib/guard';
import { getInventory } from '@/lib/queries';
import { INVENTORY_ITEMS } from '@/lib/inventory-data';

export default async function InventoryPage() {
  await requirePermission('manage:inventory');
  const items = await getInventory().catch(() => INVENTORY_ITEMS);
  return <InventoryManager initialItems={items} />;
}
