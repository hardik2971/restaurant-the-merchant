'use client';

import { useMemo, useState } from 'react';
import { Search, Download, Receipt, DollarSign, CreditCard } from 'lucide-react';
import type { Transaction } from '@/lib/queries';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const SOURCE_FILTERS = ['ALL', 'Order', 'Gift Card', 'Table'] as const;
const GATEWAYS = new Set(['Razorpay', 'Stripe', 'PayPal']);

const SOURCE_CLS: Record<string, string> = {
  Order: 'bg-accent-soft text-accent',
  'Gift Card': 'bg-gold/15 text-gold-deep',
  Table: 'bg-info-soft text-info',
};

function exportCsv(rows: Transaction[]) {
  const header = ['Date', 'Source', 'Reference', 'Customer', 'Method', 'Amount', 'Status', 'PaymentId'];
  const data = rows.map((t) => [t.date.slice(0, 19).replace('T', ' '), t.source, t.reference, t.customer, t.method, t.amount, t.status, t.paymentId ?? '']);
  const csv = [header, ...data].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function TransactionsView({ transactions }: { transactions: Transaction[] }) {
  const [source, setSource] = useState<string>('ALL');
  const [method, setMethod] = useState<string>('ALL');
  const [query, setQuery] = useState('');

  const methods = useMemo(() => Array.from(new Set(transactions.map((t) => t.method))).sort(), [transactions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter(
      (t) =>
        (source === 'ALL' || t.source === source) &&
        (method === 'ALL' || t.method === method) &&
        (q === '' || t.reference.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q) || (t.paymentId ?? '').toLowerCase().includes(q)),
    );
  }, [transactions, source, method, query]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, t) => s + t.amount, 0);
    const gateway = filtered.filter((t) => GATEWAYS.has(t.method));
    return { count: filtered.length, total, gatewayCount: gateway.length, gatewayTotal: gateway.reduce((s, t) => s + t.amount, 0) };
  }, [filtered]);

  const STAT_CARDS = [
    { label: 'Transactions', value: String(stats.count), icon: Receipt },
    { label: 'Total Amount', value: formatCurrency(stats.total), icon: DollarSign },
    { label: 'Gateway Payments', value: String(stats.gatewayCount), icon: CreditCard },
    { label: 'Gateway Amount', value: formatCurrency(stats.gatewayTotal), icon: DollarSign },
  ];

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
          {SOURCE_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={cn(
                'rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors',
                source === s ? 'bg-accent text-white' : 'border border-border bg-surface text-fg-muted hover:border-accent/40',
              )}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted outline-none focus:border-accent">
            <option value="ALL">All methods</option>
            {methods.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ref, customer, payment id…" className="w-56 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent" />
          </div>
          <button type="button" onClick={() => exportCsv(filtered)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-bg">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="px-5 py-3 font-medium">Source</th>
              <th className="px-5 py-3 font-medium">Reference</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Method</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-bg/60">
                <td className="px-5 py-3">
                  <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', SOURCE_CLS[t.source])}>{t.source}</span>
                </td>
                <td className="px-5 py-3 font-medium">
                  {t.reference}
                  {t.paymentId && <p className="font-mono text-[10px] text-fg-muted">{t.paymentId}</p>}
                </td>
                <td className="px-5 py-3 text-fg-muted">{t.customer}</td>
                <td className="px-5 py-3">
                  {GATEWAYS.has(t.method) ? (
                    <span className="rounded-pill bg-[#3395ff]/15 px-2 py-0.5 text-xs font-semibold text-[#3395ff]">{t.method}</span>
                  ) : (
                    <span className="text-fg-muted">{t.method}</span>
                  )}
                </td>
                <td className="px-5 py-3 font-medium">{formatCurrency(t.amount)}</td>
                <td className="px-5 py-3 text-fg-muted">{formatDate(t.date, 'MMM d, h:mm a')}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-fg-muted">No transactions match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
