'use client';

import { useMemo, useState, useTransition } from 'react';
import { Search, Gift, DollarSign, CheckCircle2, Clock, Pencil, Trash2, Eye, Download } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { GiftCardForm } from '@/components/giftcards/GiftCardForm';
import { updateGiftCard, deleteGiftCard, setGiftCardStatus } from '@/lib/actions';
import { type GiftCardEditInput, type CouponStatusValue } from '@/schemas/giftcard';
import {
  COUPON_KIND_LABELS,
  COUPON_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type CouponStatus,
  type GiftCardRecord,
} from '@/lib/giftcards-data';
import { cn, formatCurrency, formatDate, gatewayLabel } from '@/lib/utils';

const STATUS_FILTERS: (CouponStatus | 'ALL')[] = ['ALL', 'PENDING_PAYMENT', 'PAID', 'ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED'];
const KIND_FILTERS = [
  { value: 'ALL', label: 'All types' },
  { value: 'GIFT_CARD', label: 'Gift Cards' },
  { value: 'COUPON', label: 'Coupons' },
] as const;

const STATUS_STYLES: Record<CouponStatus, string> = {
  PENDING_PAYMENT: 'bg-warn-soft text-warn',
  PAID: 'bg-info-soft text-info',
  ACTIVE: 'bg-success-soft text-success',
  REDEEMED: 'bg-accent-soft text-accent',
  EXPIRED: 'bg-bg text-fg-muted',
  CANCELLED: 'bg-danger-soft text-danger',
};

// Quick status transitions available from the detail view.
const QUICK_ACTIONS: { status: CouponStatusValue; label: string; danger?: boolean }[] = [
  { status: 'ACTIVE', label: 'Activate' },
  { status: 'REDEEMED', label: 'Mark Redeemed' },
  { status: 'EXPIRED', label: 'Expire' },
  { status: 'CANCELLED', label: 'Cancel', danger: true },
];

function StatusBadge({ status }: { status: CouponStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold', STATUS_STYLES[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {COUPON_STATUS_LABELS[status]}
    </span>
  );
}

