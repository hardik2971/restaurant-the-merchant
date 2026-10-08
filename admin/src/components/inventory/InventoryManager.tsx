'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, Search, Minus, Pencil, Trash2, Package, AlertTriangle, XCircle, DollarSign } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { InventoryForm } from '@/components/inventory/InventoryForm';
import { stockStatus, type InventoryItem } from '@/lib/inventory-data';
import { INVENTORY_CATEGORIES, type InventoryItemInput } from '@/schemas/inventory';
import {
  createInventoryItem,
  updateInventoryItem,
  adjustInventory,
  deleteInventoryItem,
} from '@/lib/actions';
import { cn, formatCurrency } from '@/lib/utils';

const FILTERS = ['All', ...INVENTORY_CATEGORIES] as const;

const STATUS_META = {
  IN_STOCK: { label: 'In Stock', cls: 'bg-success-soft text-success' },
  LOW: { label: 'Low Stock', cls: 'bg-warn-soft text-warn' },
  OUT: { label: 'Out of Stock', cls: 'bg-danger-soft text-danger' },
} as const;

const BLANK: InventoryItemInput = {
  name: '',
  category: 'Dry Goods',
  unit: 'kg',
  quantity: 0,
  reorderLevel: 0,
  costPerUnit: 0,
  supplier: '',
};

export function InventoryManager({ initialItems }: { initialItems: InventoryItem[] }) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [filter, setFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (it) =>
        (filter === 'All' || it.category === filter) &&
        (q === '' || it.name.toLowerCase().includes(q) || it.supplier.toLowerCase().includes(q)),
    );
  }, [items, filter, query]);

  const stats = useMemo(() => {
    const low = items.filter((i) => stockStatus(i) === 'LOW').length;
    const out = items.filter((i) => stockStatus(i) === 'OUT').length;
    const value = items.reduce((s, i) => s + i.quantity * i.costPerUnit, 0);
    return { total: items.length, low, out, value };
  }, [items]);

  const adjust = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it)),
    );
    startTransition(() => {
      adjustInventory(id, delta).catch(() => {});
    });
  };

  const remove = (id: string) => {
    if (confirm('Remove this inventory item?')) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      startTransition(() => {
        deleteInventoryItem(id).catch(() => {});
      });
    }
  };

  const submit = (values: InventoryItemInput) => {
    if (editing) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editing.id ? { ...it, ...values, supplier: values.supplier ?? '' } : it,
        ),
      );
      startTransition(() => {
        updateInventoryItem(editing.id, values).catch(() => {});
      });
    } else {
      setItems((prev) => [{ id: `tmp-${Date.now()}`, ...values, supplier: values.supplier ?? '' }, ...prev]);
      startTransition(() => {
        createInventoryItem(values).catch(() => {});
      });
    }
    setModalOpen(false);
  };

  const STAT_CARDS = [
    { label: 'Total Items', value: String(stats.total), icon: Package },
    { label: 'Low Stock', value: String(stats.low), icon: AlertTriangle },
    { label: 'Out of Stock', value: String(stats.out), icon: XCircle },
    { label: 'Stock Value', value: formatCurrency(stats.value), icon: DollarSign },
  ];

  const formDefaults: InventoryItemInput = editing
    ? {
        name: editing.name,
        category: editing.category,
        unit: editing.unit,
        quantity: editing.quantity,
        reorderLevel: editing.reorderLevel,
        costPerUnit: editing.costPerUnit,
        supplier: editing.supplier,
      }
    : BLANK;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-fg-muted">{s.label}</p>
              <p className="font-display text-xl font-semibold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-accent text-white'
                  : 'border border-border bg-surface text-fg-muted hover:border-accent/40',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items…"
              className="w-48 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Supplier</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => {
              const status = stockStatus(it);
              const meta = STATUS_META[status];
              return (
                <tr
                  key={it.id}
                  className={cn(
                    'border-b border-border last:border-0 hover:bg-bg/60',
                    status === 'OUT' && 'bg-danger-soft/30',
                  )}
                >
                  <td className="px-5 py-3 font-medium">{it.name}</td>
                  <td className="px-5 py-3 text-fg-muted">{it.category}</td>
                  <td className="px-5 py-3 text-fg-muted">{it.supplier || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjust(it.id, -1)}
                        aria-label="Decrease"
                        className="grid h-6 w-6 place-items-center rounded-md border border-border text-fg-muted hover:border-accent/40"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-16 text-center font-medium tabular-nums">
                        {it.quantity} {it.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjust(it.id, 1)}
                        aria-label="Increase"
                        className="grid h-6 w-6 place-items-center rounded-md border border-border text-fg-muted hover:border-accent/40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="mt-0.5 block text-xs text-fg-muted">reorder at {it.reorderLevel}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', meta.cls)}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(it);
                          setModalOpen(true);
                        }}
                        aria-label="Edit"
                        className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-accent-soft hover:text-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        aria-label="Delete"
                        className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-fg-muted">
                  No inventory items match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit inventory item' : 'Add inventory item'}
      >
        <InventoryForm
          defaultValues={formDefaults}
          onSubmit={submit}
          onCancel={() => setModalOpen(false)}
          submitLabel={editing ? 'Save changes' : 'Add item'}
        />
      </Modal>
    </div>
  );
}
