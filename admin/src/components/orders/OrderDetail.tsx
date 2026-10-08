'use client';

import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { OrderProgress } from '@/components/orders/OrderProgress';
import {
  nextStatuses,
  STATUS_LABELS,
  TYPE_LABELS,
  type Order,
  type OrderStatus,
} from '@/lib/orders-data';
import { cn, formatCurrency, formatDate, gatewayLabel } from '@/lib/utils';

const SCHEDULE_LABELS = { NOW: 'ASAP', LATER: 'Scheduled' } as const;

export function OrderDetail({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  if (!order) return null;
  const transitions = nextStatuses(order.status);

  return (
    <Modal open={!!order} onClose={onClose} title={order.number}>
      <div className="space-y-5">
        {/* Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            {order.channel === 'ONLINE' && (
              <span className="rounded-pill bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                Online
              </span>
            )}
            {order.paymentProvider && (
              <span className="rounded-pill bg-[#3395ff]/15 px-2.5 py-0.5 text-xs font-semibold text-[#3395ff]">
                {gatewayLabel(order.paymentProvider)}
              </span>
            )}
          </div>
          <span className="text-sm text-fg-muted">{formatDate(order.createdAt, 'MMM d, h:mm a')}</span>
        </div>

        {/* Step-wise status progress */}
        <OrderProgress status={order.status} />

        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Customer', order.customer],
            ['Type', TYPE_LABELS[order.type]],
            ...(order.tableNumber ? [['Table', `Table ${order.tableNumber}`] as [string, string]] : []),
            ['Outlet', order.outlet],
            ['Payment', order.paymentMethod],
            ...(order.customerPhone ? [['Phone', order.customerPhone] as [string, string]] : []),
            ...(order.customerEmail ? [['Email', order.customerEmail] as [string, string]] : []),
            ...(order.razorpayPaymentId
              ? [[`${gatewayLabel(order.paymentProvider)} Payment`, order.razorpayPaymentId] as [string, string]]
              : []),
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border px-3 py-2">
              <dt className="text-xs text-fg-muted">{k}</dt>
              <dd className="mt-0.5 font-medium break-words">{v}</dd>
            </div>
          ))}
        </dl>

        {/* Take-away scheduling (online orders) */}
        {order.scheduleType && (
          <div className="rounded-lg border border-accent/30 bg-accent-soft/50 px-3 py-2.5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {SCHEDULE_LABELS[order.scheduleType]} pickup
            </p>
            <p className="mt-0.5 font-medium">
              {order.scheduleType === 'LATER' && order.scheduleDate
                ? `${formatDate(order.scheduleDate, 'EEE, MMM d')}${order.scheduleTime ? ` · ${order.scheduleTime}` : ''}`
                : 'As soon as possible'}
            </p>
          </div>
        )}

        {order.notes && (
          <div className="rounded-lg border border-border px-3 py-2 text-sm">
            <p className="text-xs text-fg-muted">Notes</p>
            <p className="mt-0.5">{order.notes}</p>
          </div>
        )}

        {/* Items */}
        <div className="rounded-xl border border-border">
          <div className="border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-fg-muted">
            Items
          </div>
          <ul className="divide-y divide-border">
            {order.items.map((it) => (
              <li key={it.name} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>
                  <span className="font-medium">{it.qty}×</span> {it.name}
                </span>
                <span className="text-fg-muted">{formatCurrency(it.qty * it.price)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-sm font-medium">Total</span>
            <span className="font-display text-lg font-semibold">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Transitions */}
        {transitions.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Update status</p>
            <div className="flex flex-wrap gap-2">
              {transitions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(order.id, s)}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    s === 'CANCELED'
                      ? 'border border-danger/40 text-danger hover:bg-danger-soft'
                      : 'bg-accent text-white hover:bg-accent-deep',
                  )}
                >
                  Mark {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">This order is {STATUS_LABELS[order.status]} — no further actions.</p>
        )}
      </div>
    </Modal>
  );
}
