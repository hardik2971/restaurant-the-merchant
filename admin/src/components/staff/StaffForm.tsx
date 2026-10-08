'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { staffSchema, STAFF_ROLES, type StaffInput } from '@/schemas/staff';

const field =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent';
const label = 'mb-1.5 block text-sm font-medium';

export function StaffForm({
  defaultValues,
  isEdit,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaultValues: StaffInput;
  isEdit: boolean;
  onSubmit: (values: StaffInput) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Role</label>
          <select {...register('role')} className={`${field} appearance-none`}>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>
            Password{' '}
            {isEdit && <span className="font-normal text-fg-muted">(leave blank to keep)</span>}
          </label>
          <input
            type="password"
            {...register('password')}
            className={field}
            placeholder={isEdit ? '••••••••' : 'Min 6 characters'}
            autoComplete="new-password"
          />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('active')} className="h-4 w-4 accent-[var(--color-accent)]" />
        Active (can be deactivated to disable the account)
      </label>

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
