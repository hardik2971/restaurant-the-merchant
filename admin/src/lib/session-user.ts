import { AsyncLocalStorage } from 'node:async_hooks';
import type { Role } from '@prisma/client';
import { auth } from '@/lib/auth';

// The signed-in principal, whichever way they authenticated:
//  - admin web → NextAuth cookie session (User)
//  - mobile app → bearer JWT (User, Employee or Customer), see mobile-auth.ts
// Customers carry no staff role, so `can()` always denies them.
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role | null;
  outletId: string | null;
  kind: 'user' | 'employee' | 'customer';
}

const mobileUser = new AsyncLocalStorage<SessionUser>();

/** Run `fn` with a mobile (bearer-token) user as the current principal. */
export function runAsMobileUser<T>(user: SessionUser, fn: () => Promise<T>): Promise<T> {
  return mobileUser.run(user, fn);
}

/** Current principal — the mobile user for this request, else the web session. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const m = mobileUser.getStore();
  if (m) return m;
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role,
    outletId: session.user.outletId ?? null,
    kind: 'user',
  };
}
