// Customer app API — /api/mobile/customer/* (bearer token, kind = customer).
// Ordering, reservations and gift cards reuse the website's public flows, with
// the signed-in customer's identity filled in server-side.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/mobile-auth';
import { handlers, route, type Ctx } from '@/lib/mobile-router';
import { placeOnlineOrder } from '@/lib/online-order';
import { onlineOrderSchema } from '@/schemas/order';
import { getProfile } from '@/lib/queries';
import { estimatePickup } from '@/lib/scheduling';
import { POST as createReservation } from '@/app/api/reservations/route';
import { POST as createGiftCard } from '@/app/api/gift-cards/route';

async function me(ctx: Ctx) {
  const c = await prisma.customer.findUnique({ where: { id: ctx.user.id } });
  if (!c) throw new HttpError(401, 'Account not found');
  return c;
}

// Orders placed in the app or earlier as a website guest with the same email.
const mine = (ctx: Ctx): Prisma.OrderWhereInput => ({
  OR: [{ customerId: ctx.user.id }, { customerEmail: ctx.user.email }],
});

const orderInclude = {
  items: true,
  session: { include: { payments: true } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function orderView(o: OrderRow) {
  const paid = o.session?.payments.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  return {
    id: o.id,
    number: o.number,
    type: o.type,
    status: o.status,
    channel: o.channel,
    total: Number(o.total),
    paid: o.paymentMethod === 'ONLINE' || !!o.razorpayPaymentId,
    paymentProvider: o.paymentProvider ?? undefined,
    scheduleType: o.scheduleType,
    scheduleDate: o.scheduleDate?.toISOString(),
    scheduleTime: o.scheduleTime ?? undefined,
    estimatedPickup:
      o.type === 'PICKUP'
        ? estimatePickup(
            o.scheduleType,
            o.scheduleDate?.toISOString().slice(0, 10),
            o.scheduleTime ?? undefined,
            o.createdAt,
          ).toISOString()
        : undefined,
    tableNumber: o.tableNumber ?? undefined,
    notes: o.notes ?? undefined,
    items: o.items.map((i) => ({ name: i.name, qty: i.qty, price: Number(i.price) })),
    session: o.session
      ? {
          id: o.session.id,
          status: o.session.status,
          total: Number(o.session.total),
          paid,
          remaining: Math.max(0, Math.round((Number(o.session.total) - paid) * 100) / 100),
        }
      : undefined,
    createdAt: o.createdAt.toISOString(),
  };
}

function reservationView(r: Prisma.ReservationGetPayload<object>) {
  return {
    id: r.id,
    reference: r.reference,
    kind: r.kind,
    status: r.status,
    date: r.date.toISOString(),
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
  };
}

/** Forward to a public route handler with the customer identity injected. */
async function forward(handler: (req: Request) => Promise<Response>, payload: Record<string, unknown>) {
  const res = await handler(
    new Request('http://internal/forward', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}

const ACTIVE_ORDER = ['PENDING', 'PREPARING', 'READY'] as const;

const routes = [
  // Home: restaurant info + live order / upcoming booking cards.
  route('GET', 'home', undefined, async (ctx) => {
    const [profile, active, upcoming] = await Promise.all([
      getProfile(),
      prisma.order.findMany({
        where: { AND: [mine(ctx), { status: { in: [...ACTIVE_ORDER] } }] },
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.reservation.findMany({
        where: {
          OR: [{ customerId: ctx.user.id }, { email: ctx.user.email }],
          status: { in: ['REQUESTED', 'CONFIRMED'] },
          date: { gte: new Date(new Date().toDateString()) },
        },
        orderBy: { date: 'asc' },
        take: 3,
      }),
    ]);
    return { profile, activeOrders: active.map(orderView), upcomingReservations: upcoming.map(reservationView) };
  }),

  // ---- Orders ----
  route('GET', 'orders', undefined, async (ctx) => {
    const rows = await prisma.order.findMany({ where: mine(ctx), include: orderInclude, orderBy: { createdAt: 'desc' }, take: 100 });
    return { orders: rows.map(orderView) };
  }),
  route('GET', 'orders/:id', undefined, async (ctx) => {
    const o = await prisma.order.findFirst({ where: { AND: [mine(ctx), { id: ctx.params.id }] }, include: orderInclude });
    if (!o) throw new HttpError(404, 'Order not found');
    return { order: orderView(o) };
  }),
  // Place a Take Away or table (QR) order. `payAtRestaurant: true` skips the
  // online gateway; otherwise `payment` must carry a verified gateway result.
  route('POST', 'orders', undefined, async (ctx) => {
    const c = await me(ctx);
    const body = await ctx.body();
    const parsed = onlineOrderSchema.safeParse({
      ...body,
      name: c.name,
      email: c.email,
      phone: c.phone || (body.phone as string) || '',
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid order', issues: parsed.error.issues }, { status: 400 });
    }
    return placeOnlineOrder(parsed.data, { payAtRestaurant: body.payAtRestaurant === true });
  }),

  // ---- Reservations ----
  route('GET', 'reservations', undefined, async (ctx) => {
    const rows = await prisma.reservation.findMany({
      where: { OR: [{ customerId: ctx.user.id }, { email: ctx.user.email }] },
      orderBy: { date: 'desc' },
    });
    return { reservations: rows.map(reservationView) };
  }),
  route('POST', 'reservations', undefined, async (ctx) => {
    const c = await me(ctx);
    const body = await ctx.body();
    return forward(createReservation, { ...body, name: c.name, email: c.email, phone: c.phone || body.phone || '' });
  }),
  route('POST', 'reservations/:id/cancel', undefined, async (ctx) => {
    const r = await prisma.reservation.findFirst({
      where: { id: ctx.params.id, OR: [{ customerId: ctx.user.id }, { email: ctx.user.email }] },
    });
    if (!r) throw new HttpError(404, 'Reservation not found');
    if (!['REQUESTED', 'CONFIRMED'].includes(r.status)) throw new HttpError(422, 'This booking can no longer be cancelled');
    const updated = await prisma.reservation.update({ where: { id: r.id }, data: { status: 'CANCELED' } });
    return { reservation: reservationView(updated) };
  }),

  // ---- Gift cards ----
  route('GET', 'gift-cards', undefined, async (ctx) => {
    const rows = await prisma.giftCard.findMany({
      where: { OR: [{ customerId: ctx.user.id }, { customerEmail: ctx.user.email }] },
      orderBy: { createdAt: 'desc' },
    });
    return {
      giftCards: rows.map((g) => ({
        id: g.id,
        code: g.code,
        kind: g.kind,
        amount: Number(g.amount),
        message: g.message ?? undefined,
        status: g.status,
        paymentStatus: g.paymentStatus,
        expiryDate: g.expiryDate?.toISOString(),
        createdAt: g.createdAt.toISOString(),
      })),
    };
  }),
  route('POST', 'gift-cards', undefined, async (ctx) => {
    const c = await me(ctx);
    const body = z
      .object({ kind: z.enum(['GIFT_CARD', 'COUPON']).default('GIFT_CARD'), amount: z.coerce.number().positive(), message: z.string().max(500).optional(), payment: z.unknown().optional() })
      .parse(await ctx.body());
    // The public flow links the card to the customer by email.
    return forward(createGiftCard, { ...body, name: c.name, email: c.email });
  }),

  // ---- Table QR ----
  route('GET', 'tables/:code', undefined, async (ctx) => {
    const t = await prisma.table.findFirst({ where: { code: ctx.params.code, status: 'ACTIVE' } });
    if (!t) throw new HttpError(404, 'Table not found or not accepting orders');
    return { table: { id: t.id, number: t.number, name: t.name ?? undefined, code: t.code } };
  }),
];

export const { GET, POST, PUT, PATCH, DELETE } = handlers(routes, ['customer']);
