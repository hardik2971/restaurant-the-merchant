import { NextResponse } from 'next/server';
import { capturePayPalOrder, paypalConfigured } from '@/lib/paypal';

// POST /api/payment/capture — capture an approved PayPal order (called from the
// storefront's Buttons onApprove). The order is then verified again server-side
// at fulfillment. Only PayPal needs an explicit capture step.
export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }
  try {
    const result = await capturePayPalOrder(orderId);
    return NextResponse.json({ status: result.status }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('POST /api/payment/capture failed', err);
    return NextResponse.json({ error: 'Could not capture payment' }, { status: 502 });
  }
}
