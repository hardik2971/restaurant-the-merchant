// Mock dashboard data for the Overview screen — modeled on the design mockup
// but populated with The Merchant Boston's own content. Phase 5/7 replace this
// with real aggregations from the MySQL (Prisma) data layer.
import type { OrderStatus } from '@/lib/orders-data';

const img = (id: string, w = 800): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export interface Kpi {
  key: string;
  label: string;
  value: string;
  delta: number; // percent vs last month
  accent?: boolean; // filled orange card
}

export const KPIS: Kpi[] = [
  { key: 'orders', label: 'Total Orders', value: '1,250', delta: 10, accent: true },
  { key: 'delivered', label: 'Total Delivered', value: '1,070', delta: 7.5 },
  { key: 'canceled', label: 'Canceled Order', value: '180', delta: -3.5 },
  { key: 'revenue', label: 'Total Revenue', value: '$15,750', delta: 7.5 },
];

export const TRENDING = {
  name: 'Wood-fired Sea Bass',
  subtitle: 'Chef’s Signature',
  rating: 4.9,
  orders: 420,
  price: 32,
  image: img('1467003909585-2f8a72700288', 700),
};

// Outlets operational cost vs revenue — one point per outlet.
export interface OutletPoint {
  outlet: string;
  sells: number; // revenue (in $)
  cost: number; // operational cost (in $)
}

export const OUTLET_SERIES: OutletPoint[] = [
  { outlet: 'Outlet 01', sells: 7200, cost: 5400 },
  { outlet: 'Outlet 02', sells: 9100, cost: 8200 },
  { outlet: 'Outlet 03', sells: 8300, cost: 11600 },
  { outlet: 'Outlet 04', sells: 9800, cost: 8700 },
  { outlet: 'Outlet 05', sells: 10500, cost: 14000 }, // highlighted in the mockup
  { outlet: 'Outlet 06', sells: 11200, cost: 9300 },
  { outlet: 'Outlet 07', sells: 9600, cost: 12400 },
  { outlet: 'Outlet 08', sells: 12100, cost: 10200 },
];

export const OUTLET_ACTIVE = 'Outlet 05';
export const OUTLET_REVENUE_TOTAL = '$3,500';

export interface CategoryStat {
  name: string;
  percent: number;
  image: string;
}

export const TOP_CATEGORIES: CategoryStat[] = [
  { name: 'Fish', percent: 65, image: img('1565299624946-b28f40a0ae38', 400) },
  { name: 'Drinks', percent: 45, image: img('1551024709-8f23befc6f87', 400) },
  { name: 'Desserts', percent: 81, image: img('1571877227200-a0d98ea607e9', 400) },
];

export const EMPLOYEE_STATUS = {
  total: 120,
  segments: [
    { label: 'On Duty', value: 83, color: 'var(--color-success)' },
    { label: 'On Break', value: 10, color: 'var(--color-warn)' },
    { label: 'Absent', value: 7, color: 'var(--color-danger)' },
  ],
};

export const POS = {
  totalSales: '$1,550',
  salesDelta: 12,
  totalBills: 147,
  avgValue: '$12',
  peakHour: '5.00 PM',
  payment: {
    cash: 60,
    card: 25,
    online: 15,
  },
};

export interface RecentOrder {
  line: string;
  orderId: string;
  customer: string;
  type: string; // 'Dine-in' | 'Delivery' | 'Pick-up'
  status: OrderStatus;
  price: number;
  image: string;
}

export const RECENT_ORDERS: RecentOrder[] = [
  { line: '01', orderId: 'ORD-1042', customer: 'Olivia Bennett', type: 'Dine-in', status: 'PREPARING', price: 72, image: img('1546964124-0cce460f38ef', 400) },
  { line: '02', orderId: 'ORD-1041', customer: 'Liam Carter', type: 'Delivery', status: 'PENDING', price: 41, image: img('1608897013039-887f21d8c804', 400) },
  { line: '03', orderId: 'ORD-1040', customer: 'Noah Patel', type: 'Pick-up', status: 'READY', price: 30, image: img('1534080564583-6be75777b70a', 400) },
];

export interface SalesType {
  label: string;
  percent: number;
}

export const SALES_TYPES: SalesType[] = [
  { label: 'Dine-in', percent: 40 },
  { label: 'Delivery', percent: 35 },
  { label: 'Pick-up', percent: 25 },
];
