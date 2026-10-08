import { z } from 'zod';

export const TABLE_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type TableStatusValue = (typeof TABLE_STATUSES)[number];

export const tableSchema = z.object({
  number: z.string().min(1, 'Table number is required'),
  name: z.string().optional().or(z.literal('')),
  status: z.enum(TABLE_STATUSES).default('ACTIVE'),
});

export type TableInput = z.infer<typeof tableSchema>;
