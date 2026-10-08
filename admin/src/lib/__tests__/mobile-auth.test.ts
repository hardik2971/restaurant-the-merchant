import { describe, it, expect, beforeAll, vi } from 'vitest';

// session-user imports next-auth via @/lib/auth; the token helpers don't need it.
vi.mock('@/lib/auth', () => ({ auth: async () => null }));

import { signMobileToken, verifyMobileToken, bearerUser } from '@/lib/mobile-auth';
import { can } from '@/lib/rbac';
import { employeeRole } from '@/lib/mobile-users';
import type { SessionUser } from '@/lib/session-user';

const owner: SessionUser = { id: 'u1', name: 'George', email: 'g@x.test', role: 'OWNER', outletId: null, kind: 'user' };

describe('mobile bearer tokens', () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = 'test-secret';
  });

  it('round-trips a signed token', () => {
    expect(verifyMobileToken(signMobileToken(owner))).toEqual(owner);
  });

  it('rejects a tampered payload', () => {
    const [h, , s] = signMobileToken(owner).split('.');
    const forged = Buffer.from(JSON.stringify({ ...owner, role: 'OWNER', id: 'evil', aud: 'mobile', exp: 9e9 })).toString('base64url');
    expect(verifyMobileToken(`${h}.${forged}.${s}`)).toBeNull();
  });

  it('reads the Authorization header', () => {
    const req = new Request('http://x', { headers: { authorization: `Bearer ${signMobileToken(owner)}` } });
    expect(bearerUser(req)?.id).toBe('u1');
    expect(bearerUser(new Request('http://x'))).toBeNull();
  });
});

describe('mobile roles', () => {
  it('maps employee titles to RBAC roles', () => {
    expect(employeeRole('Manager')).toBe('MANAGER');
    expect(employeeRole('Super Admin')).toBe('MANAGER');
    expect(employeeRole('Waiter')).toBe('STAFF');
  });

  it('lets staff operate the floor but not edit tables', () => {
    expect(can('STAFF', 'operate:floor')).toBe(true);
    expect(can('STAFF', 'manage:tables')).toBe(false);
    expect(can(null, 'view:dashboard')).toBe(false); // customers
  });
});
