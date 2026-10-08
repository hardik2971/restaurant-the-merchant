import { describe, it, expect } from 'vitest';
import { can } from '@/lib/rbac';

describe('rbac.can', () => {
  it('OWNER can do everything', () => {
    expect(can('OWNER', 'manage:settings')).toBe(true);
    expect(can('OWNER', 'manage:staff')).toBe(true);
    expect(can('OWNER', 'view:dashboard')).toBe(true);
  });

  it('MANAGER can run operations but not settings', () => {
    expect(can('MANAGER', 'manage:menu')).toBe(true);
    expect(can('MANAGER', 'manage:inventory')).toBe(true);
    expect(can('MANAGER', 'view:reports')).toBe(true);
    expect(can('MANAGER', 'manage:settings')).toBe(false);
  });

  it('STAFF is limited to dashboard, orders, reservations', () => {
    expect(can('STAFF', 'view:dashboard')).toBe(true);
    expect(can('STAFF', 'manage:orders')).toBe(true);
    expect(can('STAFF', 'manage:reservations')).toBe(true);
    expect(can('STAFF', 'manage:menu')).toBe(false);
    expect(can('STAFF', 'manage:staff')).toBe(false);
    expect(can('STAFF', 'view:reports')).toBe(false);
  });

  it('returns false for a missing role', () => {
    expect(can(undefined, 'view:dashboard')).toBe(false);
    expect(can(null, 'manage:orders')).toBe(false);
  });
});
