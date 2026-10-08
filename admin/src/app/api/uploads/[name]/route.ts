import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
};

// GET /api/uploads/[name] — serves an uploaded image from the on-disk uploads
// dir. Public (menu images are customer-facing). Filename is validated to block
// path traversal.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-z0-9._-]+$/i.test(name)) {
    return new NextResponse('Bad request', { status: 400 });
  }

  const file = path.join(process.cwd(), 'uploads', name);
  try {
    const buf = await readFile(file);
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
