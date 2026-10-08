'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  giftCardEditSchema,
  COUPON_KINDS,
  COUPON_STATUSES,
  COUPON_PAYMENT_STATUSES,
  type GiftCardEditInput,
} from '@/schemas/giftcard';
import { COUPON_KIND_LABELS, COUPON_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/giftcards-data';

const field =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent';
const label = 'mb-1.5 block text-sm font-medium';

export function GiftCardForm({
  defaultValues,
  onSubmit,
  onCancel,
}: {
  defaultValues: GiftCardEditInput;
  onSubmit: (values: GiftCardEditInput) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GiftCardEditInput>({ resolver: zodResolver(giftCardEditSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Customer name</label>
          <input {...register('customerName')} className={field} />
          {errors.customerName && <p className="mt-1 text-xs text-danger">{errors.customerName.message}</p>}
        </div>
        <div>
          <label className={label}>Customer email</label>
          <input {...register('customerEmail')} className={field} />
          {errors.customerEmail && <p className="mt-1 text-xs text-danger">{errors.customerEmail.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Type</label>
          <select {...register('kind')} className={`${field} appearance-none`}>
            {COUPON_KINDS.map((k) => (
              <option key={k} value={k}>{COUPON_KIND_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Amount ($)</label>
          <input type="number" step="0.01" {...register('amount')} className={field} />
          {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Status</label>
          <select {...register('status')} className={`${field} appearance-none`}>
            {COUPON_STATUSES.map((s) => (
              <option key={s} value={s}>{COUPON_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Payment</label>
          <select {...register('paymentStatus')} className={`${field} appearance-none`}>
            {COUPON_PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Expiry date <span className="font-normal text-fg-muted">(optional)</span></label>
        <input type="date" {...register('expiryDate')} className={field} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-bg">
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep">
          Save changes
        </button>
      </div>
    </form>
  );
}
