import { TablesManager } from '@/components/tables/TablesManager';
import { requirePermission } from '@/lib/guard';
import { getTables } from '@/lib/queries';
import { TABLES } from '@/lib/tables-data';

export default async function TablesPage() {
  await requirePermission('manage:tables');
  const tables = await getTables().catch(() => TABLES);
  return <TablesManager initialTables={tables} />;
}
