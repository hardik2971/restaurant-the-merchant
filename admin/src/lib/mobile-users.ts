// Account lookups + public profile shapes for the Flutter app's three logins.
import type { Role } from '@prisma/client';
import { prisma } from '@/lib/db';
import { can, type Action } from '@/lib/rbac';
import type { SessionUser } from '@/lib/session-user';

export type MobileApp = 'customer' | 'restaurant' | 'owner';

const ALL_ACTIONS: Action[] = [
  'view:dashboard',
  'manage:menu',
  'manage:orders',
  'manage:reservations',
  'manage:tables',
  'operate:floor',
  'manage:coupons',
  'manage:outlets',
  'manage:staff',
  'manage:customers',
  'manage:inventory',
  'view:reports',
  'manage:settings',
];

/** Employee directory roles → RBAC role used by the Restaurant app. */
export function employeeRole(role: string): Role {
  return /manager|super admin/i.test(role) ? 'MANAGER' : 'STAFF';
}

/** Profile returned by login / me — what the app renders and gates on. */
export async function mobileProfile(user: SessionUser) {
  const base = {
    id: user.id,
    name: user.name,
    email: user.email,
    kind: user.kind,
    role: user.role,
    permissions: ALL_ACTIONS.filter((a) => can(user.role, a)),
  };
  if (user.kind === 'customer') {
    const c = await prisma.customer.findUnique({ where: { id: user.id } });
    return { ...base, phone: c?.phone ?? '', address: c?.address ?? '' };
  }
  if (user.kind === 'employee') {
    const e = await prisma.employee.findUnique({ where: { id: user.id } });
    return { ...base, phone: e?.phone ?? '', title: e?.role ?? 'Staff', dutyStatus: e?.status ?? 'OFF' };
  }
  return { ...base, phone: '', title: user.role === 'OWNER' ? 'Owner' : user.role === 'MANAGER' ? 'Manager' : 'Staff' };
}

export function customerSession(c: { id: string; name: string; email: string }): SessionUser {
  return { id: c.id, name: c.name, email: c.email, role: null, outletId: null, kind: 'customer' };
}
