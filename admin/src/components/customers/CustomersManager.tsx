'use client';

import { useMemo, useState, useTransition } from 'react';
import { Search, Users, DollarSign, Repeat, TrendingUp, Mail, Phone, MapPin, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { createCustomer, updateCustomer, deleteCustomer } from '@/lib/actions';
import { type CustomerInput } from '@/schemas/customer';
import { visits, type Customer, type CustomerStatus } from '@/lib/customers-data';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const AVATAR_COLORS = ['bg-accent', 'bg-[#7c8467]', 'bg-info', 'bg-gold', 'bg-[#9a6cf1]'];
const STATUS_FILTERS: (CustomerStatus | 'ALL')[] = ['ALL', 'ACTIVE', 'INACTIVE'];

function Avatar({ name, i, size = 'sm' }: { name: string; i: number; size?: 'sm' | 'lg' }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-semibold text-white',
        size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs',
        AVATAR_COLORS[i % AVATAR_COLORS.length],
      )}
    >
      {initials}
    </span>
  );
}

function StatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold',
        status === 'ACTIVE' ? 'bg-success-soft text-success' : 'bg-bg text-fg-muted',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status === 'ACTIVE' ? 'Active' : 'Inactive'}
    </span>
  );
}

const BLANK: CustomerInput = { name: '', email: '', phone: '', address: '', status: 'ACTIVE' };

export function CustomersManager({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'ALL'>('ALL');
  const [view, setView] = useState<Customer | null>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter(
      (c) =>
        (statusFilter === 'ALL' || c.status === statusFilter) &&
        (q === '' ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone ?? '').toLowerCase().includes(q)),
    );
  }, [query, statusFilter, customers]);

  const stats = useMemo(() => {
    const lifetime = customers.reduce((s, c) => s + c.totalSpend, 0);
    const repeat = customers.filter((c) => visits(c) > 1).length;
    const avg = customers.length ? Math.round(lifetime / customers.length) : 0;
    return { total: customers.length, lifetime, repeat, avg };
  }, [customers]);

  const STAT_CARDS = [
    { label: 'Total Customers', value: String(stats.total), icon: Users },
    { label: 'Lifetime Value', value: formatCurrency(stats.lifetime), icon: DollarSign },
    { label: 'Avg Spend', value: formatCurrency(stats.avg), icon: TrendingUp },
    { label: 'Repeat Guests', value: String(stats.repeat), icon: Repeat },
  ];

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setFormOpen(true);
  };

  const remove = (c: Customer) => {
    if (!confirm(`Delete customer "${c.name}"?`)) return;
    setCustomers((prev) => prev.filter((x) => x.id !== c.id));
    startTransition(() => {
      deleteCustomer(c.id).catch(() => {});
    });
  };

  const submit = (values: CustomerInput) => {
    if (editing) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editing.id ? { ...c, ...values, phone: values.phone || undefined, address: values.address || undefined } : c,
        ),
      );
      startTransition(() => {
        updateCustomer(editing.id, values).catch(() => {});
      });
    } else {
      setCustomers((prev) => [
        {
          id: `tmp-${Date.now()}`,
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          address: values.address || undefined,
          status: values.status,
          orders: [],
          reservations: [],
          totalSpend: 0,
          lastActivity: '',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      startTransition(() => {
        createCustomer(values).catch(() => {});
      });
    }
    setFormOpen(false);
  };

  const formDefaults: CustomerInput = editing
    ? {
        name: editing.name,
        email: editing.email,
        phone: editing.phone ?? '',
        address: editing.address ?? '',
        status: editing.status,
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors',
                statusFilter === s
                  ? 'bg-accent text-white'
                  : 'border border-border bg-surface text-fg-muted hover:border-accent/40',
              )}
            >
              {s === 'ALL' ? 'All' : s === 'ACTIVE' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers…"
              className="w-52 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Address</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} i={i} />
                    <div className="min-w-0">
                      <p className="font-medium">{c.name}</p>
                      <p className="truncate text-xs text-fg-muted">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-fg-muted">{c.phone ?? '—'}</td>
                <td className="px-5 py-3 text-fg-muted">
                  <span className="line-clamp-1 max-w-[16rem]">{c.address || '—'}</span>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-5 py-3 text-fg-muted">
                  {c.createdAt ? formatDate(c.createdAt, 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setView(c); setViewIndex(i); }}
                      aria-label="View"
                      className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-accent-soft hover:text-accent"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      aria-label="Edit"
                      className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-accent-soft hover:text-accent"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c)}
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
                  No customers match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit customer' : 'Add customer'}>
        <CustomerForm
          defaultValues={formDefaults}
          onSubmit={submit}
          onCancel={() => setFormOpen(false)}
          submitLabel={editing ? 'Save changes' : 'Add customer'}
        />
      </Modal>

      {/* View / history */}
      <Modal open={!!view} onClose={() => setView(null)} title="Customer">
        {view && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={view.name} i={viewIndex} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-semibold">{view.name}</p>
                  <StatusBadge status={view.status} />
                </div>
                <div className="mt-1 flex flex-col gap-0.5 text-sm text-fg-muted">
                  <a href={`mailto:${view.email}`} className="inline-flex items-center gap-2 hover:text-accent">
                    <Mail className="h-3.5 w-3.5" /> {view.email}
                  </a>
                  {view.phone && (
                    <a href={`tel:${view.phone}`} className="inline-flex items-center gap-2 hover:text-accent">
                      <Phone className="h-3.5 w-3.5" /> {view.phone}
                    </a>
                  )}
                  {view.address && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" /> {view.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-bg px-3 py-3">
                <p className="text-xs text-fg-muted">Lifetime</p>
                <p className="mt-0.5 font-display text-lg font-semibold">{formatCurrency(view.totalSpend)}</p>
              </div>
              <div className="rounded-lg bg-bg px-3 py-3">
                <p className="text-xs text-fg-muted">Orders</p>
                <p className="mt-0.5 font-display text-lg font-semibold">{view.orders.length}</p>
              </div>
              <div className="rounded-lg bg-bg px-3 py-3">
                <p className="text-xs text-fg-muted">Visits</p>
                <p className="mt-0.5 font-display text-lg font-semibold">{visits(view)}</p>
              </div>
            </div>

            {view.orders.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Order history</p>
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {view.orders.map((o) => (
                    <li key={o.number} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="font-medium">{o.number}</span>
                      <span className="text-fg-muted">{formatDate(o.date, 'MMM d')}</span>
                      <span className="font-medium">{formatCurrency(o.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {view.reservations.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Reservations</p>
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {view.reservations.map((r) => (
                    <li key={r.reference} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="font-medium">{r.reference}</span>
                      <span className="text-fg-muted">{formatDate(r.date, 'MMM d')}</span>
                      <span className="text-fg-muted">{r.kind === 'TABLE' ? 'Table' : 'Event'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
