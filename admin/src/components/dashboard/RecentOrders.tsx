import Link from 'next/link';
import { Search } from 'lucide-react';
import { FilterPill } from '@/components/ui/FilterPill';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { type RecentOrder } from '@/lib/dashboard-data';
import { formatCurrency } from '@/lib/utils';

export function RecentOrders({ orders: RECENT_ORDERS }: { orders: RecentOrder[] }) {
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Recent Orders</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
            <input
              placeholder="eg: search here…"
              className="w-44 rounded-lg border border-border bg-bg py-1.5 pl-8 pr-3 text-xs outline-none focus:border-accent"
            />
          </div>
          <Link href="/orders" className="text-xs font-medium text-accent hover:text-accent-deep">View all</Link>
        </div>
      </div>

      {RECENT_ORDERS.length === 0 ? (
        <p className="mt-6 text-sm text-fg-muted">No orders yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECENT_ORDERS.map((o) => (
            <article key={o.orderId} className="rounded-xl border border-border p-3">
              <div className="relative h-28 w-full overflow-hidden rounded-lg bg-bg">
                {o.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.image} alt={o.customer} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-xs text-fg-muted">No image</span>
                )}
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <h3 className="min-w-0 truncate text-sm font-semibold">{o.customer}</h3>
                <span className="text-xs text-fg-muted">{o.line}</span>
              </div>
              <dl className="mt-2 space-y-1 text-xs text-fg-muted">
                <div className="flex justify-between">
                  <dt>Order ID</dt>
                  <dd className="font-medium text-fg">{o.orderId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Type</dt>
                  <dd className="font-medium text-fg">{o.type}</dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={o.status} />
                <span className="font-display text-base font-semibold">{formatCurrency(o.price)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
