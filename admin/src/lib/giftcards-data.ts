// Gift cards & coupons (TASK 6). DB-live replaces this with Prisma queries;
// shapes mirror the GiftCard model in schema.prisma.

export type CouponKind = 'GIFT_CARD' | 'COUPON';
export type CouponStatus = 'PENDING_PAYMENT' | 'PAID' | 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
export type CouponPaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface GiftCardRecord {
  id: string;
  code: string;
  kind: CouponKind;
  customerName: string;
  customerEmail: string;
  amount: number;
  message?: string;
  expiryDate?: string;
  paymentStatus: CouponPaymentStatus;
  status: CouponStatus;
  paymentProvider?: string; // razorpay | stripe
  razorpayPaymentId?: string; // gateway payment reference
  createdAt: string;
}

export const COUPON_KIND_LABELS: Record<CouponKind, string> = {
  GIFT_CARD: 'Gift Card',
  COUPON: 'Coupon',
};

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid',
  ACTIVE: 'Active',
  REDEEMED: 'Redeemed',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

export const PAYMENT_STATUS_LABELS: Record<CouponPaymentStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
};

export const GIFT_CARDS: GiftCardRecord[] = [
  { id: 'g1', code: 'GIFT-8F3A21', kind: 'GIFT_CARD', customerName: 'Olivia Bennett', customerEmail: 'olivia@email.com', amount: 100, paymentStatus: 'PAID', status: 'ACTIVE', createdAt: '2026-06-20T12:00:00' },
  { id: 'g2', code: 'GIFT-22B9C7', kind: 'GIFT_CARD', customerName: 'Liam Carter', customerEmail: 'liam@email.com', amount: 250, paymentStatus: 'PAID', status: 'REDEEMED', createdAt: '2026-06-18T15:30:00' },
  { id: 'g3', code: 'COUPON-5D1E90', kind: 'COUPON', customerName: 'Noah Patel', customerEmail: 'noah@email.com', amount: 50, expiryDate: '2026-12-31', paymentStatus: 'PAID', status: 'ACTIVE', createdAt: '2026-06-22T09:10:00' },
  { id: 'g4', code: 'GIFT-7C0A44', kind: 'GIFT_CARD', customerName: 'Emma Wilson', customerEmail: 'emma@email.com', amount: 500, paymentStatus: 'PENDING', status: 'PENDING_PAYMENT', createdAt: '2026-06-25T18:00:00' },
  { id: 'g5', code: 'COUPON-9A4F12', kind: 'COUPON', customerName: 'Sophia Nguyen', customerEmail: 'sophia@email.com', amount: 25, expiryDate: '2026-03-31', paymentStatus: 'PAID', status: 'EXPIRED', createdAt: '2026-02-10T11:00:00' },
];
