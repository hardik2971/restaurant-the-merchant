// Restaurant + Owner app API — /api/mobile/staff/* (bearer token, staff kinds).
// Thin REST wrappers over the admin's own queries (reads) and server actions
// (writes), so permissions, audit logging and business rules stay identical
// to the web admin. Each route declares the same RBAC action the admin page uses.
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/mobile-auth';
import { handlers, route } from '@/lib/mobile-router';
import * as q from '@/lib/queries';
import * as a from '@/lib/actions';
import { STAFF_ROLES } from '@/schemas/staff';

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const num = (v: unknown) => Number(v ?? 0) || 0;
const days = (v: string | null, d: number) => Math.min(365, Math.max(1, Number(v) || d));

const ORDER_STATUSES = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED'] as const;
const RES_STATUSES = ['REQUESTED', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELED', 'NO_SHOW'] as const;
const TABLE_STATES = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'WAITING_PAYMENT', 'CLEANING', 'OUT_OF_SERVICE'] as const;
const DUTY = ['ON_DUTY', 'ON_BREAK', 'ABSENT', 'OFF'] as const;
const COUPON_STATUSES = ['PENDING_PAYMENT', 'PAID', 'ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED'] as const;

async function sessionTable(sessionId: string) {
  const s = await prisma.tableSession.findUnique({ where: { id: sessionId }, select: { tableId: true } });
  if (!s) throw new HttpError(404, 'Session not found');
  return s.tableId;
}

/** Fresh POS view for a table — returned after every POS mutation. */
async function pos(tableId: string) {
  const [data, menu, mergeTargets, waiters] = await Promise.all([
    q.getTablePos(tableId),
    q.getMenuItems(),
    q.getMergeTargets(tableId),
    q.getWaiterOptions(),
  ]);
  if (!data.table) throw new HttpError(404, 'Table not found');
  return { ...data, menu: menu.filter((m) => m.available), mergeTargets, waiters };
}

