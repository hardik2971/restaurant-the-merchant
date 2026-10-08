'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { Plus, Search, Star, Pencil, Trash2, EyeOff, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { MenuItemForm } from '@/components/menu/MenuItemForm';
import { type MenuItem } from '@/lib/menu-data';
import { type MenuCategoryRow } from '@/lib/queries';
import { MENU_CATEGORIES, type MenuItemInput } from '@/schemas/menu';
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  setMenuAvailability,
  setCategoryActive,
} from '@/lib/actions';
import { cn, formatCurrency } from '@/lib/utils';

const FILTERS = ['All', ...MENU_CATEGORIES] as const;

const BLANK: MenuItemInput = {
  name: '',
  description: '',
  price: 0,
  rating: 0,
  tag: '',
  category: 'Main Meals',
  imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=70',
  available: true,
};

export function MenuManager({
  initialItems,
  initialCategories = [],
}: {
  initialItems: MenuItem[];
  initialCategories?: MenuCategoryRow[];
}) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [categories, setCategories] = useState<MenuCategoryRow[]>(initialCategories);
  const [filter, setFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [, startTransition] = useTransition();

  const toggleCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const next = !cat.active;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active: next } : c)));
    startTransition(() => {
      setCategoryActive(id, next).catch(() => {});
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (it) =>
        (filter === 'All' || it.category === filter) &&
        (q === '' || it.name.toLowerCase().includes(q) || it.tag.toLowerCase().includes(q)),
    );
  }, [items, filter, query]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setModalOpen(true);
  };

  const toggleAvailable = (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const next = !item.available;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, available: next } : it)));
    startTransition(() => {
      setMenuAvailability(id, next).catch(() => {});
    });
  };

  const remove = (id: string) => {
    if (confirm('Remove this item from the menu?')) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      startTransition(() => {
        deleteMenuItem(id).catch(() => {});
      });
    }
  };

  const submit = (values: MenuItemInput) => {
    if (editing) {
      setItems((prev) =>
        prev.map((it) => (it.id === editing.id ? { ...it, ...values, tag: values.tag ?? '' } : it)),
      );
      startTransition(() => {
        updateMenuItem(editing.id, values).catch(() => {});
      });
    } else {
      setItems((prev) => [
        { id: `tmp-${Date.now()}`, ...values, tag: values.tag ?? '' },
        ...prev,
      ]);
      startTransition(() => {
        createMenuItem(values).catch(() => {});
      });
    }
    setModalOpen(false);
  };

  const formDefaults: MenuItemInput = editing
    ? {
        name: editing.name,
        description: editing.description,
        price: editing.price,
        rating: editing.rating,
        tag: editing.tag,
        category: editing.category,
        imageUrl: editing.imageUrl,
        available: editing.available,
      }
    : BLANK;

  return (
    <div className="space-y-5">
      {/* Category visibility — disabled categories are hidden from the public site */}
      {categories.length > 0 && (
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Categories</p>
            <p className="text-xs text-fg-muted">Disabled categories are hidden from the website menu</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                title={c.active ? 'Click to hide from website' : 'Click to show on website'}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors',
                  c.active
                    ? 'border-success/40 bg-success-soft text-success'
                    : 'border-border bg-bg text-fg-muted line-through',
                )}
              >
                {c.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {c.name}
                <span className="not-italic no-underline opacity-70">({c.itemCount})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
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
              placeholder="Search dishes…"
              className="w-48 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Rating</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.id} className="border-b border-border last:border-0 hover:bg-bg/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                      <Image src={it.imageUrl} alt={it.name} fill sizes="44px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{it.name}</p>
                      <p className="truncate text-xs text-fg-muted">{it.tag}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-fg-muted">{it.category}</td>
                <td className="px-5 py-3 font-medium">{formatCurrency(it.price)}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                    {it.rating}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => toggleAvailable(it.id)}
                    className={cn(
                      'inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors',
                      it.available ? 'bg-success' : 'bg-border',
                    )}
                    aria-label={it.available ? 'Available' : 'Unavailable'}
                  >
                    <span
                      className={cn(
                        'h-4 w-4 rounded-full bg-white shadow transition-transform',
                        it.available && 'translate-x-4',
                      )}
                    />
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(it)}
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
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-fg-muted">
                  No dishes match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-fg-muted">
        Showing {filtered.length} of {items.length} items. Changes are in-session until the MySQL
        data layer is connected.
      </p>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit menu item' : 'Add menu item'}
      >
        <MenuItemForm
          defaultValues={formDefaults}
          onSubmit={submit}
          onCancel={() => setModalOpen(false)}
          submitLabel={editing ? 'Save changes' : 'Add item'}
        />
      </Modal>
    </div>
  );
}
