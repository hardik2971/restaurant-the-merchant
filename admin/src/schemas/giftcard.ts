import { z } from 'zod';
import { paymentSchema } from './order';

export const COUPON_KINDS = ['GIFT_CARD', 'COUPON'] as const;
export const COUPON_STATUSES = ['PENDING_PAYMENT', 'PAID', 'ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED'] as const;
export const COUPON_PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'] as const;

export type CouponKindValue = (typeof COUPON_KINDS)[number];
export type CouponStatusValue = (typeof COUPON_STATUSES)[number];
export type CouponPaymentStatusValue = (typeof COUPON_PAYMENT_STATUSES)[number];

// Public website purchase intake.
export const giftCardPurchaseSchema = z.object({
  kind: z.enum(COUPON_KINDS).default('GIFT_CARD'),
  amount: z.coerce.number().positive('Choose an amount').max(100000),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().max(500).optional(),
  // Gateway checkout result — verified server-side before the code is issued.
  payment: paymentSchema,
});
export type GiftCardPurchaseInput = z.infer<typeof giftCardPurchaseSchema>;

// Admin edit.
export const giftCardEditSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  kind: z.enum(COUPON_KINDS),
  amount: z.coerce.number().positive('Amount must be positive'),
  status: z.enum(COUPON_STATUSES),
  paymentStatus: z.enum(COUPON_PAYMENT_STATUSES),
  expiryDate: z.string().optional().or(z.literal('')), // "YYYY-MM-DD"
});
export type GiftCardEditInput = z.infer<typeof giftCardEditSchema>;
