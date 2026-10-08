import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withMobileUser } from '@/lib/mobile-auth';
import { mobileProfile } from '@/lib/mobile-users';

const ALL = { kinds: ['customer', 'user', 'employee'] as ('customer' | 'user' | 'employee')[] };

// GET /api/mobile/auth/me — current profile (+ permissions for staff apps).
export async function GET(req: Request) {
  return withMobileUser(req, ALL, async (user) => ({ user: await mobileProfile(user) }));
}

const profileBody = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  phone: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
});

// PUT /api/mobile/auth/me — update own name / phone (/ address for customers).
export async function PUT(req: Request) {
  return withMobileUser(req, ALL, async (user) => {
    const data = profileBody.parse(await req.json().catch(() => ({})));
    if (user.kind === 'customer') {
      await prisma.customer.update({
        where: { id: user.id },
        data: { name: data.name, phone: data.phone || null, address: data.address || null },
      });
    } else if (user.kind === 'employee') {
      await prisma.employee.update({ where: { id: user.id }, data: { name: data.name, phone: data.phone || null } });
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { name: data.name } });
    }
    return { user: await mobileProfile({ ...user, name: data.name }) };
  });
}
