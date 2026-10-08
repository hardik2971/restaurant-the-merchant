import crypto from 'crypto';

// Razorpay integration (server side). Order creation + signature verification
// use the Key Secret, which must NEVER reach the browser. The website opens
// Checkout with the public Key ID returned by /api/payment.
const KEY_ID = process.env.RAZORPAY_KEY_ID ?? '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';
// Razorpay test accounts default to INR; override with RAZORPAY_CURRENCY.
const CURRENCY = process.env.RAZORPAY_CURRENCY ?? 'INR';

export const razorpayKeyId = KEY_ID;

export function razorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET);
}

export interface RazorpayOrder {
  id: string;
  amount: number; // in the smallest currency unit (paise)
  currency: string;
}

/** Create a Razorpay order. `amount` is in major units (e.g. 49.99). */
export async function createRazorpayOrder(amount: number, receipt: string): Promise<RazorpayOrder> {
  const amountMinor = Math.round(amount * 100);
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64'),
    },
    body: JSON.stringify({ amount: amountMinor, currency: CURRENCY, receipt }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as RazorpayOrder;
  return { id: data.id, amount: data.amount, currency: data.currency };
}

/** Verify the checkout signature: HMAC_SHA256(order_id|payment_id, secret). */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!KEY_SECRET || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export interface RazorpayPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
}
