import { TableAnalyticsView } from '@/components/analytics/TableAnalyticsView';
import { requirePermission } from '@/lib/guard';
import { getTableAnalytics } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function TableAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requirePermission('view:reports');
  const { days } = await searchParams;
  const d = [1, 7, 30].includes(Number(days)) ? Number(days) : 1;
  const data = await getTableAnalytics(d);
  return <TableAnalyticsView data={data} />;
}
