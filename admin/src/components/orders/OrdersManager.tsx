'use client';

import { useMemo, useState, useTransition } from 'react';
import { Search, Eye, Receipt, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { setOrderStatus } from '@/lib/actions';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { OrderDetail } from '@/components/orders/OrderDetail';
import {
  TYPE_LABELS,
  type Order,
  type OrderChannel,
  type OrderStatus,
  type OrderType,
} from '@/lib/orders-data';
import { cn, formatCurrency, formatDate, gatewayLabel } from '@/lib/utils';

const STATUS_FILTERS: (OrderStatus | 'ALL')[] = [
  'ALL',
  'PENDING',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELED',
];
const TYPE_FILTERS: (OrderType | 'ALL')[] = ['ALL', 'DINE_IN', 'DELIVERY', 'PICKUP'];
const CHANNEL_FILTERS: { value: OrderChannel | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All channels' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'POS', label: 'In-house (POS)' },
];

export function OrdersManager({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [type, setType] = useState<OrderType | 'ALL'>('ALL');
  const [channel, setChannel] = useState<OrderChannel | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (status === 'ALL' || o.status === status) &&
        (type === 'ALL' || o.type === type) &&
        (channel === 'ALL' || o.channel === channel) &&
        (q === '' ||
          o.number.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q)),
    );
  }, [orders, status, type, channel, query]);

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'COMPLETED');
    const canceled = orders.filter((o) => o.status === 'CANCELED');
    const revenue = completed.reduce((s, o) => s + o.total, 0);
    return { total: orders.length, completed: completed.length, canceled: canceled.length, revenue };
  }, [orders]);

  const [, startTransition] = useTransition();
  const changeStatus = (id: string, next: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
    setActive((cur) => (cur && cur.id === id ? { ...cur, status: next } : cur));
    startTransition(() => {
      setOrderStatus(id, next).catch(() => {});
    });
  };

  const STAT_CARDS = [
    { label: 'Total Orders', value: String(stats.total), icon: Receipt },
    { label: 'Completed', value: String(stats.completed), icon: CheckCircle2 },
    { label: 'Canceled', value: String(stats.canceled), icon: XCircle },
    { label: 'Revenue', value: formatCurrency(stats.revenue), icon: DollarSign },
  ];

  return (
    <div className="space-y-5">
      {/* Summary stats */}
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

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-pill px-3.5 py-1.5 text-sm font-medium capitalize transition-colors',
                status === s
                  ? 'bg-accent text-white'
                  : 'border border-border bg-surface text-fg-muted hover:border-accent/40',
              )}
            >
              {s === 'ALL' ? 'All' : s.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as OrderChannel | 'ALL')}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted outline-none focus:border-accent"
          >
            {CHANNEL_FILTERS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as OrderType | 'ALL')}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted outline-none focus:border-accent"
          >
            {TYPE_FILTERS.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All types' : TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order # or customer…"
              className="w-56 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">View</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o.id}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-bg/60"
                onClick={() => setActive(o)}
              >
                <td className="px-5 py-3 font-medium">
                  <span className="flex flex-wrap items-center gap-2">
                    {o.number}
                    {o.tableNumber && (
                      <span className="rounded-pill bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-deep">
                        Table {o.tableNumber}
                      </span>
                    )}
                    {o.channel === 'ONLINE' && (
                      <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        Online
                      </span>
                    )}
                    {o.paymentProvider && (
                      <span className="rounded-pill bg-[#3395ff]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#3395ff]">
                        {gatewayLabel(o.paymentProvider)}
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-5 py-3">{o.customer}</td>
                <td className="px-5 py-3 text-fg-muted">{TYPE_LABELS[o.type]}</td>
                <td className="px-5 py-3 text-fg-muted">
                  {o.items.reduce((n, it) => n + it.qty, 0)}
                </td>
                <td className="px-5 py-3 font-medium">{formatCurrency(o.total)}</td>
                <td className="px-5 py-3 text-fg-muted">{formatDate(o.createdAt, 'h:mm a')}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end">
                    <span className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted">
                      <Eye className="h-4 w-4" />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-fg-muted">
                  No orders match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-fg-muted">
        Showing {filtered.length} of {orders.length} orders. Status changes are in-session until the
        MySQL data layer is connected.
      </p>

      <OrderDetail order={active} onClose={() => setActive(null)} onStatusChange={changeStatus} />
    </div>
  );
}
