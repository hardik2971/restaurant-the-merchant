'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Clock, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { setTrendingItem } from '@/lib/actions';
import { formatCurrency } from '@/lib/utils';

interface Trending {
  name: string;
  subtitle: string;
  rating: number;
  orders: number;
  price: number;
  image: string;
}

export function TrendingItem({
  trending: TRENDING,
  menuOptions = [],
  currentItemId = null,
  editable = false,
}: {
  trending: Trending;
  menuOptions?: { id: string; name: string }[];
  currentItemId?: string | null;
  editable?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string>(currentItemId ?? 'AUTO');
  const [pending, startTransition] = useTransition();

  const save = () => {
    const itemId = choice === 'AUTO' ? null : choice;
    startTransition(async () => {
      await setTrendingItem(itemId).catch(() => {});
      router.refresh();
      setOpen(false);
    });
  };

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Trending Menu Item</h2>
        {editable && (
          <button
            type="button"
            onClick={() => { setChoice(currentItemId ?? 'AUTO'); setOpen(true); }}
            aria-label="Edit trending item"
            className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-accent-soft hover:text-accent"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative mt-4 h-44 w-full overflow-hidden rounded-xl">
        <Image
          src={TRENDING.image}
          alt={TRENDING.name}
          fill
          sizes="(max-width: 1280px) 100vw, 320px"
          className="object-cover"
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold">{TRENDING.name}</h3>
          <p className="text-xs text-fg-muted">{TRENDING.subtitle}</p>
        </div>
        <span className="font-display text-xl font-semibold text-accent">
          {formatCurrency(TRENDING.price)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-fg-muted">
        <span className="inline-flex items-center gap-1">
          <Star className="h-4 w-4 fill-gold text-gold" />
          {TRENDING.rating}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {TRENDING.orders}
        </span>
      </div>

      {editable && (
        <Modal open={open} onClose={() => setOpen(false)} title="Trending menu item">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Featured item</label>
              <select
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="AUTO">Auto — most ordered</option>
                {menuOptions.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-fg-muted">Choose a dish to feature, or Auto to use the best-seller.</p>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-bg">Cancel</button>
              <button type="button" onClick={save} disabled={pending} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60">
                {pending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
