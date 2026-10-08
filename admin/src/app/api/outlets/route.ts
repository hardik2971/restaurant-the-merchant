import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// GET /api/outlets — list outlets with their metrics.
export async function GET() {
  try {
    const outlets = await prisma.outlet.findMany({
      orderBy: { name: 'asc' },
      include: { metrics: { orderBy: { periodStart: 'asc' } } },
    });
    return NextResponse.json({ outlets });
  } catch (err) {
    console.error('GET /api/outlets failed', err);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

const createOutletSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  manager: z.string().optional(),
  isActive: z.boolean().default(true),
});

// POST /api/outlets — create an outlet.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createOutletSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const outlet = await prisma.outlet.create({ data: parsed.data });
    return NextResponse.json({ outlet }, { status: 201 });
  } catch (err) {
    console.error('POST /api/outlets failed', err);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
