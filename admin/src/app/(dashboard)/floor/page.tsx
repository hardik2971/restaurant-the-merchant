import { FloorPlan } from '@/components/floor/FloorPlan';
import { requirePermission } from '@/lib/guard';
import { getFloorTables, getWaiterOptions } from '@/lib/queries';

// Live floor — always fetch fresh table states.
export const dynamic = 'force-dynamic';

export default async function FloorPage() {
  await requirePermission('manage:tables');
  const [tables, waiters] = await Promise.all([
    getFloorTables().catch(() => []),
    getWaiterOptions().catch(() => []),
  ]);
  return <FloorPlan initialTables={tables} waiters={waiters} />;
}
