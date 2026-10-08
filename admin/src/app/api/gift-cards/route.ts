import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { giftCardPurchaseSchema } from '@/schemas/giftcard';
import { sendMail } from '@/lib/mail';
import { giftCardConfirmationEmail } from '@/lib/email-templates';
import { paymentAccepted, paymentRef } from '@/lib/payment';

function genCode(kind: 'GIFT_CARD' | 'COUPON'): string {
  const prefix = kind === 'COUPON' ? 'COUPON' : 'GIFT';
  const body = Array.from({ length: 6 }, () => '0123456789ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 33)]).join('');
  return `${prefix}-${body}`;
}

// POST /api/gift-cards — the public website's gift card / coupon purchase flow.
// Simulates a successful payment, generates a unique code, stores the purchase
// (PAID + ACTIVE), and emails a branded confirmation.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = giftCardPurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid purchase', issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;
  const email = data.email || '';

  // Payment gate (enforced once a gateway is configured) — Razorpay or Stripe.
  const pay = await paymentAccepted(data.payment);
  if (!pay.ok) {
    return NextResponse.json({ error: pay.reason ?? 'Payment required' }, { status: 402 });
  }

  try {
    // Coupons expire in a year; gift cards never expire.
    const expiryDate = data.kind === 'COUPON' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;

    // Link/create a customer when we have an email.
    const customerId = email
      ? (
          await prisma.customer.upsert({
            where: { email },
            update: { name: data.name },
            create: { name: data.name, email },
          })
        ).id
      : null;

    // Generate a unique code (retry on the rare collision).
    let created = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const code = genCode(data.kind);
      try {
        created = await prisma.giftCard.create({
          data: {
            code,
            kind: data.kind,
            customerName: data.name,
            customerEmail: email,
            customerId,
            amount: data.amount,
            message: data.message,
            expiryDate,
            paymentStatus: 'PAID',
            paymentProvider: data.payment?.provider ?? null,
            razorpayPaymentId: paymentRef(data.payment),
            status: 'ACTIVE',
          },
        });
      } catch {
        // unique-constraint collision on code → retry
      }
    }
    if (!created) {
      return NextResponse.json({ error: 'Could not generate a code, please retry' }, { status: 503 });
    }

    if (email) {
      try {
        const mail = giftCardConfirmationEmail({
          code: created.code,
          kind: data.kind,
          amount: data.amount,
          name: data.name,
          message: data.message,
          expiryLabel: expiryDate
            ? expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : undefined,
        });
        await sendMail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
      } catch (mailErr) {
        console.error('Gift card email failed (purchase still saved):', mailErr);
      }
    }

    return NextResponse.json(
      { code: created.code, id: created.id, amount: data.amount, kind: data.kind },
      { status: 201 },
    );
  } catch (err) {
    console.error('POST /api/gift-cards failed', err);
    return NextResponse.json({ error: 'Could not complete purchase' }, { status: 503 });
  }
}
