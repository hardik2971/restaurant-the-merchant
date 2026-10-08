'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tableSchema, TABLE_STATUSES, type TableInput } from '@/schemas/table';

const field =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent';
const label = 'mb-1.5 block text-sm font-medium';

export function TableForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaultValues: TableInput;
  onSubmit: (values: TableInput) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TableInput>({
    resolver: zodResolver(tableSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Table number</label>
          <input {...register('number')} className={field} placeholder="12" />
          {errors.number && <p className="mt-1 text-xs text-danger">{errors.number.message}</p>}
        </div>
        <div>
          <label className={label}>Table name</label>
          <input {...register('name')} className={field} placeholder="Window / Patio" />
        </div>
      </div>

      <div>
        <label className={label}>Status</label>
        <select {...register('status')} className={`${field} appearance-none`}>
          {TABLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'ACTIVE' ? 'Active' : 'Inactive'}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-fg-muted">Inactive tables stop accepting QR orders.</p>
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