function exportCsv(rows: GiftCardRecord[]) {
  const header = ['Code', 'Type', 'Customer', 'Email', 'Amount', 'Payment', 'Status', 'Expiry', 'Created'];
  const data = rows.map((r) => [
    r.code,
    COUPON_KIND_LABELS[r.kind],
    r.customerName,
    r.customerEmail,
    r.amount.toFixed(2),
    PAYMENT_STATUS_LABELS[r.paymentStatus],
    COUPON_STATUS_LABELS[r.status],
    r.expiryDate ?? '',
    r.createdAt.slice(0, 10),
  ]);
  const csv = [header, ...data].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gift-cards-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function GiftCardsManager({ initialCards }: { initialCards: GiftCardRecord[] }) {
  const [cards, setCards] = useState<GiftCardRecord[]>(initialCards);
  const [status, setStatus] = useState<CouponStatus | 'ALL'>('ALL');
  const [kind, setKind] = useState<'ALL' | 'GIFT_CARD' | 'COUPON'>('ALL');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<GiftCardRecord | null>(null);
  const [editing, setEditing] = useState<GiftCardRecord | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter(
      (c) =>
        (status === 'ALL' || c.status === status) &&
        (kind === 'ALL' || c.kind === kind) &&
        (q === '' || c.code.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q) || c.customerEmail.toLowerCase().includes(q)),
    );
  }, [cards, status, kind, query]);

  const stats = useMemo(() => {
    const value = cards.filter((c) => c.paymentStatus === 'PAID').reduce((s, c) => s + c.amount, 0);
    const active = cards.filter((c) => c.status === 'ACTIVE').length;
    const redeemed = cards.filter((c) => c.status === 'REDEEMED').length;
    return { total: cards.length, value, active, redeemed };
  }, [cards]);

  const STAT_CARDS = [
    { label: 'Total Purchases', value: String(stats.total), icon: Gift },
    { label: 'Total Value', value: formatCurrency(stats.value), icon: DollarSign },
    { label: 'Active', value: String(stats.active), icon: CheckCircle2 },
    { label: 'Redeemed', value: String(stats.redeemed), icon: Clock },
  ];

  const changeStatus = (id: string, next: CouponStatusValue) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: next } : c)));
    setView((cur) => (cur && cur.id === id ? { ...cur, status: next } : cur));
    startTransition(() => {
      setGiftCardStatus(id, next).catch(() => {});
    });
  };

  const remove = (c: GiftCardRecord) => {
    if (!confirm(`Delete ${c.code}?`)) return;
    setCards((prev) => prev.filter((x) => x.id !== c.id));
    startTransition(() => {
      deleteGiftCard(c.id).catch(() => {});
    });
  };

  const submitEdit = (values: GiftCardEditInput) => {
    if (!editing) return;
    setCards((prev) =>
      prev.map((c) =>
        c.id === editing.id
          ? { ...c, customerName: values.customerName, customerEmail: values.customerEmail || '', kind: values.kind, amount: values.amount, status: values.status, paymentStatus: values.paymentStatus, expiryDate: values.expiryDate || undefined }
          : c,
      ),
    );
    startTransition(() => {
      updateGiftCard(editing.id, values).catch(() => {});
    });
    setEditing(null);
  };

  const editDefaults: GiftCardEditInput | null = editing
    ? {
        customerName: editing.customerName,
        customerEmail: editing.customerEmail,
        kind: editing.kind,
        amount: editing.amount,
        status: editing.status,
        paymentStatus: editing.paymentStatus,
        expiryDate: editing.expiryDate ?? '',
      }
    : null;

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
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-pill px-3 py-1.5 text-sm font-medium transition-colors',
                status === s ? 'bg-accent text-white' : 'border border-border bg-surface text-fg-muted hover:border-accent/40',
              )}
            >
              {s === 'ALL' ? 'All' : COUPON_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted outline-none focus:border-accent"
          >
            {KIND_FILTERS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name, email…"
              className="w-52 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={() => exportCsv(filtered)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-bg"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className={cn(
                  'border-b border-border last:border-0 hover:bg-bg/60',
                  // Spent / terminal coupons — dim the row to read as inactive.
                  (c.status === 'REDEEMED' || c.status === 'EXPIRED' || c.status === 'CANCELLED') && 'opacity-50',
                )}
              >
                <td className="px-5 py-3 font-mono text-xs font-semibold">{c.code}</td>
                <td className="px-5 py-3">
                  <p className="font-medium">{c.customerName}</p>
                  <p className="truncate text-xs text-fg-muted">{c.customerEmail || '—'}</p>
                </td>
                <td className="px-5 py-3 text-fg-muted">{COUPON_KIND_LABELS[c.kind]}</td>
                <td className="px-5 py-3 font-medium">{formatCurrency(c.amount)}</td>
                <td className="px-5 py-3 text-fg-muted">{PAYMENT_STATUS_LABELS[c.paymentStatus]}</td>
                <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3 text-fg-muted">{formatDate(c.createdAt, 'MMM d, yyyy')}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button type="button" onClick={() => setView(c)} aria-label="View" className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-accent-soft hover:text-accent"><Eye className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setEditing(c)} aria-label="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-accent-soft hover:text-accent"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => remove(c)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-danger-soft hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-fg-muted">No purchases match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View detail */}
      <Modal open={!!view} onClose={() => setView(null)} title={view ? view.code : ''}>
        {view && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">{COUPON_KIND_LABELS[view.kind]}</span>
              <StatusBadge status={view.status} />
            </div>

            <div className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-fg-muted">Code</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-gold-deep">{view.code}</p>
              <p className="mt-1 font-display text-xl font-semibold">{formatCurrency(view.amount)}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Customer', view.customerName],
                ['Email', view.customerEmail || '—'],
                ['Payment', PAYMENT_STATUS_LABELS[view.paymentStatus]],
                ['Expiry', view.expiryDate ?? 'No expiry'],
                ['Created', formatDate(view.createdAt, 'MMM d, yyyy')],
                ...(view.razorpayPaymentId
                  ? [[`${gatewayLabel(view.paymentProvider)} Payment`, view.razorpayPaymentId] as [string, string]]
                  : []),
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border px-3 py-2">
                  <dt className="text-xs text-fg-muted">{k}</dt>
                  <dd className="mt-0.5 font-medium break-words">{v}</dd>
                </div>
              ))}
            </dl>

            {view.message && (
              <div className="rounded-lg border border-border px-3 py-2 text-sm">
                <p className="text-xs text-fg-muted">Message</p>
                <p className="mt-0.5 italic">&ldquo;{view.message}&rdquo;</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Update status</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.filter((a) => a.status !== view.status).map((a) => (
                  <button
                    key={a.status}
                    type="button"
                    onClick={() => changeStatus(view.id, a.status)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                      a.danger ? 'border border-danger/40 text-danger hover:bg-danger-soft' : 'bg-accent text-white hover:bg-accent-deep',
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.code}` : ''}>
        {editDefaults && <GiftCardForm defaultValues={editDefaults} onSubmit={submitEdit} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
