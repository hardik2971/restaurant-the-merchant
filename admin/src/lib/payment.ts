// Unified payment gate across providers (Razorpay + Stripe). Routes call
// `paymentAccepted()` before fulfilling an order or issuing a gift card.
import { razorpayConfigured, verifyRazorpaySignature } from './razorpay';
import { stripeConfigured, verifyStripePayment } from './stripe';
import { paypalConfigured, verifyPayPalPayment } from './paypal';

export type PaymentInput =
  | { provider: 'razorpay'; orderId: string; paymentId: string; signature: string }
  | { provider: 'stripe'; paymentIntentId: string }
  | { provider: 'paypal'; orderId: string };

export interface PaymentResult {
  ok: boolean;
  reason?: string;
  provider?: 'razorpay' | 'stripe' | 'paypal';
  ref?: string; // gateway payment reference (payment id / intent id / order id)
}

export function paymentConfigured(): boolean {
  return razorpayConfigured() || stripeConfigured() || paypalConfigured();
}

/** The reference id we persist for a verified payment. */
export function paymentRef(payment?: PaymentInput | null): string | null {
  if (!payment) return null;
  if (payment.provider === 'razorpay') return payment.paymentId;
  if (payment.provider === 'stripe') return payment.paymentIntentId;
  return payment.orderId; // paypal
}

/**
 * Gate a paid action.
 * - No gateway configured → allowed (dev/simulated fallback).
 * - Configured → a valid, provider-verified payment is required.
 */
export async function paymentAccepted(payment?: PaymentInput | null): Promise<PaymentResult> {
  if (!paymentConfigured()) return { ok: true };
  if (!payment) return { ok: false, reason: 'Payment required' };

  if (payment.provider === 'razorpay') {
    const ok = verifyRazorpaySignature(payment.orderId, payment.paymentId, payment.signature);
    return ok
      ? { ok: true, provider: 'razorpay', ref: payment.paymentId }
      : { ok: false, reason: 'Payment verification failed' };
  }

  if (payment.provider === 'stripe') {
    const ok = await verifyStripePayment(payment.paymentIntentId);
    return ok
      ? { ok: true, provider: 'stripe', ref: payment.paymentIntentId }
      : { ok: false, reason: 'Payment verification failed' };
  }

  if (payment.provider === 'paypal') {
    const ok = await verifyPayPalPayment(payment.orderId);
    return ok
      ? { ok: true, provider: 'paypal', ref: payment.orderId }
      : { ok: false, reason: 'Payment verification failed' };
  }

  return { ok: false, reason: 'Unknown payment provider' };
}
