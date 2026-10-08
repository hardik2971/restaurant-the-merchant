import { OutletsManager } from '@/components/outlets/OutletsManager';
import { requirePermission } from '@/lib/guard';
import { getOutlets } from '@/lib/queries';
import { OUTLETS } from '@/lib/outlets-data';

export default async function OutletsPage() {
  await requirePermission('manage:outlets');
  const outlets = await getOutlets().catch(() => OUTLETS);
  return <OutletsManager outlets={outlets} />;
}
