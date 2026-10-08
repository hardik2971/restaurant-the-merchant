'use client';

import { useSession } from 'next-auth/react';
import { can, type Action } from '@/lib/rbac';

/**
 * Client-side gate for actions/buttons. Renders children only if the current
 * user's role permits the action.
 */
export function Can({ action, children }: { action: Action; children: React.ReactNode }) {
  const { data: session } = useSession();
  if (!session?.user || !can(session.user.role, action)) return null;
  return <>{children}</>;
}
