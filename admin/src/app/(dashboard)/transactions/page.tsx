import { TransactionsView } from '@/components/transactions/TransactionsView';
import { requirePermission } from '@/lib/guard';
import { getTransactions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  await requirePermission('view:reports');
  const transactions = await getTransactions().catch(() => []);
  return <TransactionsView transactions={transactions} />;
}
