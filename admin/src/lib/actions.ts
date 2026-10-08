'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session-user';
import { can, type Action } from '@/lib/rbac';
import { menuItemSchema, type MenuItemInput } from '@/schemas/menu';
import { inventoryItemSchema, type InventoryItemInput } from '@/schemas/inventory';
import { profileSchema, passwordSchema, type ProfileInput, type PasswordInput } from '@/schemas/settings';
import { customerSchema, type CustomerInput } from '@/schemas/customer';
import { staffSchema, type StaffInput } from '@/schemas/staff';
import { tableSchema, type TableInput } from '@/schemas/table';
import { giftCardEditSchema, type GiftCardEditInput, type CouponStatusValue } from '@/schemas/giftcard';
import { sendMail } from '@/lib/mail';
import { orderCompletedEmail, reservationCompletedEmail, giftCardRedeemedEmail } from '@/lib/email-templates';
import type { OrderStatus } from '@/lib/orders-data';
import type { ReservationStatus } from '@/lib/reservations-data';
import type { DutyStatus } from '@/lib/employees-data';

async function authorize(action: Action) {
  const user = await getSessionUser();
  if (!user || !can(user.role, action)) {
    throw new Error('Forbidden');
  }
}

// Record an audit-trail entry. Never throws — logging must not break an action.
async function logAudit(action: string, entity: string, opts?: { entityId?: string; detail?: string }) {
  try {
    const user = await getSessionUser();
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId: opts?.entityId ?? null,
        detail: opts?.detail ?? null,
        userId: user?.id ?? null,
        userName: user?.name ?? null,
      },
    });
  } catch {
    /* ignore */
  }
}

// ---- Menu ----
async function categoryId(name: string): Promise<string> {
  const cat = await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return cat.id;
}

export async function createMenuItem(input: MenuItemInput) {
  await authorize('manage:menu');
  const data = menuItemSchema.parse(input);
  await prisma.menuItem.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      rating: data.rating,
      tag: data.tag,
      imageUrl: data.imageUrl,
      available: data.available,
      categoryId: await categoryId(data.category),
    },
  });
  revalidatePath('/menu');
}

export async function updateMenuItem(id: string, input: MenuItemInput) {
  await authorize('manage:menu');
  const data = menuItemSchema.parse(input);
  await prisma.menuItem.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      rating: data.rating,
      tag: data.tag,
      imageUrl: data.imageUrl,
      available: data.available,
      categoryId: await categoryId(data.category),
    },
  });
  revalidatePath('/menu');
}

export async function deleteMenuItem(id: string) {
  await authorize('manage:menu');
  await prisma.menuItem.delete({ where: { id } });
  revalidatePath('/menu');
}

export async function setMenuAvailability(id: string, available: boolean) {
  await authorize('manage:menu');
  await prisma.menuItem.update({ where: { id }, data: { available } });
  revalidatePath('/menu');
}

// Enable/disable a whole category — disabled categories (and their items) are
// hidden from the public storefront menu.
export async function setCategoryActive(id: string, active: boolean) {
  await authorize('manage:menu');
  await prisma.category.update({ where: { id }, data: { active } });
  revalidatePath('/menu');
}

// ---- Floor plan / table sessions (POS Phase 1) ----
type TableStateValue =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'WAITING_PAYMENT'
  | 'CLEANING'
  | 'OUT_OF_SERVICE';

export async function openTableSession(
  tableId: string,
  input: { customerCount: number; waiterId?: string; customerName?: string },
) {
  await authorize('operate:floor');
  const existing = await prisma.tableSession.findFirst({ where: { tableId, status: 'OPEN' } });
  if (existing) return; // already occupied — no-op
  await prisma.$transaction([
    prisma.tableSession.create({
      data: {
        tableId,
        customerCount: Math.max(1, input.customerCount),
        waiterId: input.waiterId || null,
        customerName: input.customerName || null,
      },
    }),
    prisma.table.update({ where: { id: tableId }, data: { state: 'OCCUPIED' } }),
  ]);
  await logAudit('session.open', 'TableSession', { entityId: tableId, detail: `${input.customerCount} guests` });
  revalidatePath('/floor');
}

