// Tiny route table for the /api/mobile/{customer,staff}/[...path] catch-alls,
// so each endpoint is one line: method + pattern (+ permission) → handler.
import { NextResponse } from 'next/server';
import type { Action } from '@/lib/rbac';
import { can } from '@/lib/rbac';
import { withMobileUser } from '@/lib/mobile-auth';
import type { SessionUser } from '@/lib/session-user';

export interface Ctx {
  user: SessionUser;
  params: Record<string, string>;
  query: URLSearchParams;
  body: () => Promise<Record<string, unknown>>;
}

export interface MobileRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  pattern: string; // e.g. "sessions/:id/items"
  action?: Action;
  handler: (ctx: Ctx) => Promise<unknown>;
}

export function route(
  method: MobileRoute['method'],
  pattern: string,
  action: Action | undefined,
  handler: MobileRoute['handler'],
): MobileRoute {
  return { method, pattern, action, handler };
}

function match(pattern: string, segments: string[]): Record<string, string> | null {
  const parts = pattern.split('/');
  if (parts.length !== segments.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(':')) params[parts[i].slice(1)] = decodeURIComponent(segments[i]);
    else if (parts[i] !== segments[i]) return null;
  }
  return params;
}

export function dispatcher(routes: MobileRoute[], kinds: SessionUser['kind'][]) {
  return async (req: Request, segments: string[]) =>
    withMobileUser(req, { kinds }, async (user) => {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const params = match(r.pattern, segments);
        if (!params) continue;
        if (r.action && !can(user.role, r.action)) {
          return NextResponse.json({ error: 'You do not have permission for this action' }, { status: 403 });
        }
        let cached: Record<string, unknown> | null = null;
        const body = async () => (cached ??= ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>);
        return r.handler({ user, params, query: new URL(req.url).searchParams, body });
      }
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    });
}

type RouteCtx = { params: Promise<{ path: string[] }> };

/** Export GET/POST/PUT/PATCH/DELETE for a catch-all route file. */
export function handlers(routes: MobileRoute[], kinds: SessionUser['kind'][]) {
  const run = dispatcher(routes, kinds);
  const h = async (req: Request, ctx: RouteCtx) => run(req, (await ctx.params).path ?? []);
  return { GET: h, POST: h, PUT: h, PATCH: h, DELETE: h };
}
