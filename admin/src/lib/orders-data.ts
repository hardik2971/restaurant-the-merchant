// Mock orders for the Orders module — built from real menu items. Phase 5 (DB
// live) replaces this with Prisma queries; the shapes mirror the Order/OrderItem
// models in schema.prisma.

export type OrderType = 'DINE_IN' | 'DELIVERY' | 'PICKUP';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELED';
export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE';
export type OrderChannel = 'POS' | 'ONLINE';
export type ScheduleType = 'NOW' | 'LATER';

export interface OrderLine {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  number: string;
  type: OrderType;
  status: OrderStatus;
  channel: OrderChannel;
  paymentMethod: PaymentMethod;
  outlet: string;
  customer: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderLine[];
  total: number;
  // Online ordering — Take Away scheduling (TASK 1)
  scheduleType?: ScheduleType;
  scheduleDate?: string; // ISO date when scheduleType = LATER
  scheduleTime?: string; // "18:30" when scheduleType = LATER
  notes?: string;
  tableNumber?: string; // table-wise QR ordering (TASK 5)
  paymentProvider?: string; // razorpay | stripe
  razorpayPaymentId?: string; // gateway payment reference
  createdAt: string; // ISO
}

const order = (
  o: Omit<Order, 'total' | 'channel'> & { total?: number; channel?: OrderChannel },
): Order => ({
  channel: 'POS',
  ...o,
  total: o.items.reduce((sum, it) => sum + it.qty * it.price, 0),
});

export const ORDERS: Order[] = [
  order({ id: 'o1', number: 'ORD-1042', type: 'DINE_IN', status: 'PREPARING', paymentMethod: 'CASH', outlet: 'Outlet 05', customer: 'Olivia Bennett', createdAt: '2026-06-25T19:05:00', items: [{ name: 'Dry-aged Ribeye', qty: 1, price: 48 }, { name: 'Pomegranate Spritz', qty: 2, price: 12 }] }),
  order({ id: 'o2', number: 'ORD-1041', type: 'DELIVERY', status: 'PENDING', paymentMethod: 'ONLINE', outlet: 'Outlet 03', customer: 'Liam Carter', createdAt: '2026-06-25T18:50:00', items: [{ name: 'Truffle Risotto', qty: 1, price: 26 }, { name: 'Caesar Salad', qty: 1, price: 15 }] }),
  order({ id: 'o3', number: 'ORD-1040', type: 'PICKUP', status: 'READY', paymentMethod: 'CARD', outlet: 'Outlet 02', customer: 'Noah Patel', createdAt: '2026-06-25T18:30:00', items: [{ name: 'Crispy Calamari', qty: 1, price: 16 }, { name: 'Espresso Martini', qty: 1, price: 14 }] }),
  order({ id: 'o4', number: 'ORD-1039', type: 'DINE_IN', status: 'COMPLETED', paymentMethod: 'CARD', outlet: 'Outlet 05', customer: 'Emma Wilson', createdAt: '2026-06-25T17:55:00', items: [{ name: 'Grilled Sea Bass', qty: 2, price: 32 }, { name: 'Classic Tiramisu', qty: 1, price: 13 }] }),
  order({ id: 'o5', number: 'ORD-1038', type: 'DELIVERY', status: 'CANCELED', paymentMethod: 'ONLINE', outlet: 'Outlet 04', customer: 'Sophia Nguyen', createdAt: '2026-06-25T17:40:00', items: [{ name: 'Saffron Paella', qty: 1, price: 34 }] }),
  order({ id: 'o6', number: 'ORD-1037', type: 'DINE_IN', status: 'COMPLETED', paymentMethod: 'CASH', outlet: 'Outlet 01', customer: 'James Murphy', createdAt: '2026-06-25T17:20:00', items: [{ name: 'Herb Roast Chicken', qty: 1, price: 28 }, { name: 'Garden Burrata', qty: 1, price: 19 }] }),
  order({ id: 'o7', number: 'ORD-1036', type: 'PICKUP', status: 'COMPLETED', paymentMethod: 'CARD', outlet: 'Outlet 02', customer: 'Ava Thompson', createdAt: '2026-06-25T16:58:00', items: [{ name: 'Charred Octopus', qty: 1, price: 29 }, { name: 'Aperol Sunset', qty: 2, price: 12 }] }),
  order({ id: 'o8', number: 'ORD-1035', type: 'DINE_IN', status: 'PENDING', paymentMethod: 'CASH', outlet: 'Outlet 05', customer: 'William Reed', createdAt: '2026-06-25T16:40:00', items: [{ name: 'Tagliatelle al Ragù', qty: 2, price: 23 }, { name: 'Dark Chocolate Tart', qty: 2, price: 14 }] }),
  order({ id: 'o9', number: 'ORD-1034', type: 'DELIVERY', status: 'PREPARING', paymentMethod: 'ONLINE', outlet: 'Outlet 03', customer: 'Isabella Cruz', createdAt: '2026-06-25T16:15:00', items: [{ name: 'Avocado Toast', qty: 2, price: 14 }, { name: 'Buttermilk Pancakes', qty: 1, price: 13 }] }),
  order({ id: 'o10', number: 'ORD-1033', type: 'DINE_IN', status: 'COMPLETED', paymentMethod: 'CARD', outlet: 'Outlet 01', customer: 'Benjamin Scott', createdAt: '2026-06-25T15:50:00', items: [{ name: 'Shakshuka & Eggs', qty: 1, price: 16 }, { name: 'Lemon Cheesecake', qty: 1, price: 12 }] }),
  order({ id: 'o11', number: 'ORD-1032', type: 'PICKUP', status: 'READY', paymentMethod: 'CASH', outlet: 'Outlet 02', customer: 'Mia Foster', createdAt: '2026-06-25T15:30:00', items: [{ name: 'Roasted Tomato Soup', qty: 2, price: 11 }, { name: 'Heirloom Tomato Salad', qty: 1, price: 17 }] }),
  order({ id: 'o12', number: 'ORD-1031', type: 'DELIVERY', status: 'COMPLETED', paymentMethod: 'ONLINE', outlet: 'Outlet 04', customer: 'Lucas Gray', createdAt: '2026-06-25T15:05:00', items: [{ name: 'Garden Burrata', qty: 1, price: 19 }, { name: 'Pomegranate Spritz', qty: 1, price: 12 }] }),
];

export const ORDER_FLOW: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];

/** Valid next statuses for the order state machine. */
export function nextStatuses(status: OrderStatus): OrderStatus[] {
  if (status === 'COMPLETED' || status === 'CANCELED') return [];
  const idx = ORDER_FLOW.indexOf(status);
  const forward = idx >= 0 && idx < ORDER_FLOW.length - 1 ? [ORDER_FLOW[idx + 1]] : [];
  return [...forward, 'CANCELED'];
}

export const TYPE_LABELS: Record<OrderType, string> = {
  DINE_IN: 'Dine-in',
  DELIVERY: 'Delivery',
  PICKUP: 'Pick-up',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
};