// Recompute a session's subtotal from its orders and the total from the stored
// discount / tax / service / tip adjustments.
async function recomputeSessionTotals(sessionId: string) {
  const s = await prisma.tableSession.findUnique({
    where: { id: sessionId },
    include: { orders: { select: { total: true } } },
  });
  if (!s) return;
  const subtotal = s.orders.reduce((sum, o) => sum + Number(o.total), 0);
  const total =
    subtotal - Number(s.discount) + Number(s.tax) + Number(s.serviceCharge) + Number(s.tip);
  await prisma.tableSession.update({
    where: { id: sessionId },
    data: { subtotal, total: Math.max(0, total) },
  });
}

// Add items to an open table session (POS waiter entry) — creates a DINE_IN
// POS order linked to the session, priced from the live menu.
export async function addSessionOrder(sessionId: string, items: { menuItemId: string; qty: number }[]) {
  await authorize('manage:orders');
  if (!items.length) return;
  const session = await prisma.tableSession.findUnique({
    where: { id: sessionId },
    include: { table: { select: { id: true, number: true } } },
  });
  if (!session || session.status === 'CLOSED') throw new Error('Session is closed');

  const ids = items.map((i) => i.menuItemId);
  const rows = await prisma.menuItem.findMany({ where: { id: { in: ids } } });
  const byId = new Map(rows.map((m) => [m.id, m]));
  const lines = items.map((i) => {
    const mi = byId.get(i.menuItemId);
    if (!mi) throw new Error('Item not found');
    return { menuItemId: mi.id, name: mi.name, qty: i.qty, price: mi.price };
  });
  const total = lines.reduce((s, l) => s + Number(l.price) * l.qty, 0);
  const outlet = await prisma.outlet.findFirst({ select: { id: true } });

  await prisma.order.create({
    data: {
      number: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'DINE_IN',
      status: 'PENDING',
      channel: 'POS',
      total,
      outletId: outlet?.id ?? 'pos',
      customerName: session.customerName ?? `Table ${session.table.number}`,
      tableId: session.tableId,
      tableNumber: session.table.number,
      sessionId: session.id,
      items: { create: lines.map(({ menuItemId, name, qty, price }) => ({ menuItemId, name, qty, price })) },
    },
  });
  await recomputeSessionTotals(session.id);
  await logAudit('order.add', 'Order', { entityId: session.id, detail: `${items.length} item(s)` });
  revalidatePath(`/pos/${session.tableId}`);
  revalidatePath('/floor');
}

export async function updateSessionBilling(
  sessionId: string,
  b: { discount: number; tax: number; serviceCharge: number; tip: number },
) {
  await authorize('manage:orders');
  await prisma.tableSession.update({
    where: { id: sessionId },
    data: {
      discount: Math.max(0, b.discount),
      tax: Math.max(0, b.tax),
      serviceCharge: Math.max(0, b.serviceCharge),
      tip: Math.max(0, b.tip),
    },
  });
  await recomputeSessionTotals(sessionId);
  const s = await prisma.tableSession.findUnique({ where: { id: sessionId }, select: { tableId: true } });
  if (s) revalidatePath(`/pos/${s.tableId}`);
  revalidatePath('/floor');
}

// Remove one unit of an item from the session bill (void).
export async function decrementSessionItem(sessionId: string, menuItemId: string) {
  await authorize('manage:orders');
  const item = await prisma.orderItem.findFirst({
    where: { menuItemId, order: { sessionId } },
    orderBy: { order: { createdAt: 'desc' } },
  });
  if (!item) return;
  if (item.qty > 1) {
    await prisma.orderItem.update({ where: { id: item.id }, data: { qty: item.qty - 1 } });
  } else {
    await prisma.orderItem.delete({ where: { id: item.id } });
  }
  const order = await prisma.order.findUnique({ where: { id: item.orderId }, include: { items: true } });
  if (order) {
    if (order.items.length === 0) {
      await prisma.order.delete({ where: { id: order.id } });
    } else {
      const total = order.items.reduce((s, it) => s + Number(it.price) * it.qty, 0);
      await prisma.order.update({ where: { id: order.id }, data: { total } });
    }
  }
  await recomputeSessionTotals(sessionId);
  await logAudit('order.void', 'Order', { entityId: sessionId, detail: 'Removed item' });
  const sess = await prisma.tableSession.findUnique({ where: { id: sessionId }, select: { tableId: true } });
  if (sess) revalidatePath(`/pos/${sess.tableId}`);
  revalidatePath('/floor');
}

