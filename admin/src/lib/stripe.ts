// Stripe integration (server side). Uses the REST API directly (no SDK) with the
// Secret Key, which must NEVER reach the browser. The website confirms the
// PaymentIntent client-side with the publishable key + client secret; the server
// then verifies the intent reached `succeeded` before fulfilling.
const SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';
const PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY ?? '';
// Stripe charges in the smallest unit; default USD to match storefront pricing.
const CURRENCY = (process.env.STRIPE_CURRENCY ?? 'usd').toLowerCase();

export const stripePublishableKey = PUBLISHABLE_KEY;

export function stripeConfigured(): boolean {
  return Boolean(SECRET_KEY && PUBLISHABLE_KEY);
}

export interface StripeIntent {
  paymentIntentId: string;
  clientSecret: string;
}

/** Create a PaymentIntent. `amount` is in major units (e.g. 49.99). */
export async function createPaymentIntent(amount: number, description: string): Promise<StripeIntent> {
  const body = new URLSearchParams();
  body.set('amount', String(Math.round(amount * 100)));
  body.set('currency', CURRENCY);
  body.set('description', description);
  body.set('automatic_payment_methods[enabled]', 'true');

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Stripe intent failed (${res.status}): ${await res.text()}`);
  }
  const pi = (await res.json()) as { id: string; client_secret: string };
  return { paymentIntentId: pi.id, clientSecret: pi.client_secret };
}

/** Verify a PaymentIntent reached `succeeded` (retrieved fresh from Stripe). */
export async function verifyStripePayment(paymentIntentId: string): Promise<boolean> {
  if (!SECRET_KEY || !paymentIntentId) return false;
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`, {
    headers: { Authorization: `Bearer ${SECRET_KEY}` },
  });
  if (!res.ok) return false;
  const pi = (await res.json()) as { status: string };
  return pi.status === 'succeeded';
}
