'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, CUSTOMER_STATUSES, type CustomerInput } from '@/schemas/customer';

const field =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent';
const label = 'mb-1.5 block text-sm font-medium';

export function CustomerForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaultValues: CustomerInput;
  onSubmit: (values: CustomerInput) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={label}>Name</label>
        <input {...register('name')} className={field} placeholder="Jane Doe" />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Email</label>
          <input {...register('email')} className={field} placeholder="jane@email.com" />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <label className={label}>Phone</label>
          <input {...register('phone')} className={field} placeholder="+1 555 000 0000" />
        </div>
      </div>

      <div>
        <label className={label}>Address</label>
        <input {...register('address')} className={field} placeholder="Street, City, State" />
      </div>

      <div>
        <label className={label}>Status</label>
        <select {...register('status')} className={`${field} appearance-none`}>
          {CUSTOMER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'ACTIVE' ? 'Active' : 'Inactive'}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-bg"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
