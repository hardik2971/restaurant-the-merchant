import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, signMobileToken } from '@/lib/mobile-auth';
import { customerSession, employeeRole, mobileProfile } from '@/lib/mobile-users';
import type { SessionUser } from '@/lib/session-user';

const loginBody = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  app: z.enum(['customer', 'restaurant', 'owner']),
});

const INVALID = 'Invalid email or password';

// POST /api/mobile/auth/login — one endpoint, three apps:
//  - customer   → Customer with an app password
//  - restaurant → admin User (any role) or an active Employee with a password
//  - owner      → admin User with role OWNER
export async function POST(req: Request) {
  try {
    const { email, password, app } = loginBody.parse(await req.json().catch(() => ({})));
    const fail = (msg = INVALID, status = 401) => NextResponse.json({ error: msg }, { status });
    let user: SessionUser | null = null;

    if (app === 'customer') {
      const c = await prisma.customer.findUnique({ where: { email } });
      if (!c?.password || !(await bcrypt.compare(password, c.password))) return fail();
      if (c.status !== 'ACTIVE') return fail('This account is inactive. Please contact the restaurant.', 403);
      user = customerSession(c);
    } else {
      const u = await prisma.user.findUnique({ where: { email } });
      if (u && (await bcrypt.compare(password, u.password))) {
        if (app === 'owner' && u.role !== 'OWNER') return fail('Owner access only. Use the Restaurant app.', 403);
        user = { id: u.id, name: u.name, email: u.email, role: u.role, outletId: u.outletId, kind: 'user' };
      } else if (app === 'restaurant') {
        const e = await prisma.employee.findFirst({ where: { email } });
        if (!e?.password || !(await bcrypt.compare(password, e.password))) return fail();
        if (!e.active) return fail('Your staff account is inactive.', 403);
        user = { id: e.id, name: e.name, email: e.email ?? email, role: employeeRole(e.role), outletId: e.outletId, kind: 'employee' };
      } else {
        return fail();
      }
    }

    return NextResponse.json({ token: signMobileToken(user), user: await mobileProfile(user) });
  } catch (err) {
    return errorResponse(err);
  }
}
