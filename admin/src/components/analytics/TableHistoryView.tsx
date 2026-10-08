'use client';

import Link from 'next/link';
import { ArrowLeft, Download, Users, Clock, UserRound } from 'lucide-react';
import type { TableHistory, HistorySession } from '@/lib/queries';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const PERIODS = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'Last 7 Days' },
  { days: 30, label: 'Last 30 Days' },
];

function exportCsv(number: string, sessions: HistorySession[]) {
  const header = ['Date', 'Opened', 'Closed', 'Duration(min)', 'Guests', 'Waiter', 'Items', 'Subtotal', 'Discount', 'Tax', 'Service', 'Tip', 'Total', 'Payment', 'Status'];
  const rows = sessions.map((s) => [
    s.openedAt.slice(0, 10),
    new Date(s.openedAt).toLocaleTimeString(),
    s.closedAt ? new Date(s.closedAt).toLocaleTimeString() : '',
    s.durationMinutes,
    s.customerCount,
    s.waiterName ?? '',
    s.items.map((i) => `${i.qty}x ${i.name}`).join('; '),
    s.subtotal, s.discount, s.tax, s.serviceCharge, s.tip, s.total,
    s.paymentMethod ?? '',
    s.status,
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `table-${number}-history.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function TableHistoryView({ data, days }: { data: TableHistory; days: number }) {
  if (!data.table) return <p className="text-sm text-fg-muted">Table not found.</p>;
  const t = data.table;

  const totals = data.sessions.reduce(
    (acc, s) => ({ revenue: acc.revenue + s.total, guests: acc.guests + s.customerCount, mins: acc.mins + s.durationMinutes }),
    { revenue: 0, guests: 0, mins: 0 },
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/table-analytics" className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-accent">
          <ArrowLeft className="h-4 w-4" /> Analytics
        </Link>
        <button
          type="button"
          onClick={() => exportCsv(t.number, data.sessions)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-bg"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="card p-5">
        <h2 className="font-display text-xl font-semibold">Table {t.number}{t.name ? <span className="text-sm text-fg-muted"> · {t.name}</span> : null}</h2>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-fg-muted">
          <span>{data.sessions.length} sessions</span>
          <span>{totals.guests} guests</span>
          <span>{formatCurrency(totals.revenue)} revenue</span>
          <span>{totals.mins} min total occupied</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p.days}
              href={`/table-history/${t.id}?days=${p.days}`}
              className={cn('rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors', days === p.days ? 'bg-accent text-white' : 'border border-border bg-surface text-fg-muted hover:border-accent/40')}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {data.sessions.length === 0 ? (
        <div className="card px-5 py-16 text-center text-sm text-fg-muted">No sessions in this period.</div>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {data.sessions.map((s) => (
            <li key={s.id} className="relative">
              <span className={cn('absolute -left-[1.69rem] top-1.5 h-3 w-3 rounded-full ring-4 ring-surface', s.status === 'OPEN' ? 'bg-danger' : 'bg-accent')} />
              <div className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{formatDate(s.openedAt, 'EEE, MMM d · h:mm a')}{s.closedAt ? ` – ${formatDate(s.closedAt, 'h:mm a')}` : ' (open)'}</p>
                  <span className="font-display text-lg font-semibold">{formatCurrency(s.total)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-muted">
                  <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {s.customerCount} guests</span>
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {s.durationMinutes} min</span>
                  {s.waiterName && <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> {s.waiterName}</span>}
                  {s.paymentMethod && <span>Paid · {s.paymentMethod}</span>}
                </div>
                {s.items.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
                    {s.items.map((it) => (
                      <li key={it.name}><span className="font-medium text-fg">{it.qty}×</span> {it.name}</li>
                    ))}
                  </ul>
                )}
                {(s.discount > 0 || s.tax > 0 || s.serviceCharge > 0 || s.tip > 0) && (
                  <p className="mt-2 text-xs text-fg-muted">
                    Subtotal {formatCurrency(s.subtotal)}
                    {s.discount > 0 ? ` · −${formatCurrency(s.discount)} disc` : ''}
                    {s.tax > 0 ? ` · +${formatCurrency(s.tax)} tax` : ''}
                    {s.serviceCharge > 0 ? ` · +${formatCurrency(s.serviceCharge)} svc` : ''}
                    {s.tip > 0 ? ` · +${formatCurrency(s.tip)} tip` : ''}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
