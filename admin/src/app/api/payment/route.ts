import { NextResponse } from 'next/server';
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from '@/lib/razorpay';
import { createPaymentIntent, stripeConfigured, stripePublishableKey } from '@/lib/stripe';
import { createPayPalOrder, paypalClientId, paypalConfigured, paypalCurrency } from '@/lib/paypal';

// GET /api/payment — which gateways are configured (drives the storefront chooser).
export async function GET() {
  return NextResponse.json(
    { razorpay: razorpayConfigured(), stripe: stripeConfigured(), paypal: paypalConfigured() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

// POST /api/payment — start a payment with the chosen provider.
// Razorpay → returns key id + order id (browser opens Checkout).
// Stripe   → returns publishable key + client secret (browser confirms the intent).
// PayPal   → returns client id + order id (browser approves via PayPal Buttons).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const provider =
    body?.provider === 'stripe' ? 'stripe' : body?.provider === 'paypal' ? 'paypal' : 'razorpay';
  const amount = Number(body?.amount);
  const description = typeof body?.description === 'string' ? body.description : 'Order payment';

  if (!(amount > 0)) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  try {
    if (provider === 'stripe') {
      if (!stripeConfigured()) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
      }
      const intent = await createPaymentIntent(amount, description);
      return NextResponse.json(
        { provider: 'stripe', publishableKey: stripePublishableKey, clientSecret: intent.clientSecret },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (provider === 'paypal') {
      if (!paypalConfigured()) {
        return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 });
      }
      const order = await createPayPalOrder(amount, description);
      return NextResponse.json(
        { provider: 'paypal', clientId: paypalClientId, orderId: order.orderId, currency: paypalCurrency },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (!razorpayConfigured()) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 503 });
    }
    const order = await createRazorpayOrder(amount, `rcpt_${Date.now()}`);
    return NextResponse.json(
      { provider: 'razorpay', keyId: razorpayKeyId, orderId: order.id, amount: order.amount, currency: order.currency },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('POST /api/payment failed', err);
    return NextResponse.json({ error: 'Could not start payment' }, { status: 502 });
  }
}
