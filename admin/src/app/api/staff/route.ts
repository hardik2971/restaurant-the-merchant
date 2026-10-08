import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// GET /api/staff — employee directory.
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ employees });
  } catch (err) {
    console.error('GET /api/staff failed', err);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

const createEmployeeSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(1),
  outletId: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(['ON_DUTY', 'ON_BREAK', 'ABSENT', 'OFF']).default('OFF'),
});

// POST /api/staff — add an employee.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const employee = await prisma.employee.create({ data: parsed.data });
    return NextResponse.json({ employee }, { status: 201 });
  } catch (err) {
    console.error('POST /api/staff failed', err);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
