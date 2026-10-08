import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/menu — public menu feed for the website (online ordering + QR menu).
// Returns only available items in active categories so the storefront always
// reflects the latest admin menu data. No auth: this is customer-facing.
export async function GET() {
  try {
    // Only available items in active categories — disabled categories, hidden
    // and unavailable products never reach the storefront.
    const rows = await prisma.menuItem.findMany({
      where: { available: true, category: { active: true } },
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    const items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      rating: r.rating,
      tag: r.tag ?? '',
      category: r.category.name,
      imageUrl: r.imageUrl,
    }));

    const categories = Array.from(new Set(items.map((i) => i.category)));

    return NextResponse.json(
      { items, categories },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('GET /api/menu failed', err);
    return NextResponse.json({ error: 'Menu unavailable' }, { status: 503 });
  }
}
