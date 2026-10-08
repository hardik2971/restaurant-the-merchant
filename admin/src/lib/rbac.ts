import type { Role } from '@prisma/client';

/** Granular actions gated by role. Extend as modules land. */
export type Action =
  | 'view:dashboard'
  | 'manage:menu'
  | 'manage:orders'
  | 'manage:reservations'
  | 'manage:tables'
  | 'operate:floor' // open/close table sessions, change live table state
  | 'manage:coupons'
  | 'manage:outlets'
  | 'manage:staff'
  | 'manage:customers'
  | 'manage:inventory'
  | 'view:reports'
  | 'manage:settings';

// OWNER can do everything; MANAGER runs day-to-day ops; STAFF is read/operate-only.
const PERMISSIONS: Record<Role, Action[] | '*'> = {
  OWNER: '*',
  MANAGER: [
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
  ],
  // STAFF runs the floor (open/close table sessions) but can't edit the table list.
  STAFF: ['view:dashboard', 'manage:orders', 'manage:reservations', 'operate:floor'],
};

export function can(role: Role | undefined | null, action: Action): boolean {
  if (!role) return false;
  const perms = PERMISSIONS[role];
  return perms === '*' || perms.includes(action);
}
