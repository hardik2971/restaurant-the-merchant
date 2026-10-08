import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { HttpError, withMobileUser } from '@/lib/mobile-auth';
import { passwordSchema } from '@/schemas/settings';

// POST /api/mobile/auth/password — change own password (any of the 3 apps).
export async function POST(req: Request) {
  return withMobileUser(req, { kinds: ['customer', 'user', 'employee'] }, async (user) => {
    const { currentPassword, newPassword } = passwordSchema.parse(await req.json().catch(() => ({})));
    const hash = await bcrypt.hash(newPassword, 10);
    const current =
      user.kind === 'customer'
        ? (await prisma.customer.findUnique({ where: { id: user.id } }))?.password
        : user.kind === 'employee'
          ? (await prisma.employee.findUnique({ where: { id: user.id } }))?.password
          : (await prisma.user.findUnique({ where: { id: user.id } }))?.password;
    if (!current || !(await bcrypt.compare(currentPassword, current))) {
      throw new HttpError(400, 'Current password is incorrect');
    }
    if (user.kind === 'customer') await prisma.customer.update({ where: { id: user.id }, data: { password: hash } });
    else if (user.kind === 'employee') await prisma.employee.update({ where: { id: user.id }, data: { password: hash } });
    else await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    return { ok: true };
  });
}
