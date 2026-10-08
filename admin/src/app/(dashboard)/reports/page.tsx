import { ReportsView } from '@/components/reports/ReportsView';
import { requirePermission } from '@/lib/guard';
import { getReportsData, type ReportsData } from '@/lib/queries';

// Minimal fallback if MySQL is unreachable, so the page still renders.
const FALLBACK: ReportsData = {
  summary: { revenue: 0, orders: 0, itemsSold: 0, avgOrder: 0 },
  revenueByOutlet: [],
  topItems: [],
  categoryMix: [],
  orderTypes: [
    { type: 'Dine-in', count: 0 },
    { type: 'Delivery', count: 0 },
    { type: 'Pick-up', count: 0 },
  ],
  paymentMix: [
    { method: 'Cash', count: 0 },
    { method: 'Card', count: 0 },
    { method: 'Online', count: 0 },
  ],
};

export default async function ReportsPage() {
  await requirePermission('view:reports');
  const data = await getReportsData().catch(() => FALLBACK);
  return <ReportsView data={data} />;
}
