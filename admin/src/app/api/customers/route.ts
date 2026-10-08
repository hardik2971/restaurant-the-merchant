import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/customers — customer list with aggregated order/reservation counts
// and lifetime spend.
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: {
        orders: { select: { number: true, total: true, status: true, createdAt: true } },
        reservations: { select: { reference: true, kind: true, status: true, date: true } },
      },
    });
    return NextResponse.json({ customers });
  } catch (err) {
    console.error('GET /api/customers failed', err);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
