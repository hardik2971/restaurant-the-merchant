import { CustomersManager } from '@/components/customers/CustomersManager';
import { requirePermission } from '@/lib/guard';
import { getCustomers } from '@/lib/queries';
import { CUSTOMERS } from '@/lib/customers-data';

export default async function CustomersPage() {
  await requirePermission('manage:customers');
  const customers = await getCustomers().catch(() => CUSTOMERS);
  return <CustomersManager initialCustomers={customers} />;
}