// Merge one open session's orders + payments into another, then free the source table.
export async function mergeSessions(fromSessionId: string, intoSessionId: string) {
  await authorize('manage:orders');
  if (fromSessionId === intoSessionId) return;
  const [from, into] = await Promise.all([
    prisma.tableSession.findUnique({ where: { id: fromSessionId } }),
    prisma.tableSession.findUnique({ where: { id: intoSessionId } }),
  ]);
  if (!from || !into || from.status === 'CLOSED' || into.status === 'CLOSED') return;
  await prisma.order.updateMany({ where: { sessionId: fromSessionId }, data: { sessionId: intoSessionId } });
  await prisma.payment.updateMany({ where: { sessionId: fromSessionId }, data: { sessionId: intoSessionId } });
  await prisma.tableSession.update({
    where: { id: intoSessionId },
    data: { customerCount: into.customerCount + from.customerCount },
  });
  await prisma.tableSession.update({
    where: { id: fromSessionId },
    data: { status: 'CLOSED', closedAt: new Date(), notes: `Merged into table ${into.tableId}` },
  });
  await prisma.table.update({ where: { id: from.tableId }, data: { state: 'CLEANING' } });
  await recomputeSessionTotals(intoSessionId);
  await logAudit('session.merge', 'TableSession', { entityId: intoSessionId, detail: `Merged from ${from.tableId}` });
  revalidatePath(`/pos/${into.tableId}`);
  revalidatePath(`/pos/${from.tableId}`);
  revalidatePath('/floor');
}

// Record a partial payment against a session (split bills / mixed tender).
export async function addPayment(sessionId: string, input: { amount: number; method: string }) {
  await authorize('manage:orders');
  if (!(input.amount > 0)) return;
  await prisma.payment.create({ data: { sessionId, amount: input.amount, method: input.method } });
  await logAudit('payment.add', 'Payment', { entityId: sessionId, detail: `${input.method} ${input.amount}` });
  const sess = await prisma.tableSession.findUnique({ where: { id: sessionId }, select: { tableId: true } });
  if (sess) revalidatePath(`/pos/${sess.tableId}`);
}

export async function closeTableSession(sessionId: string, opts?: { paymentMethod?: string }) {
  await authorize('operate:floor');
  const s = await prisma.tableSession.findUnique({
    where: { id: sessionId },
    include: { orders: { select: { total: true } }, payments: true },
  });
  if (!s || s.status === 'CLOSED') return;
  const subtotal = s.orders.reduce((sum, o) => sum + Number(o.total), 0);
  const total = Math.max(
    0,
    subtotal - Number(s.discount) + Number(s.tax) + Number(s.serviceCharge) + Number(s.tip),
  );
  const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.round((total - paid) * 100) / 100;

  const methods = new Set(s.payments.map((p) => p.method));
  const finalMethod = opts?.paymentMethod ?? 'Cash';
  if (remaining > 0.001) methods.add(finalMethod);
  const method = methods.size > 1 ? 'Mixed' : Array.from(methods)[0] ?? opts?.paymentMethod ?? null;

  await prisma.$transaction([
    ...(remaining > 0.001
      ? [prisma.payment.create({ data: { sessionId, amount: remaining, method: finalMethod } })]
      : []),
    prisma.tableSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', closedAt: new Date(), subtotal, total, paymentStatus: 'PAID', paymentMethod: method },
    }),
    prisma.table.update({ where: { id: s.tableId }, data: { state: 'CLEANING' } }),
  ]);
  await logAudit('session.close', 'TableSession', { entityId: sessionId, detail: `${method ?? ''} · total ${total}` });
  revalidatePath(`/pos/${s.tableId}`);
  revalidatePath('/floor');
}

export async function setTableState(tableId: string, state: TableStateValue) {
  await authorize('operate:floor');
  await prisma.table.update({ where: { id: tableId }, data: { state } });
  await logAudit('table.state', 'Table', { entityId: tableId, detail: state });
  revalidatePath('/floor');
}

// ---- Dashboard widget overrides (editable Trending / Top Categories) ----
export async function setTrendingItem(itemId: string | null) {
  await authorize('manage:menu');
  await prisma.dashboardConfig.upsert({
    where: { id: 'default' },
    update: { trendingItemId: itemId },
    create: { id: 'default', trendingItemId: itemId },
  });
  revalidatePath('/dashboard');
}

export async function setTopCategories(categories: { name: string; percent: number }[] | null) {
  await authorize('manage:menu');
  const json = categories && categories.length ? JSON.stringify(categories.slice(0, 3)) : null;
  await prisma.dashboardConfig.upsert({
    where: { id: 'default' },
    update: { topCategories: json },
    create: { id: 'default', topCategories: json },
  });
  revalidatePath('/dashboard');
}

