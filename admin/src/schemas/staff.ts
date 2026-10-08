import { z } from 'zod';

// TASK 3 staff roles.
export const STAFF_ROLES = ['Super Admin', 'Manager', 'Cashier', 'Kitchen Staff', 'Waiter'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const staffSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional().or(z.literal('')),
  // Optional — empty on edit keeps the existing password; if provided, min 6.
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
  role: z.enum(STAFF_ROLES),
  active: z.boolean().default(true),
});

export type StaffInput = z.infer<typeof staffSchema>;
