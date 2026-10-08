// Server-side data access — maps Prisma rows to the view shapes the client
// managers already use, so wiring a page to live data is just swapping its
// mock import for one of these queries. Server-only (imports prisma).
import { prisma } from '@/lib/db';
import type { MenuItem } from '@/lib/menu-data';
import type { Order } from '@/lib/orders-data';
import { TYPE_LABELS } from '@/lib/orders-data';
import type { Reservation } from '@/lib/reservations-data';
import type { Outlet } from '@/lib/outlets-data';
import type { Employee } from '@/lib/employees-data';
import type { Customer } from '@/lib/customers-data';
import type { RestaurantTable } from '@/lib/tables-data';
import type { FloorTable, PosData, PosLine, PosTable, MergeTarget } from '@/lib/floor-data';
import type { GiftCardRecord } from '@/lib/giftcards-data';
import type { InventoryItem } from '@/lib/inventory-data';
import type { InventoryCategory } from '@/schemas/inventory';
import type { Kpi, CategoryStat, RecentOrder, SalesType } from '@/lib/dashboard-data';
import { formatCurrency } from '@/lib/utils';

export async function getInventory(): Promise<InventoryItem[]> {
  const rows = await prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as InventoryCategory,
    unit: r.unit,
    quantity: r.quantity,
    reorderLevel: r.reorderLevel,
    costPerUnit: Number(r.costPerUnit),
    supplier: r.supplier ?? '',
  }));
}

async function outletNameMap(): Promise<Map<string, string>> {
  const outlets = await prisma.outlet.findMany({ select: { id: true, name: true } });
  return new Map(outlets.map((o) => [o.id, o.name]));
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const rows = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: { name: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    rating: r.rating,
    tag: r.tag ?? '',
    category: r.category.name as MenuItem['category'],
    imageUrl: r.imageUrl,
    available: r.available,
  }));
}

export interface MenuCategoryRow {
  id: string;
  name: string;
  active: boolean;
  itemCount: number;
}

export async function getDashboardConfig(): Promise<{
  trendingItemId: string | null;
  topCategories: { name: string; percent: number }[] | null;
}> {
  const c = await prisma.dashboardConfig.findUnique({ where: { id: 'default' } });
  let topCategories: { name: string; percent: number }[] | null = null;
  if (c?.topCategories) {
    try {
      topCategories = JSON.parse(c.topCategories);
    } catch {
      topCategories = null;
    }
  }
  return { trendingItemId: c?.trendingItemId ?? null, topCategories };
}

export async function getMenuCategories(): Promise<MenuCategoryRow[]> {
  const cats = await prisma.category.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { name: 'asc' },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    active: c.active,
    itemCount: c._count.items,
  }));
}