// ---- Orders ----
export async function setOrderStatus(id: string, status: OrderStatus) {
  await authorize('manage:orders');
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: true },
  });

  // On completion, send the customer a branded thank-you email (online orders
  // capture an email). Never let a mail failure block the status update.
  if (status === 'COMPLETED' && order.customerEmail) {
    try {
      const mail = orderCompletedEmail({
        number: order.number,
        customerName: order.customerName,
        items: order.items.map((it) => ({ name: it.name, qty: it.qty, price: Number(it.price) })),
        total: Number(order.total),
      });
      await sendMail({ to: order.customerEmail, subject: mail.subject, html: mail.html, text: mail.text });
    } catch (mailErr) {
      console.error('Order completion email failed (status still updated):', mailErr);
    }
  }

  revalidatePath('/orders');
  revalidatePath('/dashboard');
}

// ---- Reservations ----
export async function setReservationStatus(id: string, status: ReservationStatus) {
  await authorize('manage:reservations');
  const r = await prisma.reservation.update({ where: { id }, data: { status } });

  // On completion, thank the guest with a branded email. Never let a mail
  // failure block the status update.
  if (status === 'COMPLETED' && r.email) {
    try {
      const mail = reservationCompletedEmail({
        reference: r.reference,
        name: r.name,
        kind: r.kind as 'TABLE' | 'PRIVATE_EVENT',
      });
      await sendMail({ to: r.email, subject: mail.subject, html: mail.html, text: mail.text });
    } catch (mailErr) {
      console.error('Reservation completion email failed (status still updated):', mailErr);
    }
  }

  revalidatePath('/reservations');
}

export interface ReservationEdit {
  date?: string; // "YYYY-MM-DD"
  time?: string;
  guests?: number;
  occasion?: string;
  requests?: string;
}

export async function updateReservation(id: string, input: ReservationEdit) {
  await authorize('manage:reservations');
  await prisma.reservation.update({
    where: { id },
    data: {
      ...(input.date ? { date: new Date(input.date) } : {}),
      ...(input.time !== undefined ? { time: input.time } : {}),
      ...(input.guests !== undefined ? { guests: input.guests } : {}),
      ...(input.occasion !== undefined ? { occasion: input.occasion } : {}),
      ...(input.requests !== undefined ? { requests: input.requests } : {}),
    },
  });
  revalidatePath('/reservations');
}

// ---- Staff ----
export async function setEmployeeStatus(id: string, status: DutyStatus) {
  await authorize('manage:staff');
  await prisma.employee.update({ where: { id }, data: { status } });
  revalidatePath('/staff');
  revalidatePath('/dashboard');
}

export async function createStaff(input: StaffInput) {
  await authorize('manage:staff');
  const data = staffSchema.parse(input);
  const outlet = await prisma.outlet.findFirst({ select: { id: true } });
  await prisma.employee.create({
    data: {
      name: data.name,
      role: data.role,
      email: data.email,
      phone: data.phone || null,
      active: data.active,
      password: data.password ? await bcrypt.hash(data.password, 10) : null,
      outletId: outlet?.id ?? 'default',
    },
  });
  revalidatePath('/staff');
  revalidatePath('/dashboard');
}

export async function updateStaff(id: string, input: StaffInput) {
  await authorize('manage:staff');
  const data = staffSchema.parse(input);
  await prisma.employee.update({
    where: { id },
    data: {
      name: data.name,
      role: data.role,
      email: data.email,
      phone: data.phone || null,
      active: data.active,
      // Empty password on edit keeps the existing one.
      ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {}),
    },
  });
  revalidatePath('/staff');
  revalidatePath('/dashboard');
}

export async function setStaffActive(id: string, active: boolean) {
  await authorize('manage:staff');
  await prisma.employee.update({ where: { id }, data: { active } });
  revalidatePath('/staff');
}

export async function deleteStaff(id: string) {
  await authorize('manage:staff');
  await prisma.employee.delete({ where: { id } });
  revalidatePath('/staff');
  revalidatePath('/dashboard');
}

