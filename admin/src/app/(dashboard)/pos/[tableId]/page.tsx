import { notFound } from 'next/navigation';
import { PosScreen } from '@/components/pos/PosScreen';
import { requirePermission } from '@/lib/guard';
import { getTablePos, getMenuItems, getWaiterOptions, getMergeTargets } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function PosPage({ params }: { params: Promise<{ tableId: string }> }) {
  await requirePermission('manage:orders');
  const { tableId } = await params;
  const [pos, menu, waiters, mergeTargets] = await Promise.all([
    getTablePos(tableId),
    getMenuItems().catch(() => []),
    getWaiterOptions().catch(() => []),
    getMergeTargets(tableId).catch(() => []),
  ]);
  if (!pos.table) notFound();
  return (
    <PosScreen
      table={pos.table}
      session={pos.session}
      menu={menu}
      waiters={waiters}
      mergeTargets={mergeTargets}
    />
  );
}
