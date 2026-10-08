'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { setTopCategories } from '@/lib/actions';
import type { CategoryStat } from '@/lib/dashboard-data';

export function TopCategories({
  categories: TOP_CATEGORIES,
  categoryOptions = [],
  editable = false,
}: {
  categories: CategoryStat[];
  categoryOptions?: string[];
  editable?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // Three editable rows seeded from the current values.
  const [rows, setRows] = useState<{ name: string; percent: number }[]>([]);

  const openEditor = () => {
    const seed = [0, 1, 2].map((i) => ({
      name: TOP_CATEGORIES[i]?.name ?? categoryOptions[i] ?? categoryOptions[0] ?? '',
      percent: TOP_CATEGORIES[i]?.percent ?? 0,
    }));
    setRows(seed);
    setOpen(true);
  };

  const save = (reset = false) => {
    const payload = reset ? null : rows.filter((r) => r.name);
    startTransition(async () => {
      await setTopCategories(payload).catch(() => {});
      router.refresh();
      setOpen(false);
    });
  };

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Top Categories Item</h2>
        {editable && (
          <button
            type="button"
            onClick={openEditor}
            aria-label="Edit top categories"
            className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-accent-soft hover:text-accent"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {TOP_CATEGORIES.map((c) => (
          <div key={c.name}>
            <div className="relative h-24 w-full overflow-hidden rounded-xl">
              <Image src={c.image} alt={c.name} fill sizes="120px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              <span className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold text-white">
                {c.name}
              </span>
            </div>
            <p className="mt-2 text-center font-display text-2xl font-semibold">{c.percent}%</p>
          </div>
        ))}
      </div>

      {editable && (
        <Modal open={open} onClose={() => setOpen(false)} title="Top categories">
          <div className="space-y-4">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-3">
                <select
                  value={row.name}
                  onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)))}
                  className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                >
                  <option value="">— None —</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.percent}
                    onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, percent: Number(e.target.value) } : r)))}
                    className="w-20 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  <span className="text-sm text-fg-muted">%</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <button type="button" onClick={() => save(true)} disabled={pending} className="text-sm font-medium text-fg-muted hover:text-accent">
                Reset to auto
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-bg">Cancel</button>
                <button type="button" onClick={() => save(false)} disabled={pending} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60">
                  {pending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
