import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { can, type Action } from '@/lib/rbac';

/**
 * Server guard for protected pages. Ensures the user is signed in and holds the
 * required permission; otherwise redirects (to /login or back to /dashboard).
 * Returns the session so callers can read the user.
 */
export async function requirePermission(action: Action) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!can(session.user.role, action)) redirect('/dashboard');
  return session;
}
