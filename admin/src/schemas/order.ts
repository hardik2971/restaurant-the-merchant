import { z } from 'zod';

// Online ordering intake. The public website POSTs one of these shapes to
// /api/orders:
//  - TAKE_AWAY: pickup order with scheduling (TASK 1) → persisted as PICKUP.
//  - DINE_IN:   table QR order (TASK 5) → persisted as DINE_IN with a table.
// Business-hours / cutoff validation for scheduled pickups lives in the route.

export const orderItemInputSchema = z.object({
  menuItemId: z.string().min(1),
  // Item name accompanies the id as a fallback match (content-seeded ids).
  // Price always comes from the live menu row, never the client.
  name: z.string().optional(),
  qty: z.coerce.number().int().min(1).max(50),
});

// Gateway checkout result (verified server-side before the order is accepted).
// Razorpay → signed order/payment; Stripe → a succeeded PaymentIntent id.
export const paymentSchema = z
  .union([
    z.object({ provider: z.literal('razorpay'), orderId: z.string(), paymentId: z.string(), signature: z.string() }),
    z.object({ provider: z.literal('stripe'), paymentIntentId: z.string() }),
    z.object({ provider: z.literal('paypal'), orderId: z.string() }),
  ])
  .optional();

const takeAwayOrderSchema = z.object({
  type: z.literal('TAKE_AWAY'),
  scheduleType: z.enum(['NOW', 'LATER']),
  scheduleDate: z.string().optional(), // "YYYY-MM-DD" — required when LATER
  scheduleTime: z.string().optional(), // "HH:mm"      — required when LATER
  items: z.array(orderItemInputSchema).min(1, 'Add at least one item'),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  notes: z.string().max(500).optional(),
  payment: paymentSchema,
});

const dineInOrderSchema = z.object({
  type: z.literal('DINE_IN'),
  tableCode: z.string().min(1), // resolved from the scanned QR
  items: z.array(orderItemInputSchema).min(1, 'Add at least one item'),
  name: z.string().min(1), // for the kitchen ticket
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
  payment: paymentSchema,
});

export const onlineOrderSchema = z.discriminatedUnion('type', [takeAwayOrderSchema, dineInOrderSchema]);

export type OnlineOrderInput = z.infer<typeof onlineOrderSchema>;
