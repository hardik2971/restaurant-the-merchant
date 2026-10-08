import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/tables/[code] — public. Resolves a scanned table QR code to the
// table so the storefront can auto-identify it. Only ACTIVE tables resolve.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const t = await prisma.table.findFirst({
      where: { code, status: 'ACTIVE' },
      select: { id: true, number: true, name: true, code: true },
    });
    if (!t) {
      return NextResponse.json({ error: 'Table not found or inactive' }, { status: 404 });
    }
    return NextResponse.json({ table: t }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('GET /api/tables/[code] failed', err);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 503 });
  }
}