const routes = [
  // ---- Overview ----
  route('GET', 'dashboard', 'view:dashboard', async () => {
    const [dashboard, attention, floor] = await Promise.all([q.getDashboardData(), q.getAttentionCount(), q.getFloorTables()]);
    const count = (s: string) => floor.filter((t) => t.state === s).length;
    return {
      ...dashboard,
      attention,
      floor: {
        total: floor.length,
        available: count('AVAILABLE'),
        occupied: count('OCCUPIED'),
        reserved: count('RESERVED'),
        waitingPayment: count('WAITING_PAYMENT'),
        cleaning: count('CLEANING'),
      },
    };
  }),
  route('GET', 'notifications', 'view:dashboard', async () => ({ notifications: await q.getNotifications() })),

  // Own duty status (employees clock on/off from the Restaurant app).
  route('PATCH', 'me/duty', undefined, async ({ user, body }) => {
    const status = z.enum(DUTY).parse((await body()).status);
    if (user.kind !== 'employee') throw new HttpError(422, 'Duty status applies to staff accounts');
    await prisma.employee.update({ where: { id: user.id }, data: { status } });
    return { status };
  }),

  // ---- Orders (kitchen / service board) ----
  route('GET', 'orders', 'manage:orders', async () => ({ orders: (await q.getOrders()).slice(0, 300) })),
  route('PATCH', 'orders/:id/status', 'manage:orders', async ({ params, body }) => {
    await a.setOrderStatus(params.id, z.enum(ORDER_STATUSES).parse((await body()).status));
    return { ok: true };
  }),

  // ---- Floor plan & POS ----
  route('GET', 'floor', 'manage:orders', async () => ({ tables: await q.getFloorTables(), waiters: await q.getWaiterOptions() })),
  route('PATCH', 'tables/:id/state', 'operate:floor', async ({ params, body }) => {
    await a.setTableState(params.id, z.enum(TABLE_STATES).parse((await body()).state));
    return { ok: true };
  }),
  route('GET', 'pos/:tableId', 'manage:orders', async ({ params }) => pos(params.tableId)),
  route('POST', 'pos/:tableId/open', 'operate:floor', async ({ params, body }) => {
    const b = await body();
    await a.openTableSession(params.tableId, {
      customerCount: Math.max(1, num(b.customerCount)),
      waiterId: str(b.waiterId) || undefined,
      customerName: str(b.customerName) || undefined,
    });
    return pos(params.tableId);
  }),
  route('POST', 'sessions/:id/items', 'manage:orders', async ({ params, body }) => {
    const items = z.array(z.object({ menuItemId: z.string().min(1), qty: z.coerce.number().int().min(1).max(50) })).min(1).parse((await body()).items);
    await a.addSessionOrder(params.id, items);
    return pos(await sessionTable(params.id));
  }),
  route('POST', 'sessions/:id/void', 'manage:orders', async ({ params, body }) => {
    await a.decrementSessionItem(params.id, z.string().min(1).parse((await body()).menuItemId));
    return pos(await sessionTable(params.id));
  }),
  route('PUT', 'sessions/:id/billing', 'manage:orders', async ({ params, body }) => {
    const b = await body();
    await a.updateSessionBilling(params.id, { discount: num(b.discount), tax: num(b.tax), serviceCharge: num(b.serviceCharge), tip: num(b.tip) });
    return pos(await sessionTable(params.id));
  }),
  route('POST', 'sessions/:id/payments', 'manage:orders', async ({ params, body }) => {
    const b = await body();
    if (!(num(b.amount) > 0)) throw new HttpError(400, 'Enter an amount');
    await a.addPayment(params.id, { amount: num(b.amount), method: str(b.method) || 'Cash' });
    return pos(await sessionTable(params.id));
  }),
  route('POST', 'sessions/:id/close', 'operate:floor', async ({ params, body }) => {
    const tableId = await sessionTable(params.id);
    await a.closeTableSession(params.id, { paymentMethod: str((await body()).paymentMethod) || undefined });
    return pos(tableId);
  }),
  route('POST', 'sessions/:id/merge', 'manage:orders', async ({ params, body }) => {
    const tableId = await sessionTable(params.id);
    // Merge THIS table's session into the chosen target session.
    const into = z.string().min(1).parse((await body()).intoSessionId);
    await a.mergeSessions(params.id, into);
    return pos(tableId);
  }),

  // ---- Tables (QR) ----
  route('GET', 'tables', 'manage:tables', async () => ({
    tables: await q.getTables(),
    websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL ?? '',
  })),
  route('POST', 'tables', 'manage:tables', async ({ body }) => ({ table: await a.createTable((await body()) as never) })),
  route('PUT', 'tables/:id', 'manage:tables', async ({ params, body }) => {
    await a.updateTable(params.id, (await body()) as never);
    return { ok: true };
  }),
  route('DELETE', 'tables/:id', 'manage:tables', async ({ params }) => {
    await a.deleteTable(params.id);
    return { ok: true };
  }),
  route('GET', 'table-analytics', 'view:reports', async ({ query }) => ({ analytics: await q.getTableAnalytics(days(query.get('days'), 1)) })),
  route('GET', 'table-history/:tableId', 'view:reports', async ({ params, query }) => ({
    history: await q.getTableHistory(params.tableId, days(query.get('days'), 30)),
  })),

  // ---- Reservations ----
  route('GET', 'reservations', 'manage:reservations', async () => ({ reservations: await q.getReservations() })),
  route('PATCH', 'reservations/:id/status', 'manage:reservations', async ({ params, body }) => {
    await a.setReservationStatus(params.id, z.enum(RES_STATUSES).parse((await body()).status));
    return { ok: true };
  }),
  route('PUT', 'reservations/:id', 'manage:reservations', async ({ params, body }) => {
    const b = await body();
    await a.updateReservation(params.id, {
      date: str(b.date) || undefined,
      time: b.time === undefined ? undefined : str(b.time),
      guests: b.guests === undefined ? undefined : Math.max(1, num(b.guests)),
      occasion: b.occasion === undefined ? undefined : str(b.occasion),
      requests: b.requests === undefined ? undefined : str(b.requests),
    });
    return { ok: true };
  }),

  // ---- Menu ----
  // Read access for anyone on the floor (item availability); edits need manage:menu.
  route('GET', 'menu', 'manage:orders', async () => ({ items: await q.getMenuItems(), categories: await q.getMenuCategories() })),
  route('POST', 'menu', 'manage:menu', async ({ body }) => {
    await a.createMenuItem((await body()) as never);
    return { ok: true };
  }),
  route('PUT', 'menu/:id', 'manage:menu', async ({ params, body }) => {
    await a.updateMenuItem(params.id, (await body()) as never);
    return { ok: true };
  }),
  route('DELETE', 'menu/:id', 'manage:menu', async ({ params }) => {
    await a.deleteMenuItem(params.id);
    return { ok: true };
  }),
  route('PATCH', 'menu/:id/availability', 'manage:menu', async ({ params, body }) => {
    await a.setMenuAvailability(params.id, (await body()).available === true);
    return { ok: true };
  }),
  route('PATCH', 'categories/:id', 'manage:menu', async ({ params, body }) => {
    await a.setCategoryActive(params.id, (await body()).active === true);
    return { ok: true };
  }),

  // ---- Inventory ----
  route('GET', 'inventory', 'manage:inventory', async () => ({ items: await q.getInventory() })),
  route('POST', 'inventory', 'manage:inventory', async ({ body }) => {
    await a.createInventoryItem((await body()) as never);
    return { ok: true };
  }),
  route('PUT', 'inventory/:id', 'manage:inventory', async ({ params, body }) => {
    await a.updateInventoryItem(params.id, (await body()) as never);
    return { ok: true };
  }),
  route('POST', 'inventory/:id/adjust', 'manage:inventory', async ({ params, body }) => {
    await a.adjustInventory(params.id, num((await body()).delta));
    return { ok: true };
  }),
  route('DELETE', 'inventory/:id', 'manage:inventory', async ({ params }) => {
    await a.deleteInventoryItem(params.id);
    return { ok: true };
  }),

  // ---- Staff ----
  route('GET', 'staff', 'manage:staff', async () => ({ employees: await q.getEmployees(), roles: STAFF_ROLES })),
  route('POST', 'staff', 'manage:staff', async ({ body }) => {
    await a.createStaff((await body()) as never);
    return { ok: true };
  }),
  route('PUT', 'staff/:id', 'manage:staff', async ({ params, body }) => {
    await a.updateStaff(params.id, (await body()) as never);
    return { ok: true };
  }),
  route('PATCH', 'staff/:id/status', 'manage:staff', async ({ params, body }) => {
    await a.setEmployeeStatus(params.id, z.enum(DUTY).parse((await body()).status));
    return { ok: true };
  }),
  route('PATCH', 'staff/:id/active', 'manage:staff', async ({ params, body }) => {
    await a.setStaffActive(params.id, (await body()).active === true);
    return { ok: true };
  }),
  route('DELETE', 'staff/:id', 'manage:staff', async ({ params }) => {
    await a.deleteStaff(params.id);
    return { ok: true };
  }),

  // ---- Customers ----
  route('GET', 'customers', 'manage:customers', async () => ({ customers: await q.getCustomers() })),
  route('POST', 'customers', 'manage:customers', async ({ body }) => {
    await a.createCustomer((await body()) as never);
    return { ok: true };
  }),
  route('PUT', 'customers/:id', 'manage:customers', async ({ params, body }) => {
    await a.updateCustomer(params.id, (await body()) as never);
    return { ok: true };
  }),
  route('DELETE', 'customers/:id', 'manage:customers', async ({ params }) => {
    await a.deleteCustomer(params.id);
    return { ok: true };
  }),

  // ---- Gift cards & coupons ----
  route('GET', 'gift-cards', 'manage:coupons', async () => ({ giftCards: await q.getGiftCards() })),
  route('PATCH', 'gift-cards/:id/status', 'manage:coupons', async ({ params, body }) => {
    await a.setGiftCardStatus(params.id, z.enum(COUPON_STATUSES).parse((await body()).status));
    return { ok: true };
  }),
  route('DELETE', 'gift-cards/:id', 'manage:coupons', async ({ params }) => {
    await a.deleteGiftCard(params.id);
    return { ok: true };
  }),

  // ---- Reports & finance ----
  route('GET', 'reports', 'view:reports', async () => ({ reports: await q.getReportsData() })),
  route('GET', 'transactions', 'view:reports', async () => ({ transactions: (await q.getTransactions()).slice(0, 300) })),
  route('GET', 'outlets', 'manage:outlets', async () => ({ outlets: await q.getOutlets() })),

  // ---- Settings & audit (owner) ----
  route('GET', 'settings', 'manage:settings', async () => ({ profile: await q.getProfile(), team: await q.getUsers() })),
  route('PUT', 'settings', 'manage:settings', async ({ body }) => {
    await a.updateProfile((await body()) as never);
    return { profile: await q.getProfile() };
  }),
  route('GET', 'audit', 'manage:settings', async ({ query }) => ({
    logs: await q.getAuditLogs(Math.min(500, Number(query.get('limit')) || 150)),
  })),
];

export const { GET, POST, PUT, PATCH, DELETE } = handlers(routes, ['user', 'employee']);
