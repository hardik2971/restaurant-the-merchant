'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  inventoryItemSchema,
  INVENTORY_CATEGORIES,
  type InventoryItemInput,
} from '@/schemas/inventory';

const field =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent';
const label = 'mb-1.5 block text-sm font-medium';

export function InventoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaultValues: InventoryItemInput;
  onSubmit: (values: InventoryItemInput) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InventoryItemInput>({ resolver: zodResolver(inventoryItemSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={label}>Name</label>
        <input {...register('name')} className={field} placeholder="Sea Bass (whole)" />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Category</label>
          <select {...register('category')} className={`${field} appearance-none`}>
            {INVENTORY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Unit</label>
          <input {...register('unit')} className={field} placeholder="kg, L, units" />
          {errors.unit && <p className="mt-1 text-xs text-danger">{errors.unit.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={label}>Quantity</label>
          <input type="number" step="0.01" {...register('quantity')} className={field} />
        </div>
        <div>
          <label className={label}>Reorder at</label>
          <input type="number" step="0.01" {...register('reorderLevel')} className={field} />
        </div>
        <div>
          <label className={label}>Cost / unit</label>
          <input type="number" step="0.01" {...register('costPerUnit')} className={field} />
        </div>
      </div>

      <div>
        <label className={label}>Supplier</label>
        <input {...register('supplier')} className={field} placeholder="Boston Seafood Co." />
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
