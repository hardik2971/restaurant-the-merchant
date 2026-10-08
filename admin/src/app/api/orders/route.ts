import { NextResponse } from 'next/server';
import { onlineOrderSchema } from '@/schemas/order';
import { placeOnlineOrder } from '@/lib/online-order';

// POST /api/orders — the public website's online ordering flow submits here.
//  - TAKE_AWAY: pickup order with optional scheduling → persisted as PICKUP.
//  - DINE_IN:   table QR order → persisted as DINE_IN tied to a table.
// Prices are always taken from live menu rows so the order syncs into the admin
// Orders module + dashboard immediately.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = onlineOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid order', issues: parsed.error.issues }, { status: 400 });
  }
  return placeOnlineOrder(parsed.data);
}
