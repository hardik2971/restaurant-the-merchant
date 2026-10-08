import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';
import { bearerUser } from '@/lib/mobile-auth';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';

// POST /api/upload — accepts an image file (multipart form-data, field "file"),
// stores it under public/uploads, and returns an absolute URL. Auth-gated
// (admin only). The absolute URL lets the public website load it cross-origin.
export async function POST(req: Request) {
  // Admin web session, or a staff bearer token that may edit the menu (mobile app).
  const session = await auth();
  const mobile = bearerUser(req);
  if (!session?.user && !(mobile && can(mobile.role, 'manage:menu'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 415 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 413 });
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  // Stored outside /public (Next snapshots public at build time and won't serve
  // runtime-added files) and served back via GET /api/uploads/[name].
  const dir = path.join(process.cwd(), 'uploads');

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    console.error('Upload write failed', err);
    return NextResponse.json({ error: 'Could not save image' }, { status: 500 });
  }

  const { protocol, host } = new URL(req.url);
  return NextResponse.json({ url: `${protocol}//${host}/api/uploads/${filename}` }, { status: 201 });
}
