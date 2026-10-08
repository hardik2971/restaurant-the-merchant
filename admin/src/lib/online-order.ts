import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { OnlineOrderInput } from '@/schemas/order';
import { estimatePickup, validateSlot } from '@/lib/scheduling';
import { sendMail } from '@/lib/mail';
import { orderConfirmationEmail } from '@/lib/email-templates';
import { paymentAccepted, paymentRef } from '@/lib/payment';

// Shared online-order placement used by POST /api/orders (website) and the
// Customer app (/api/mobile/customer/orders).
//  - TAKE_AWAY: pickup order with optional scheduling → persisted as PICKUP.
//  - DINE_IN:   table QR order → persisted as DINE_IN tied to a table.
// Prices are always taken from live menu rows so the order syncs into the admin
// Orders module + dashboard immediately.
//  - payAtRestaurant: the signed-in app customer settles at the counter/table,
//    so the gateway gate is skipped and the order is stored unpaid.
export async function placeOnlineOrder(
  data: OnlineOrderInput,
  opts: { payAtRestaurant?: boolean } = {},
): Promise<NextResponse> {
  const payLater = !!opts.payAtRestaurant && !data.payment;

  // Payment gate (enforced once a gateway is configured) — Razorpay or Stripe.
  if (!payLater) {
    const pay = await paymentAccepted(data.payment);
    if (!pay.ok) {
      return NextResponse.json({ error: pay.reason ?? 'Payment required' }, { status: 402 });
    }
  }
  const paymentProvider = data.payment?.provider ?? null;
  const razorpayPaymentId = paymentRef(data.payment);

  // Cutoff / business-hours validation for scheduled (LATER) pickups.
  if (data.type === 'TAKE_AWAY' && data.scheduleType === 'LATER') {
    const check = validateSlot(data.scheduleDate ?? '', data.scheduleTime ?? '');
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 422 });
    }
  }

  try {
    // Resolve & price the cart from live menu rows (never trust client prices).
    // Match by id first, then by name (covers content-seeded storefront ids).
    const ids = data.items.map((i) => i.menuItemId);
    const names = data.items.map((i) => i.name).filter((n): n is string => !!n);
    const menuRows = await prisma.menuItem.findMany({
      where: { OR: [{ id: { in: ids } }, { name: { in: names } }] },
    });
    const byId = new Map(menuRows.map((m) => [m.id, m]));
    const byName = new Map(menuRows.map((m) => [m.name, m]));

    const lines = data.items.map((i) => {
      const mi = byId.get(i.menuItemId) ?? (i.name ? byName.get(i.name) : undefined);
      if (!mi) throw new Error(`Item not found: ${i.name ?? i.menuItemId}`);
      if (!mi.available) throw new Error(`Item unavailable: ${mi.name}`);
      return { menuItemId: mi.id, name: mi.name, qty: i.qty, price: mi.price };
    });
    const total = lines.reduce((s, l) => s + Number(l.price) * l.qty, 0);

    // Single-outlet fallback keeps the required outletId satisfied.
    const outlet = await prisma.outlet.findFirst({ select: { id: true } });
    const outletId = outlet?.id ?? 'online';
    const number = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const email = data.email || undefined;

    // Link/create a customer when we have an email (table orders may omit it).
    const customerId = email
      ? (
          await prisma.customer.upsert({
            where: { email },
            update: { name: data.name, ...(data.phone ? { phone: data.phone } : {}) },
            create: { name: data.name, email, phone: data.phone || null },
          })
        ).id
      : null;

    const itemsCreate = {
      create: lines.map(({ menuItemId, name, qty, price }) => ({ menuItemId, name, qty, price })),
    };

    // -------- DINE_IN: table QR order --------
    if (data.type === 'DINE_IN') {
      const table = await prisma.table.findFirst({
        where: { code: data.tableCode, status: 'ACTIVE' },
        select: { id: true, number: true },
      });
      if (!table) {
        return NextResponse.json({ error: 'Table not found or inactive' }, { status: 422 });
      }

      // Attach to the table's open session (auto-open one on QR self-seat) so
      // the order rolls into the table's bill + floor plan.
      let session = await prisma.tableSession.findFirst({
        where: { tableId: table.id, status: 'OPEN' },
        select: { id: true },
      });
      if (!session) {
        session = await prisma.tableSession.create({
          data: { tableId: table.id, customerName: data.name },
          select: { id: true },
        });
        await prisma.table.update({ where: { id: table.id }, data: { state: 'OCCUPIED' } });
      }

      const order = await prisma.order.create({
        data: {
          number,
          type: 'DINE_IN',
          status: 'PENDING',
          channel: 'ONLINE',
          paymentMethod: data.payment ? 'ONLINE' : null,
          paymentProvider,
          razorpayPaymentId,
          total,
          outletId,
          customerName: data.name,
          customerEmail: email,
          customerPhone: data.phone || null,
          customerId,
          tableId: table.id,
          tableNumber: table.number,
          sessionId: session.id,
          notes: data.notes,
          items: itemsCreate,
        },
      });

      // Optional receipt email if the guest provided one.
      if (email) {
        try {
          const mail = orderConfirmationEmail({
            number: order.number,
            customerName: data.name,
            items: lines.map((l) => ({ name: l.name, qty: l.qty, price: Number(l.price) })),
            total,
            pickupLabel: `Dine-in · Table ${table.number}`,
            notes: data.notes,
          });
          await sendMail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
        } catch (mailErr) {
          console.error('Order email failed (order still placed):', mailErr);
        }
      }

      return NextResponse.json(
        { number: order.number, id: order.id, total, tableNumber: table.number },
        { status: 201 },
      );
    }

    // -------- TAKE_AWAY: pickup order --------
    const pickup = estimatePickup(data.scheduleType, data.scheduleDate, data.scheduleTime);
    const order = await prisma.order.create({
      data: {
        number,
        type: 'PICKUP', // "Take Away"
        status: 'PENDING',
        channel: 'ONLINE',
        paymentMethod: payLater ? null : 'ONLINE',
        paymentProvider,
        razorpayPaymentId,
        total,
        outletId,
        customerName: data.name,
        customerEmail: email,
        customerPhone: data.phone,
        customerId,
        scheduleType: data.scheduleType,
        scheduleDate: data.scheduleType === 'LATER' ? new Date(data.scheduleDate!) : null,
        scheduleTime: data.scheduleType === 'LATER' ? data.scheduleTime : null,
        notes: data.notes,
        items: itemsCreate,
      },
    });

    const pickupLabel =
      data.scheduleType === 'LATER'
        ? pickup.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : `As soon as possible (around ${pickup.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })})`;
    try {
      const mail = orderConfirmationEmail({
        number: order.number,
        customerName: data.name,
        items: lines.map((l) => ({ name: l.name, qty: l.qty, price: Number(l.price) })),
        total,
        pickupLabel,
        notes: data.notes,
      });
      if (email) await sendMail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
    } catch (mailErr) {
      console.error('Order confirmation email failed (order still placed):', mailErr);
    }

    return NextResponse.json(
      { number: order.number, id: order.id, total, estimatedPickup: pickup.toISOString() },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not place order';
    const isClient = /not found|unavailable/i.test(message);
    console.error('placeOnlineOrder failed', err);
    return NextResponse.json(
      { error: isClient ? message : 'Could not place order' },
      { status: isClient ? 422 : 503 },
    );
  }
}
