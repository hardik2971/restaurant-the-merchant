// Bearer-token auth for the Flutter app (Customer / Restaurant / Owner).
// Tokens are compact HS256 JWTs signed with AUTH_SECRET (no extra deps). A
// verified token becomes the request's principal via runAsMobileUser(), so the
// existing server actions (authorize / logAudit) work unchanged.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { can, type Action } from '@/lib/rbac';
import { runAsMobileUser, type SessionUser } from '@/lib/session-user';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  return s;
}

const b64url = (input: Buffer | string) => Buffer.from(input).toString('base64url');

export function signMobileToken(user: SessionUser): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({ sub: user.id, ...user, aud: 'mobile', iat: now, exp: now + TOKEN_TTL_SECONDS }),
  );
  const sig = createHmac('sha256', secret()).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export function verifyMobileToken(token: string): SessionUser | null {
  const [header, payload, sig] = token.split('.');
  if (!header || !payload || !sig) return null;
  const expected = createHmac('sha256', secret()).update(`${header}.${payload}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (p.aud !== 'mobile' || typeof p.exp !== 'number' || p.exp < Date.now() / 1000) return null;
    return { id: p.id, name: p.name, email: p.email, role: p.role ?? null, outletId: p.outletId ?? null, kind: p.kind };
  } catch {
    return null;
  }
}

export function bearerUser(req: Request): SessionUser | null {
  const h = req.headers.get('authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? verifyMobileToken(m[1]) : null;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Map thrown errors to JSON responses. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof ZodError) {
    return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid input', issues: err.issues }, { status: 400 });
  }
  if (err instanceof Error && err.message === 'Forbidden') {
    return NextResponse.json({ error: 'You do not have permission for this action' }, { status: 403 });
  }
  console.error('[mobile api]', err);
  // Never leak Prisma/DB internals; plain action errors ("Session is closed") are safe to show.
  if (err instanceof Error && (err.constructor.name.startsWith('PrismaClient') || /prisma/i.test(err.message))) {
    return NextResponse.json({ error: 'The restaurant database is unavailable. Please try again shortly.' }, { status: 503 });
  }
  const message = err instanceof Error ? err.message : 'Server error';
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Wrap a mobile route handler: requires a valid bearer token of the given
 * kind(s) and, optionally, an RBAC permission. The handler runs with the user
 * as the current principal so server actions authorize against it.
 */
export async function withMobileUser(
  req: Request,
  opts: { kinds: SessionUser['kind'][]; action?: Action },
  handler: (user: SessionUser) => Promise<unknown>,
): Promise<NextResponse> {
  const user = bearerUser(req);
  if (!user || !opts.kinds.includes(user.kind)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (opts.action && !can(user.role, opts.action)) {
    return NextResponse.json({ error: 'You do not have permission for this action' }, { status: 403 });
  }
  try {
    const result = await runAsMobileUser(user, () => handler(user));
    if (result instanceof NextResponse) return result;
    return NextResponse.json(result ?? { ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}
