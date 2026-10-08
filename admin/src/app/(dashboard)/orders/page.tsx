import { OrdersManager } from '@/components/orders/OrdersManager';
import { requirePermission } from '@/lib/guard';
import { getOrders } from '@/lib/queries';
import { ORDERS } from '@/lib/orders-data';

export default async function OrdersPage() {
  await requirePermission('manage:orders');
  const orders = await getOrders().catch(() => ORDERS);
  return <OrdersManager initialOrders={orders} />;
}