export async function getOrders(): Promise<Order[]> {
  const [rows, names] = await Promise.all([
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } }),
    outletNameMap(),
  ]);
  return rows.map((o) => ({
    id: o.id,
    number: o.number,
    type: o.type as Order['type'],
    status: o.status as Order['status'],
    channel: o.channel as Order['channel'],
    paymentMethod: (o.paymentMethod ?? 'CASH') as Order['paymentMethod'],
    outlet: names.get(o.outletId) ?? o.outletId,
    customer: o.customerName,
    customerEmail: o.customerEmail ?? undefined,
    customerPhone: o.customerPhone ?? undefined,
    items: o.items.map((it) => ({ name: it.name, qty: it.qty, price: Number(it.price) })),
    total: Number(o.total),
    scheduleType: o.scheduleType as Order['scheduleType'],
    scheduleDate: o.scheduleDate ? o.scheduleDate.toISOString() : undefined,
    scheduleTime: o.scheduleTime ?? undefined,
    notes: o.notes ?? undefined,
    tableNumber: o.tableNumber ?? undefined,
    paymentProvider: o.paymentProvider ?? undefined,
    razorpayPaymentId: o.razorpayPaymentId ?? undefined,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function getTables(): Promise<RestaurantTable[]> {
  const rows = await prisma.table.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { number: 'asc' },
  });
  return rows.map((t) => ({
    id: t.id,
    number: t.number,
    name: t.name ?? undefined,
    code: t.code,
    status: t.status as RestaurantTable['status'],
    orderCount: t._count.orders,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function getGiftCards(): Promise<GiftCardRecord[]> {
  const rows = await prisma.giftCard.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map((g) => ({
    id: g.id,
    code: g.code,
    kind: g.kind as GiftCardRecord['kind'],
    customerName: g.customerName,
    customerEmail: g.customerEmail,
    amount: Number(g.amount),
    message: g.message ?? undefined,
    expiryDate: g.expiryDate ? g.expiryDate.toISOString().slice(0, 10) : undefined,
    paymentStatus: g.paymentStatus as GiftCardRecord['paymentStatus'],
    status: g.status as GiftCardRecord['status'],
    paymentProvider: g.paymentProvider ?? undefined,
    razorpayPaymentId: g.razorpayPaymentId ?? undefined,
    createdAt: g.createdAt.toISOString(),
  }));
}

// ---- Floor plan / table sessions (POS Phase 1) ----
export async function getFloorTables(): Promise<FloorTable[]> {
  const tables = await prisma.table.findMany({
    orderBy: { number: 'asc' },
    include: {
      sessions: {
        where: { status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
        take: 1,
        include: {
          waiter: { select: { name: true } },
          orders: { select: { total: true } },
        },
      },
    },
  });
  return tables.map((t) => {
    const s = t.sessions[0];
    return {
      id: t.id,
      number: t.number,
      name: t.name ?? undefined,
      capacity: t.capacity,
      status: t.status as FloorTable['status'],
      state: t.state as FloorTable['state'],
      session: s
        ? {
            id: s.id,
            openedAt: s.openedAt.toISOString(),
            customerCount: s.customerCount,
            customerName: s.customerName ?? undefined,
            waiterName: s.waiter?.name ?? undefined,
            currentBill: s.orders.reduce((sum, o) => sum + Number(o.total), 0),
            orderCount: s.orders.length,
          }
        : null,
    };
  });
}

export async function getTablePos(tableId: string): Promise<PosData> {
  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) return { table: null, session: null };

  const s = await prisma.tableSession.findFirst({
    where: { tableId, status: 'OPEN' },
    include: {
      waiter: { select: { name: true } },
      orders: { include: { items: true }, orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'asc' } },
    },
  });

  const posTable: PosTable = {
    id: table.id,
    number: table.number,
    name: table.name ?? undefined,
    capacity: table.capacity,
    state: table.state as PosTable['state'],
  };

  if (!s) return { table: posTable, session: null };

  // Aggregate identical items (by menu item) across all session orders.
  const byItem = new Map<string, PosLine>();
  for (const o of s.orders) {
    for (const it of o.items) {
      const line = byItem.get(it.menuItemId);
      if (line) line.qty += it.qty;
      else byItem.set(it.menuItemId, { menuItemId: it.menuItemId, name: it.name, qty: it.qty, price: Number(it.price) });
    }
  }

  const payments = s.payments.map((p) => ({ amount: Number(p.amount), method: p.method, createdAt: p.createdAt.toISOString() }));
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const total = Number(s.total);

  return {
    table: posTable,
    session: {
      id: s.id,
      openedAt: s.openedAt.toISOString(),
      customerCount: s.customerCount,
      customerName: s.customerName ?? undefined,
      waiterName: s.waiter?.name ?? undefined,
      lines: Array.from(byItem.values()),
      orders: s.orders.map((o) => ({
        id: o.id,
        number: o.number,
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((it) => ({ name: it.name, qty: it.qty, price: Number(it.price) })),
      })),
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      tax: Number(s.tax),
      serviceCharge: Number(s.serviceCharge),
      tip: Number(s.tip),
      total,
      payments,
      paid,
      remaining: Math.max(0, total - paid),
    },
  };
}

// ---- Table analytics (POS Phase 4) ----
export interface TablePerf {
  id: string;
  number: string;
  name?: string;
  sessions: number;
  customers: number;
  orders: number;
  revenue: number;
  avgBill: number;
  avgDiningMinutes: number;
  occupiedMinutes: number;
  occupancyPct: number;
  utilizationPct: number;
}

export interface TableAnalytics {
  days: number;
  live: { total: number; available: number; occupied: number; reserved: number; cleaning: number; outOfService: number };
  summary: {
    sessions: number;
    customers: number;
    orders: number;
    revenue: number;
    avgBill: number;
    avgCustomersPerTable: number;
    avgDiningMinutes: number;
  };
  perTable: TablePerf[];
  top: Record<string, { number: string; value: string } | null>;
  least: Record<string, { number: string; value: string } | null>;
  busyHours: { hour: number; label: string; sessions: number }[];
  peakHour: string;
  peakDay: string;
  customer: {
    served: number;
    avgSpend: number;
    favouriteItems: { name: string; qty: number }[];
    paymentMix: { method: string; count: number }[];
  };
}

const OPEN_HOUR = 10;
const CLOSE_HOUR = 22;

export async function getTableAnalytics(days = 1): Promise<TableAnalytics> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rangeStart = new Date(startOfToday.getTime() - (days - 1) * 86_400_000);

  const [tables, sessions, orderItems, payments] = await Promise.all([
    prisma.table.findMany({ select: { id: true, number: true, name: true, capacity: true, state: true } }),
    prisma.tableSession.findMany({
      where: { openedAt: { gte: rangeStart } },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.orderItem.findMany({
      where: { order: { session: { openedAt: { gte: rangeStart } } } },
      select: { name: true, qty: true },
    }),
    prisma.payment.findMany({
      where: { session: { openedAt: { gte: rangeStart } } },
      select: { method: true },
    }),
  ]);

  // Live state counts
  const live = { total: tables.length, available: 0, occupied: 0, reserved: 0, cleaning: 0, outOfService: 0 };
  for (const t of tables) {
    if (t.state === 'AVAILABLE') live.available++;
    else if (t.state === 'OCCUPIED') live.occupied++;
    else if (t.state === 'RESERVED') live.reserved++;
    else if (t.state === 'CLEANING') live.cleaning++;
    else if (t.state === 'OUT_OF_SERVICE') live.outOfService++;
  }

  const durationMin = (s: (typeof sessions)[number]) =>
    Math.max(0, ((s.closedAt?.getTime() ?? now.getTime()) - s.openedAt.getTime()) / 60000);

  // Per-table aggregation
  const tableById = new Map(tables.map((t) => [t.id, t]));
  const agg = new Map<string, { sessions: number; customers: number; orders: number; revenue: number; occupiedMin: number; seatRatioSum: number }>();
  for (const s of sessions) {
    const cur = agg.get(s.tableId) ?? { sessions: 0, customers: 0, orders: 0, revenue: 0, occupiedMin: 0, seatRatioSum: 0 };
    const cap = tableById.get(s.tableId)?.capacity ?? 4;
    cur.sessions += 1;
    cur.customers += s.customerCount;
    cur.orders += s._count.orders;
    cur.revenue += Number(s.total);
    cur.occupiedMin += durationMin(s);
    cur.seatRatioSum += Math.min(1, s.customerCount / Math.max(1, cap));
    agg.set(s.tableId, cur);
  }

  const operatingMin = (CLOSE_HOUR - OPEN_HOUR) * 60 * days;
  const perTable: TablePerf[] = tables.map((t) => {
    const a = agg.get(t.id);
    const sessionsN = a?.sessions ?? 0;
    const revenue = a?.revenue ?? 0;
    return {
      id: t.id,
      number: t.number,
      name: t.name ?? undefined,
      sessions: sessionsN,
      customers: a?.customers ?? 0,
      orders: a?.orders ?? 0,
      revenue,
      avgBill: sessionsN ? Math.round(revenue / sessionsN) : 0,
      avgDiningMinutes: sessionsN ? Math.round((a!.occupiedMin) / sessionsN) : 0,
      occupiedMinutes: Math.round(a?.occupiedMin ?? 0),
      occupancyPct: Math.min(100, Math.round(((a?.occupiedMin ?? 0) / operatingMin) * 100)),
      utilizationPct: sessionsN ? Math.round((a!.seatRatioSum / sessionsN) * 100) : 0,
    };
  });

  // Summary
  const totalSessions = sessions.length;
  const customers = sessions.reduce((s, x) => s + x.customerCount, 0);
  const orders = sessions.reduce((s, x) => s + x._count.orders, 0);
  const revenue = sessions.reduce((s, x) => s + Number(x.total), 0);
  const diningTotal = sessions.reduce((s, x) => s + durationMin(x), 0);
  const summary = {
    sessions: totalSessions,
    customers,
    orders,
    revenue,
    avgBill: totalSessions ? Math.round(revenue / totalSessions) : 0,
    avgCustomersPerTable: totalSessions ? Math.round((customers / totalSessions) * 10) / 10 : 0,
    avgDiningMinutes: totalSessions ? Math.round(diningTotal / totalSessions) : 0,
  };

  // Rankings
  const withSessions = perTable.filter((t) => t.sessions > 0);
  const pick = (arr: TablePerf[], key: (t: TablePerf) => number, fmt: (t: TablePerf) => string, max = true) => {
    if (!arr.length) return null;
    const best = arr.reduce((b, t) => (max ? key(t) > key(b) : key(t) < key(b)) ? t : b);
    return { number: best.number, value: fmt(best) };
  };
  const money = (n: number) => `$${n.toLocaleString()}`;
  const top = {
    highestRevenue: pick(withSessions, (t) => t.revenue, (t) => money(t.revenue)),
    mostUsed: pick(withSessions, (t) => t.sessions, (t) => `${t.sessions} sessions`),
    mostCustomers: pick(withSessions, (t) => t.customers, (t) => `${t.customers} guests`),
    highestAvgBill: pick(withSessions, (t) => t.avgBill, (t) => money(t.avgBill)),
    longestOccupied: pick(withSessions, (t) => t.occupiedMinutes, (t) => `${t.occupiedMinutes} min`),
    fastestTurnover: pick(withSessions, (t) => t.avgDiningMinutes, (t) => `${t.avgDiningMinutes} min`, false),
  };
  const least = {
    leastUsed: pick(perTable, (t) => t.sessions, (t) => `${t.sessions} sessions`, false),
    lowestRevenue: pick(perTable, (t) => t.revenue, (t) => money(t.revenue), false),
    lowestOccupancy: pick(perTable, (t) => t.occupancyPct, (t) => `${t.occupancyPct}%`, false),
  };

  // Busy hours + peak day
  const hourCounts = new Array(24).fill(0) as number[];
  const dayCounts = new Array(7).fill(0) as number[];
  for (const s of sessions) {
    hourCounts[s.openedAt.getHours()] += 1;
    dayCounts[s.openedAt.getDay()] += 1;
  }
  const busyHours = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    const period = h < 12 ? 'AM' : 'PM';
    busyHours.push({ hour: h, label: `${h % 12 || 12}${period}`, sessions: hourCounts[h] });
  }
  let peakH = OPEN_HOUR;
  for (let h = 0; h < 24; h++) if (hourCounts[h] > hourCounts[peakH]) peakH = h;
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let peakD = 0;
  for (let d = 0; d < 7; d++) if (dayCounts[d] > dayCounts[peakD]) peakD = d;
  const peakHour = totalSessions ? `${peakH % 12 || 12}:00 ${peakH < 12 ? 'AM' : 'PM'}` : '—';
  const peakDay = totalSessions ? DAYS[peakD] : '—';

  // Customer analytics
  const itemQty = new Map<string, number>();
  for (const it of orderItems) itemQty.set(it.name, (itemQty.get(it.name) ?? 0) + it.qty);
  const favouriteItems = Array.from(itemQty.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const methodCount = new Map<string, number>();
  for (const p of payments) methodCount.set(p.method, (methodCount.get(p.method) ?? 0) + 1);
  const paymentMix = Array.from(methodCount.entries())
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count);
  const customer = {
    served: customers,
    avgSpend: customers ? Math.round(revenue / customers) : 0,
    favouriteItems,
    paymentMix,
  };

  return { days, live, summary, perTable, top, least, busyHours, peakHour, peakDay, customer };
}

export interface HistorySession {
  id: string;
  openedAt: string;
  closedAt?: string;
  durationMinutes: number;
  customerCount: number;
  customerName?: string;
  waiterName?: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  tip: number;
  total: number;
  paymentMethod?: string;
  status: 'OPEN' | 'CLOSED';
}

export interface TableHistory {
  table: { id: string; number: string; name?: string } | null;
  sessions: HistorySession[];
}

export async function getTableHistory(tableId: string, days = 30): Promise<TableHistory> {
  const table = await prisma.table.findUnique({ where: { id: tableId }, select: { id: true, number: true, name: true } });
  if (!table) return { table: null, sessions: [] };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rangeStart = new Date(startOfToday.getTime() - (days - 1) * 86_400_000);

  const rows = await prisma.tableSession.findMany({
    where: { tableId, openedAt: { gte: rangeStart } },
    orderBy: { openedAt: 'desc' },
    include: { waiter: { select: { name: true } }, orders: { include: { items: true } } },
  });

  const sessions: HistorySession[] = rows.map((s) => {
    const byName = new Map<string, { name: string; qty: number; price: number }>();
    for (const o of s.orders) {
      for (const it of o.items) {
        const line = byName.get(it.name);
        if (line) line.qty += it.qty;
        else byName.set(it.name, { name: it.name, qty: it.qty, price: Number(it.price) });
      }
    }
    const end = s.closedAt?.getTime() ?? now.getTime();
    return {
      id: s.id,
      openedAt: s.openedAt.toISOString(),
      closedAt: s.closedAt?.toISOString(),
      durationMinutes: Math.max(0, Math.round((end - s.openedAt.getTime()) / 60000)),
      customerCount: s.customerCount,
      customerName: s.customerName ?? undefined,
      waiterName: s.waiter?.name ?? undefined,
      items: Array.from(byName.values()),
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      tax: Number(s.tax),
      serviceCharge: Number(s.serviceCharge),
      tip: Number(s.tip),
      total: Number(s.total),
      paymentMethod: s.paymentMethod ?? undefined,
      status: s.status as 'OPEN' | 'CLOSED',
    };
  });

  return { table: { id: table.id, number: table.number, name: table.name ?? undefined }, sessions };
}

export async function getMergeTargets(excludeTableId: string): Promise<MergeTarget[]> {
  const sessions = await prisma.tableSession.findMany({
    where: { status: 'OPEN', tableId: { not: excludeTableId } },
    include: { table: { select: { id: true, number: true } } },
    orderBy: { table: { number: 'asc' } },
  });
  return sessions.map((s) => ({ tableId: s.tableId, sessionId: s.id, number: s.table.number }));
}

export async function getWaiterOptions(): Promise<{ id: string; name: string }[]> {
  return prisma.employee.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export interface Transaction {
  id: string;
  source: 'Order' | 'Gift Card' | 'Table';
  reference: string;
  customer: string;
  amount: number;
  method: string;
  paymentId?: string;
  status: string;
  date: string;
}

// Unified payments feed: paid orders, gift-card purchases, and POS session payments.
export async function getTransactions(): Promise<Transaction[]> {
  const [orders, gifts, payments] = await Promise.all([
    prisma.order.findMany({ where: { paymentMethod: { not: null } }, orderBy: { createdAt: 'desc' }, take: 250 }),
    prisma.giftCard.findMany({ where: { paymentStatus: 'PAID' }, orderBy: { createdAt: 'desc' }, take: 250 }),
    prisma.payment.findMany({
      include: { session: { include: { table: { select: { number: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 250,
    }),
  ]);

  const gatewayLabel = (p: string | null) =>
    p === 'razorpay' ? 'Razorpay' : p === 'stripe' ? 'Stripe' : p === 'paypal' ? 'PayPal' : null;

  const txns: Transaction[] = [
    ...orders.map((o) => ({
      id: `o-${o.id}`,
      source: 'Order' as const,
      reference: o.number,
      customer: o.customerName,
      amount: Number(o.total),
      method: gatewayLabel(o.paymentProvider) ?? (o.paymentMethod ?? '—'),
      paymentId: o.razorpayPaymentId ?? undefined,
      status: o.status,
      date: o.createdAt.toISOString(),
    })),
    ...gifts.map((g) => ({
      id: `g-${g.id}`,
      source: 'Gift Card' as const,
      reference: g.code,
      customer: g.customerName,
      amount: Number(g.amount),
      method: gatewayLabel(g.paymentProvider) ?? 'Online',
      paymentId: g.razorpayPaymentId ?? undefined,
      status: g.status,
      date: g.createdAt.toISOString(),
    })),
    ...payments.map((p) => ({
      id: `p-${p.id}`,
      source: 'Table' as const,
      reference: `Table ${p.session.table.number}`,
      customer: p.session.customerName ?? '—',
      amount: Number(p.amount),
      method: p.method,
      status: 'PAID',
      date: p.createdAt.toISOString(),
    })),
  ];
  return txns.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getReservations(): Promise<Reservation[]> {
  const rows = await prisma.reservation.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    kind: r.kind as Reservation['kind'],
    status: r.status as Reservation['status'],
    date: r.date.toISOString().slice(0, 10),
    name: r.name,
    email: r.email,
    phone: r.phone,
    time: r.time ?? undefined,
    guests: r.guests ?? undefined,
    occasion: r.occasion ?? undefined,
    requests: r.requests ?? undefined,
    eventType: r.eventType ?? undefined,
    guestRange: r.guestRange ?? undefined,
    space: r.space ?? undefined,
    company: r.company ?? undefined,
    message: r.message ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getOutlets(): Promise<Outlet[]> {
  const rows = await prisma.outlet.findMany({
    include: { metrics: { orderBy: { periodStart: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  return rows.map((o) => ({
    id: o.id,
    name: o.name,
    location: o.location ?? '',
    address: o.address ?? '',
    phone: o.phone ?? '',
    manager: o.manager ?? '',
    isActive: o.isActive,
    weekly: o.metrics.map((m, i) => ({
      week: `W${i + 1}`,
      revenue: Number(m.revenue),
      cost: Number(m.operationalCost),
    })),
  }));
}

export async function getEmployees(): Promise<Employee[]> {
  const [rows, names] = await Promise.all([
    prisma.employee.findMany({ orderBy: { name: 'asc' } }),
    outletNameMap(),
  ]);
  return rows.map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    outlet: names.get(e.outletId) ?? e.outletId,
    email: e.email ?? '',
    phone: e.phone ?? undefined,
    active: e.active,
    status: e.status as Employee['status'],
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function getCustomers(): Promise<Customer[]> {
  const rows = await prisma.customer.findMany({
    include: { orders: true, reservations: true },
    orderBy: { name: 'asc' },
  });
  return rows.map((c) => {
    const orders = c.orders.map((o) => ({
      number: o.number,
      total: Number(o.total),
      status: o.status as Order['status'],
      date: o.createdAt.toISOString(),
    }));
    const reservations = c.reservations.map((r) => ({
      reference: r.reference,
      kind: r.kind as Reservation['kind'],
      status: r.status as Reservation['status'],
      date: r.date.toISOString(),
    }));
    const totalSpend = orders
      .filter((o) => o.status !== 'CANCELED')
      .reduce((s, o) => s + o.total, 0);
    const lastActivity =
      [...orders.map((o) => o.date), ...reservations.map((r) => r.date)].sort().pop() ?? '';
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone ?? undefined,
      address: c.address ?? undefined,
      status: c.status as Customer['status'],
      orders,
      reservations,
      totalSpend,
      lastActivity,
      createdAt: c.createdAt.toISOString(),
    };
  });
}

// ---- Dashboard aggregation ----
export interface DashboardData {
  kpis: Kpi[];
  trending: { name: string; subtitle: string; rating: number; orders: number; price: number; image: string };
  outletSeries: { outlet: string; sells: number; cost: number }[];
  outletActive: string;
  revenueTotal: string;
  topCategories: CategoryStat[];
  employee: { total: number; segments: { label: string; value: number; color: string }[] };
  pos: {
    totalSales: string;
    salesDelta: number;
    totalBills: number;
    avgValue: string;
    peakHour: string;
    payment: { cash: number; card: number; online: number };
  };
  recentOrders: RecentOrder[];
  salesTypes: SalesType[];
}

function pct(part: number, total: number): number {
  return total ? Math.round((part / total) * 100) : 0;
}

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 || 12;
  return `${hour12}.00 ${period}`;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [orders, menu, outlets, employeeGroups, dashCfg] = await Promise.all([
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } }),
    prisma.menuItem.findMany({ include: { category: true } }),
    prisma.outlet.findMany({ include: { metrics: { orderBy: { periodStart: 'asc' } } }, orderBy: { name: 'asc' } }),
    prisma.employee.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.dashboardConfig.findUnique({ where: { id: 'default' } }),
  ]);

  const menuByName = new Map(menu.map((m) => [m.name, m]));
  const menuById = new Map(menu.map((m) => [m.id, m]));
  // First image per category across the whole menu (for override categories
  // that may have no orders yet).
  const catImageAll = new Map<string, string>();
  for (const m of menu) if (!catImageAll.has(m.category.name)) catImageAll.set(m.category.name, m.imageUrl);

  // KPIs
  const completed = orders.filter((o) => o.status === 'COMPLETED');
  const canceled = orders.filter((o) => o.status === 'CANCELED');
  const revenue = completed.reduce((s, o) => s + Number(o.total), 0);
  const kpis: Kpi[] = [
    { key: 'orders', label: 'Total Orders', value: orders.length.toLocaleString(), delta: 10, accent: true },
    { key: 'delivered', label: 'Total Delivered', value: completed.length.toLocaleString(), delta: 7.5 },
    { key: 'canceled', label: 'Canceled Order', value: canceled.length.toLocaleString(), delta: -3.5 },
    { key: 'revenue', label: 'Total Revenue', value: formatCurrency(revenue), delta: 7.5 },
  ];

  // Trending — most-ordered menu item
  const qtyByItem = new Map<string, number>();
  for (const o of orders) for (const it of o.items) qtyByItem.set(it.name, (qtyByItem.get(it.name) ?? 0) + it.qty);
  let trendingName = menu[0]?.name ?? '';
  let trendingQty = 0;
  for (const [name, q] of qtyByItem) if (q > trendingQty) { trendingQty = q; trendingName = name; }
  const tItem = menuByName.get(trendingName);
  let trending = {
    name: trendingName,
    subtitle: tItem?.tag ?? 'Popular',
    rating: tItem?.rating ?? 4.8,
    orders: trendingQty,
    price: tItem ? Number(tItem.price) : 0,
    image: tItem?.imageUrl ?? '',
  };
  // Manual override: feature a specific menu item as Trending.
  if (dashCfg?.trendingItemId) {
    const mi = menuById.get(dashCfg.trendingItemId);
    if (mi) {
      trending = {
        name: mi.name,
        subtitle: mi.tag ?? 'Featured',
        rating: mi.rating,
        orders: qtyByItem.get(mi.name) ?? 0,
        price: Number(mi.price),
        image: mi.imageUrl,
      };
    }
  }

  // Outlet series (current week per outlet)
  const outletSeries = outlets.map((o) => {
    const m = o.metrics[o.metrics.length - 1];
    return { outlet: o.name, sells: m ? Number(m.revenue) : 0, cost: m ? Number(m.operationalCost) : 0 };
  });
  const revenueTotal = formatCurrency(outletSeries.reduce((s, o) => s + o.sells, 0));

  // Top categories by ordered quantity
  const qtyByCat = new Map<string, number>();
  const imageByCat = new Map<string, string>();
  for (const o of orders)
    for (const it of o.items) {
      const mi = menuByName.get(it.name);
      if (!mi) continue;
      qtyByCat.set(mi.category.name, (qtyByCat.get(mi.category.name) ?? 0) + it.qty);
      if (!imageByCat.has(mi.category.name)) imageByCat.set(mi.category.name, mi.imageUrl);
    }
  const totalCatQty = Array.from(qtyByCat.values()).reduce((s, n) => s + n, 0);
  let topCategories: CategoryStat[] = Array.from(qtyByCat.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, q]) => ({ name, percent: pct(q, totalCatQty), image: imageByCat.get(name) ?? '' }));
  // Manual override: pin specific categories + percentages.
  if (dashCfg?.topCategories) {
    try {
      const parsed = JSON.parse(dashCfg.topCategories) as { name: string; percent: number }[];
      if (Array.isArray(parsed) && parsed.length) {
        topCategories = parsed.slice(0, 3).map((p) => ({
          name: p.name,
          percent: p.percent,
          image: catImageAll.get(p.name) ?? '',
        }));
      }
    } catch {
      /* keep computed */
    }
  }

  // Employee status
  const countByStatus = new Map(employeeGroups.map((g) => [g.status, g._count._all]));
  const total = employeeGroups.reduce((s, g) => s + g._count._all, 0);
  const employee = {
    total,
    segments: [
      { label: 'On Duty', value: countByStatus.get('ON_DUTY') ?? 0, color: 'var(--color-success)' },
      { label: 'On Break', value: countByStatus.get('ON_BREAK') ?? 0, color: 'var(--color-warn)' },
      { label: 'Absent', value: countByStatus.get('ABSENT') ?? 0, color: 'var(--color-danger)' },
    ],
  };

  // POS
  const hourCounts = new Map<number, number>();
  for (const o of orders) {
    const h = o.createdAt.getHours();
    hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1);
  }
  let peak = 17;
  let peakN = -1;
  for (const [h, n] of hourCounts) if (n > peakN) { peakN = n; peak = h; }
  const cash = orders.filter((o) => o.paymentMethod === 'CASH').length;
  const card = orders.filter((o) => o.paymentMethod === 'CARD').length;
  const online = orders.filter((o) => o.paymentMethod === 'ONLINE').length;
  const payTotal = cash + card + online;
  const pos = {
    totalSales: formatCurrency(revenue),
    salesDelta: 12,
    totalBills: orders.length,
    avgValue: formatCurrency(orders.length ? Math.round(orders.reduce((s, o) => s + Number(o.total), 0) / orders.length) : 0),
    peakHour: formatHour(peak),
    payment: { cash: pct(cash, payTotal), card: pct(card, payTotal), online: pct(online, payTotal) },
  };

  // Recent orders (latest 3) — mirrors the Orders page: customer, number, type,
  // real status, total, with the first item's photo.
  const recentOrders: RecentOrder[] = orders.slice(0, 3).map((o, i) => {
    const first = o.items[0];
    const mi = first ? menuByName.get(first.name) : undefined;
    return {
      line: String(i + 1).padStart(2, '0'),
      orderId: o.number,
      customer: o.customerName,
      type: TYPE_LABELS[o.type as keyof typeof TYPE_LABELS] ?? o.type,
      status: o.status as RecentOrder['status'],
      price: Number(o.total),
      image: mi?.imageUrl ?? '',
    };
  });

  // Sales & order types
  const dineIn = orders.filter((o) => o.type === 'DINE_IN').length;
  const delivery = orders.filter((o) => o.type === 'DELIVERY').length;
  const pickup = orders.filter((o) => o.type === 'PICKUP').length;
  const salesTypes: SalesType[] = [
    { label: 'Dine-in', percent: pct(dineIn, orders.length) },
    { label: 'Delivery', percent: pct(delivery, orders.length) },
    { label: 'Pick-up', percent: pct(pickup, orders.length) },
  ];

  return {
    kpis,
    trending,
    outletSeries,
    outletActive: outletSeries.reduce((max, o) => (o.cost > (max?.cost ?? -1) ? o : max), outletSeries[0])?.outlet ?? '',
    revenueTotal,
    topCategories,
    employee,
    pos,
    recentOrders,
    salesTypes,
  };
}

// ---- Reports & analytics ----
export interface ReportsData {
  summary: { revenue: number; orders: number; itemsSold: number; avgOrder: number };
  revenueByOutlet: { outlet: string; revenue: number; orders: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
  categoryMix: { category: string; qty: number; revenue: number }[];
  orderTypes: { type: string; count: number }[];
  paymentMix: { method: string; count: number }[];
}

export async function getReportsData(): Promise<ReportsData> {
  const [orders, menu, outlets] = await Promise.all([
    prisma.order.findMany({ include: { items: true } }),
    prisma.menuItem.findMany({ include: { category: true } }),
    prisma.outlet.findMany({ select: { id: true, name: true } }),
  ]);
  const outletName = new Map(outlets.map((o) => [o.id, o.name]));
  const catByItem = new Map(menu.map((m) => [m.name, m.category.name]));

  // Exclude canceled orders from sales analytics.
  const valid = orders.filter((o) => o.status !== 'CANCELED');

  const revenue = valid.reduce((s, o) => s + Number(o.total), 0);
  const itemsSold = valid.reduce((s, o) => s + o.items.reduce((n, it) => n + it.qty, 0), 0);
  const summary = {
    revenue,
    orders: orders.length,
    itemsSold,
    avgOrder: valid.length ? Math.round(revenue / valid.length) : 0,
  };

  const byOutlet = new Map<string, { revenue: number; orders: number }>();
  for (const o of valid) {
    const name = outletName.get(o.outletId) ?? o.outletId;
    const cur = byOutlet.get(name) ?? { revenue: 0, orders: 0 };
    cur.revenue += Number(o.total);
    cur.orders += 1;
    byOutlet.set(name, cur);
  }
  const revenueByOutlet = Array.from(byOutlet.entries())
    .map(([outlet, v]) => ({ outlet, ...v }))
    .sort((a, b) => a.outlet.localeCompare(b.outlet));

  const itemAgg = new Map<string, { qty: number; revenue: number }>();
  const catAgg = new Map<string, { qty: number; revenue: number }>();
  for (const o of valid)
    for (const it of o.items) {
      const lineRev = it.qty * Number(it.price);
      const i = itemAgg.get(it.name) ?? { qty: 0, revenue: 0 };
      i.qty += it.qty;
      i.revenue += lineRev;
      itemAgg.set(it.name, i);
      const cat = catByItem.get(it.name) ?? 'Other';
      const c = catAgg.get(cat) ?? { qty: 0, revenue: 0 };
      c.qty += it.qty;
      c.revenue += lineRev;
      catAgg.set(cat, c);
    }
  const topItems = Array.from(itemAgg.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);
  const categoryMix = Array.from(catAgg.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  const typeCount = (t: string) => orders.filter((o) => o.type === t).length;
  const orderTypes = [
    { type: 'Dine-in', count: typeCount('DINE_IN') },
    { type: 'Delivery', count: typeCount('DELIVERY') },
    { type: 'Pick-up', count: typeCount('PICKUP') },
  ];
  const payCount = (m: string) => valid.filter((o) => o.paymentMethod === m).length;
  const paymentMix = [
    { method: 'Cash', count: payCount('CASH') },
    { method: 'Card', count: payCount('CARD') },
    { method: 'Online', count: payCount('ONLINE') },
  ];

  return { summary, revenueByOutlet, topItems, categoryMix, orderTypes, paymentMix };
}

// ---- Settings & notifications ----
export interface ProfileData {
  name: string;
  currency: string;
  timezone: string;
  address: string;
  phone: string;
  email: string;
}

export async function getProfile(): Promise<ProfileData> {
  const p = await prisma.restaurantProfile.findUnique({ where: { id: 'default' } });
  return {
    name: p?.name ?? 'The Merchant Boston',
    currency: p?.currency ?? 'USD',
    timezone: p?.timezone ?? 'America/New_York',
    address: p?.address ?? '',
    phone: p?.phone ?? '',
    email: p?.email ?? '',
  };
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function getUsers(): Promise<TeamMember[]> {
  const rows = await prisma.user.findMany({ orderBy: { name: 'asc' } });
  return rows.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
}

export interface Notification {
  id: string;
  type: 'order' | 'reservation' | 'stock' | 'table';
  title: string;
  detail: string;
  time: string;
}

const OCCUPIED_TOO_LONG_MIN = 120;
const LARGE_BILL_THRESHOLD = 300;

export async function getNotifications(): Promise<Notification[]> {
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const [orders, reservations, inventory, stateTables, openSessions] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
    prisma.reservation.findMany({ where: { status: 'REQUESTED' }, orderBy: { createdAt: 'desc' }, take: 6 }),
    prisma.inventoryItem.findMany(),
    prisma.table.findMany({ where: { state: { in: ['CLEANING', 'WAITING_PAYMENT'] } }, select: { id: true, number: true, state: true } }),
    prisma.tableSession.findMany({ where: { status: 'OPEN' }, select: { id: true, openedAt: true, total: true, table: { select: { number: true } } } }),
  ]);

  const tableAlerts: Notification[] = [
    ...stateTables.map((t) => ({
      id: `t-${t.id}`,
      type: 'table' as const,
      title: t.state === 'CLEANING' ? `Table ${t.number} needs cleaning` : `Table ${t.number} payment pending`,
      detail: t.state === 'CLEANING' ? 'Mark available once cleaned.' : 'Awaiting checkout.',
      time: nowIso,
    })),
    ...openSessions
      .filter((s) => nowMs - s.openedAt.getTime() > OCCUPIED_TOO_LONG_MIN * 60_000)
      .map((s) => ({
        id: `tl-${s.id}`,
        type: 'table' as const,
        title: `Table ${s.table.number} occupied 2h+`,
        detail: `Open since ${s.openedAt.toLocaleTimeString()}`,
        time: s.openedAt.toISOString(),
      })),
    ...openSessions
      .filter((s) => Number(s.total) >= LARGE_BILL_THRESHOLD)
      .map((s) => ({
        id: `tb-${s.id}`,
        type: 'table' as const,
        title: `Large bill at Table ${s.table.number}`,
        detail: `${formatCurrency(Number(s.total))} running`,
        time: nowIso,
      })),
  ];

  const items: Notification[] = [
    ...orders.map((o) => ({
      id: `o-${o.id}`,
      type: 'order' as const,
      title: `New order ${o.number}`,
      detail: `${o.customerName} · ${formatCurrency(Number(o.total))}`,
      time: o.createdAt.toISOString(),
    })),
    ...reservations.map((r) => ({
      id: `r-${r.id}`,
      type: 'reservation' as const,
      title: `Reservation request ${r.reference}`,
      detail: `${r.name} · ${r.kind === 'TABLE' ? 'Table booking' : 'Private event'}`,
      time: r.createdAt.toISOString(),
    })),
    ...inventory
      .filter((i) => i.quantity <= i.reorderLevel)
      .map((i) => ({
        id: `i-${i.id}`,
        type: 'stock' as const,
        title: `Low stock: ${i.name}`,
        detail: `${i.quantity} ${i.unit} left (reorder at ${i.reorderLevel})`,
        time: i.updatedAt.toISOString(),
      })),
    ...tableAlerts,
  ];

  return items.sort((a, b) => (a.time < b.time ? 1 : -1));
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: string;
  userName?: string;
  createdAt: string;
}

export async function getAuditLogs(limit = 150): Promise<AuditEntry[]> {
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entity: r.entity,
    entityId: r.entityId ?? undefined,
    detail: r.detail ?? undefined,
    userName: r.userName ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getAttentionCount(): Promise<number> {
  const [requested, inventory, tableAttention] = await Promise.all([
    prisma.reservation.count({ where: { status: 'REQUESTED' } }),
    prisma.inventoryItem.findMany({ select: { quantity: true, reorderLevel: true } }),
    prisma.table.count({ where: { state: { in: ['CLEANING', 'WAITING_PAYMENT'] } } }),
  ]);
  const lowStock = inventory.filter((i) => i.quantity <= i.reorderLevel).length;
  return requested + lowStock + tableAttention;
}
