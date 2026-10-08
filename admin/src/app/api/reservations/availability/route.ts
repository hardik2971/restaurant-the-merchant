import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { allSlots, SLOT_CAPACITY, LEAD_MINUTES, slotDateTime } from '@/lib/scheduling';

// GET /api/reservations/availability?date=YYYY-MM-DD
// Returns the 30-minute dine-in slots for a day with how many are still open,
// so the website only shows bookable times and can't double-book.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'A valid date (YYYY-MM-DD) is required' }, { status: 400 });
  }

  try {
    // Count active TABLE reservations per slot for the requested day.
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);
    const taken = await prisma.reservation.findMany({
      where: {
        kind: 'TABLE',
        date: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
        time: { not: null },
      },
      select: { time: true },
    });

    const usedBySlot = new Map<string, number>();
    for (const r of taken) {
      if (!r.time) continue;
      usedBySlot.set(r.time, (usedBySlot.get(r.time) ?? 0) + 1);
    }

    const now = Date.now();
    const slots = allSlots().map((time) => {
      const used = usedBySlot.get(time) ?? 0;
      const when = slotDateTime(date, time);
      const pastCutoff = when ? when.getTime() < now + LEAD_MINUTES * 60_000 : true;
      const remaining = Math.max(0, SLOT_CAPACITY - used);
      return { time, available: remaining > 0 && !pastCutoff, remaining };
    });

    return NextResponse.json({ date, slots });
  } catch (err) {
    console.error('GET /api/reservations/availability failed', err);
    return NextResponse.json({ error: 'Availability unavailable' }, { status: 503 });
  }
}
