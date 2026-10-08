import { z } from 'zod';

// Mirrors the public site's ReservationFlow forms (TableForm / PrivateForm).
// Used by the admin API route and, once wired, by the website POST.

export const tableReservationSchema = z.object({
  kind: z.literal('TABLE'),
  date: z.string().min(1),
  time: z.string().min(1),
  guests: z.coerce.number().int().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  occasion: z.string().optional(),
  requests: z.string().optional(),
});

export const privateEventSchema = z.object({
  kind: z.literal('PRIVATE_EVENT'),
  eventType: z.string().min(1),
  date: z.string().min(1),
  guestRange: z.string().min(1),
  space: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  company: z.string().optional(),
  message: z.string().optional(),
});

export const reservationSchema = z.discriminatedUnion('kind', [
  tableReservationSchema,
  privateEventSchema,
]);

export type ReservationInput = z.infer<typeof reservationSchema>;