// ---- Tables (QR ordering) ----
export async function createTable(input: TableInput) {
  await authorize('manage:tables');
  const data = tableSchema.parse(input);
  const t = await prisma.table.create({
    data: { number: data.number, name: data.name || null, status: data.status },
  });
  revalidatePath('/tables');
  return {
    id: t.id,
    number: t.number,
    name: t.name ?? undefined,
    code: t.code,
    status: t.status as 'ACTIVE' | 'INACTIVE',
    orderCount: 0,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function updateTable(id: string, input: TableInput) {
  await authorize('manage:tables');
  const data = tableSchema.parse(input);
  await prisma.table.update({
    where: { id },
    data: { number: data.number, name: data.name || null, status: data.status },
  });
  revalidatePath('/tables');
}

export async function setTableStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
  await authorize('manage:tables');
  await prisma.table.update({ where: { id }, data: { status } });
  revalidatePath('/tables');
}

export async function deleteTable(id: string) {
  await authorize('manage:tables');
  await prisma.table.delete({ where: { id } });
  revalidatePath('/tables');
}

// ---- Gift cards & coupons ----
export async function updateGiftCard(id: string, input: GiftCardEditInput) {
  await authorize('manage:coupons');
  const data = giftCardEditSchema.parse(input);
  await prisma.giftCard.update({
    where: { id },
    data: {
      customerName: data.customerName,
      customerEmail: data.customerEmail || '',
      kind: data.kind,
      amount: data.amount,
      status: data.status,
      paymentStatus: data.paymentStatus,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    },
  });
  revalidatePath('/gift-cards');
}

export async function setGiftCardStatus(id: string, status: CouponStatusValue) {
  await authorize('manage:coupons');
  const g = await prisma.giftCard.update({ where: { id }, data: { status } });

  // On redemption, thank the customer with a branded email. Never let a mail
  // failure block the status update.
  if (status === 'REDEEMED' && g.customerEmail) {
    try {
      const mail = giftCardRedeemedEmail({
        code: g.code,
        kind: g.kind as 'GIFT_CARD' | 'COUPON',
        amount: Number(g.amount),
        name: g.customerName,
      });
      await sendMail({ to: g.customerEmail, subject: mail.subject, html: mail.html, text: mail.text });
    } catch (mailErr) {
      console.error('Gift card redeemed email failed (status still updated):', mailErr);
    }
  }

  revalidatePath('/gift-cards');
}

export async function deleteGiftCard(id: string) {
  await authorize('manage:coupons');
  await prisma.giftCard.delete({ where: { id } });
  revalidatePath('/gift-cards');
}

// ---- Customers ----
export async function createCustomer(input: CustomerInput) {
  await authorize('manage:customers');
  const data = customerSchema.parse(input);
  await prisma.customer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      status: data.status,
    },
  });
  revalidatePath('/customers');
}

export async function updateCustomer(id: string, input: CustomerInput) {
  await authorize('manage:customers');
  const data = customerSchema.parse(input);
  await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      status: data.status,
    },
  });
  revalidatePath('/customers');
}

export async function deleteCustomer(id: string) {
  await authorize('manage:customers');
  await prisma.customer.delete({ where: { id } });
  revalidatePath('/customers');
}

// ---- Inventory ----
export async function createInventoryItem(input: InventoryItemInput) {
  await authorize('manage:inventory');
  const data = inventoryItemSchema.parse(input);
  await prisma.inventoryItem.create({ data });
  revalidatePath('/inventory');
}

export async function updateInventoryItem(id: string, input: InventoryItemInput) {
  await authorize('manage:inventory');
  const data = inventoryItemSchema.parse(input);
  await prisma.inventoryItem.update({ where: { id }, data });
  revalidatePath('/inventory');
}

export async function adjustInventory(id: string, delta: number) {
  await authorize('manage:inventory');
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) return;
  const quantity = Math.max(0, item.quantity + delta);
  await prisma.inventoryItem.update({ where: { id }, data: { quantity } });
  revalidatePath('/inventory');
}

export async function deleteInventoryItem(id: string) {
  await authorize('manage:inventory');
  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath('/inventory');
}

// ---- Settings ----
export async function updateProfile(input: ProfileInput) {
  await authorize('manage:settings');
  const data = profileSchema.parse(input);
  await prisma.restaurantProfile.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data },
  });
  revalidatePath('/settings');
}

export async function changePassword(input: PasswordInput): Promise<{ ok: boolean; error?: string }> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.kind !== 'user') return { ok: false, error: 'Unauthorized' };
  const { currentPassword, newPassword } = passwordSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return { ok: false, error: 'User not found' };
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { ok: false, error: 'Current password is incorrect' };
  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });
  return { ok: true };
}
