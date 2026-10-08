import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { errorResponse, signMobileToken } from '@/lib/mobile-auth';
import { customerSession, mobileProfile } from '@/lib/mobile-users';

const registerBody = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z.string().trim().min(5, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// POST /api/mobile/auth/register — Customer app sign-up. A guest who already
// ordered/booked on the website (Customer row without a password) claims that
// record, so their history shows up in the app.
export async function POST(req: Request) {
  try {
    const data = registerBody.parse(await req.json().catch(() => ({})));
    const existing = await prisma.customer.findUnique({ where: { email: data.email } });
    if (existing?.password) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 });
    }
    const password = await bcrypt.hash(data.password, 10);
    const c = existing
      ? await prisma.customer.update({
          where: { id: existing.id },
          data: { name: data.name, phone: data.phone, password },
        })
      : await prisma.customer.create({
          data: { name: data.name, email: data.email, phone: data.phone, password },
        });
    const user = customerSession(c);
    return NextResponse.json({ token: signMobileToken(user), user: await mobileProfile(user) }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
