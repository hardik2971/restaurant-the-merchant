'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, Loader2 } from 'lucide-react';
import { menuItemSchema, MENU_CATEGORIES, type MenuItemInput } from '@/schemas/menu';

const field =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent';
const label = 'mb-1.5 block text-sm font-medium';

export function MenuItemForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaultValues: MenuItemInput;
  onSubmit: (values: MenuItemInput) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MenuItemInput>({
    resolver: zodResolver(menuItemSchema),
    defaultValues,
  });

  const imageUrl = watch('imageUrl');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setValue('imageUrl', data.url, { shouldValidate: true, shouldDirty: true });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={label}>Name</label>
        <input {...register('name')} className={field} placeholder="Truffle Risotto" />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea
          {...register('description')}
          rows={2}
          className={`${field} resize-none`}
          placeholder="Short description of the dish…"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Category</label>
          <select {...register('category')} className={`${field} appearance-none`}>
            {MENU_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Tag</label>
          <input {...register('tag')} className={field} placeholder="Popular" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Price ($)</label>
          <input type="number" step="0.01" {...register('price')} className={field} placeholder="26" />
          {errors.price && <p className="mt-1 text-xs text-danger">{errors.price.message}</p>}
        </div>
        <div>
          <label className={label}>Rating (0–5)</label>
          <input type="number" step="0.1" {...register('rating')} className={field} placeholder="4.8" />
          {errors.rating && <p className="mt-1 text-xs text-danger">{errors.rating.message}</p>}
        </div>
      </div>

      <div>
        <label className={label}>Image</label>
        <div className="flex gap-3">
          {/* Live preview of the current image (URL or uploaded) */}
          <div className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-lg border border-border bg-bg">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] text-fg-muted">No image</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex gap-2">
              <input {...register('imageUrl')} className={field} placeholder="https://… or upload →" />
              <label
                className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-bg ${
                  uploading ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading…' : 'Upload'}
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
            </div>
            <p className="mt-1 text-xs text-fg-muted">Paste an image URL or upload a file (max 5MB).</p>
            {uploadError && <p className="mt-1 text-xs text-danger">{uploadError}</p>}
            {errors.imageUrl && <p className="mt-1 text-xs text-danger">{errors.imageUrl.message}</p>}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('available')} className="h-4 w-4 accent-[var(--color-accent)]" />
        Available on menu
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
