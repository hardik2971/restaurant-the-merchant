import { TableHistoryView } from '@/components/analytics/TableHistoryView';
import { requirePermission } from '@/lib/guard';
import { getTableHistory } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function TableHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  await requirePermission('view:reports');
  const { tableId } = await params;
  const { days } = await searchParams;
  const d = [1, 7, 30].includes(Number(days)) ? Number(days) : 30;
  const data = await getTableHistory(tableId, d);
  return <TableHistoryView data={data} days={d} />;
}
