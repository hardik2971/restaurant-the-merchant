import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(2, 'Restaurant name is required'),
  currency: z.string().min(1),
  timezone: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type PasswordInput = z.infer<typeof passwordSchema>;
