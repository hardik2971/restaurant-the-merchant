import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { reservationSchema } from '@/schemas/reservation';
import { SLOT_CAPACITY, validateSlot } from '@/lib/scheduling';
import { sendMail } from '@/lib/mail';
import { reservationConfirmationEmail } from '@/lib/email-templates';

// GET /api/reservations — list (newest first). Used by the admin module once
// the DB is live (currently the UI runs on mock data).
export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ reservations });
  } catch (err) {
    console.error('GET /api/reservations failed', err);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

// POST /api/reservations — the public site's ReservationFlow submits here.
// Generates a reference (SV-/EV-) and stores the booking as REQUESTED.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const prefix = data.kind === 'PRIVATE_EVENT' ? 'EV' : 'SV';
  const reference = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

  // Dine-in (TABLE) bookings get slot + double-booking validation. Private
  // events are inquiries handled manually, so they skip slot checks.
  if (data.kind === 'TABLE') {
    const check = validateSlot(data.date, data.time);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 422 });
    }
  }

  try {
    if (data.kind === 'TABLE') {
      const dayStart = new Date(`${data.date}T00:00:00`);
      const dayEnd = new Date(`${data.date}T23:59:59`);
      const taken = await prisma.reservation.count({
        where: {
          kind: 'TABLE',
          time: data.time,
          date: { gte: dayStart, lte: dayEnd },
          status: { notIn: ['CANCELED', 'NO_SHOW'] },
        },
      });
      if (taken >= SLOT_CAPACITY) {
        return NextResponse.json(
          { error: 'That time slot is fully booked — please choose another.' },
          { status: 409 },
        );
      }
    }

    // Link/create a customer record by email so reservations roll up into CRM.
    const customer = await prisma.customer.upsert({
      where: { email: data.email },
      update: { name: data.name, phone: data.phone },
      create: { name: data.name, email: data.email, phone: data.phone },
    });

    const reservation = await prisma.reservation.create({
      data: {
        reference,
        kind: data.kind,
        date: new Date(data.date),
        name: data.name,
        email: data.email,
        phone: data.phone,
        customerId: customer.id,
        ...(data.kind === 'TABLE'
          ? {
              time: data.time,
              guests: data.guests,
              occasion: data.occasion,
              requests: data.requests,
            }
          : {
              eventType: data.eventType,
              guestRange: data.guestRange,
              space: data.space,
              company: data.company,
              message: data.message,
            }),
      },
    });
    // Branded confirmation email — never fail the booking if mail/SMTP errors.
    try {
      const dateLabel = new Date(`${data.date}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const mail = reservationConfirmationEmail({
        reference,
        name: data.name,
        kind: data.kind,
        dateLabel,
        ...(data.kind === 'TABLE'
          ? { time: data.time, guests: data.guests, occasion: data.occasion, requests: data.requests }
          : {
              eventType: data.eventType,
              guestRange: data.guestRange,
              space: data.space,
              message: data.message,
            }),
      });
      await sendMail({ to: data.email, subject: mail.subject, html: mail.html, text: mail.text });
    } catch (mailErr) {
      console.error('Reservation confirmation email failed (booking still saved):', mailErr);
    }

    return NextResponse.json({ reference, id: reservation.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/reservations failed', err);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
