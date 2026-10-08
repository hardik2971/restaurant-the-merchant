'use client';

import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trophy, TrendingDown, Clock, CalendarDays, Download, Wallet, Star } from 'lucide-react';
import type { TableAnalytics } from '@/lib/queries';
import { cn, formatCurrency } from '@/lib/utils';

const HEADER = ['Table', 'Name', 'Sessions', 'Customers', 'Orders', 'Revenue', 'AvgBill', 'AvgDiningMin', 'OccupancyPct', 'UtilizationPct'];
const toRow = (t: TableAnalytics['perTable'][number]) =>
  [t.number, t.name ?? '', t.sessions, t.customers, t.orders, t.revenue, t.avgBill, t.avgDiningMinutes, t.occupancyPct, t.utilizationPct];

function download(name: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportCsv(rows: TableAnalytics['perTable']) {
  const csv = [HEADER, ...rows.map(toRow)].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  download('table-performance.csv', 'text/csv;charset=utf-8', csv);
}

// Excel via an HTML table (.xls) — opens natively in Excel, no library needed.
function exportXls(rows: TableAnalytics['perTable']) {
  const head = `<tr>${HEADER.map((h) => `<th>${h}</th>`).join('')}</tr>`;
  const body = rows.map((t) => `<tr>${toRow(t).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead>${head}</thead><tbody>${body}</tbody></table></body></html>`;
  download('table-performance.xls', 'application/vnd.ms-excel', html);
}

function printPdf(data: TableAnalytics) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  const head = `<tr>${HEADER.map((h) => `<th>${h}</th>`).join('')}</tr>`;
  const body = data.perTable.map((t) => `<tr>${toRow(t).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
  w.document.write(`<!doctype html><html><head><title>Table Performance</title><style>
    body{font-family:system-ui,sans-serif;padding:24px;color:#141210}
    h1{font-size:20px;margin:0 0 4px} .muted{color:#666;font-size:12px;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;font-size:12px} th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
    th{background:#f6f6f6}
  </style></head><body>
    <h1>The Merchant Boston — Table Performance</h1>
    <p class="muted">${data.summary.sessions} sessions · ${data.summary.customers} customers · $${data.summary.revenue.toLocaleString()} revenue</p>
    <table><thead>${head}</thead><tbody>${body}</tbody></table>
    <script>window.onload=function(){window.print()}</script>
  </body></html>`);
  w.document.close();
}

const PERIODS = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'Last 7 Days' },
  { days: 30, label: 'Last 30 Days' },
];

const TOP_LABELS: Record<string, string> = {
  highestRevenue: 'Highest Revenue',
  mostUsed: 'Most Used',
  mostCustomers: 'Most Customers',
  highestAvgBill: 'Highest Avg Bill',
  longestOccupied: 'Longest Occupied',
  fastestTurnover: 'Fastest Turnover',
};
const LEAST_LABELS: Record<string, string> = {
  leastUsed: 'Least Used',
  lowestRevenue: 'Lowest Revenue',
  lowestOccupancy: 'Lowest Occupancy',
};

export function TableAnalyticsView({ data }: { data: TableAnalytics }) {
  const live = [
    { label: 'Total', value: data.live.total, tone: 'text-fg' },
    { label: 'Available', value: data.live.available, tone: 'text-success' },
    { label: 'Occupied', value: data.live.occupied, tone: 'text-danger' },
    { label: 'Reserved', value: data.live.reserved, tone: 'text-warn' },
    { label: 'Cleaning', value: data.live.cleaning, tone: 'text-info' },
    { label: 'Out of Service', value: data.live.outOfService, tone: 'text-fg-muted' },
  ];

  const summary = [
    { label: 'Table Sessions', value: String(data.summary.sessions) },
    { label: 'Customers', value: String(data.summary.customers) },
    { label: 'Orders', value: String(data.summary.orders) },
    { label: 'Revenue', value: formatCurrency(data.summary.revenue) },
    { label: 'Avg Bill', value: formatCurrency(data.summary.avgBill) },
    { label: 'Avg Guests/Table', value: String(data.summary.avgCustomersPerTable) },
    { label: 'Avg Dining', value: `${data.summary.avgDiningMinutes} min` },
  ];

  return (
    <div className="space-y-5">
      {/* Period tabs + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p.days}
              href={`/table-analytics?days=${p.days}`}
              className={cn(
                'rounded-pill px-4 py-1.5 text-sm font-medium transition-colors',
                data.days === p.days ? 'bg-accent text-white' : 'border border-border bg-surface text-fg-muted hover:border-accent/40',
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-muted">Export</span>
          <button type="button" onClick={() => exportCsv(data.perTable)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-bg">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button type="button" onClick={() => exportXls(data.perTable)} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-bg">Excel</button>
          <button type="button" onClick={() => printPdf(data)} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-bg">PDF</button>
        </div>
      </div>

      {/* Live stats */}
      <div className="card flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
        {live.map((s) => (
          <div key={s.label}>
            <p className={cn('font-display text-2xl font-semibold', s.tone)}>{s.value}</p>
            <p className="text-xs text-fg-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {summary.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-fg-muted">{s.label}</p>
            <p className="mt-1 font-display text-xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Busy hours */}
        <div className="card p-5 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Busy Hours</h2>
            <div className="flex gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-fg-muted"><Clock className="h-4 w-4" /> Peak {data.peakHour}</span>
              <span className="inline-flex items-center gap-1.5 text-fg-muted"><CalendarDays className="h-4 w-4" /> {data.peakDay}</span>
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.busyHours} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-fg-muted)' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-fg-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--color-bg)' }} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', fontSize: 12 }} />
                <Bar dataKey="sessions" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top / least performers */}
        <div className="space-y-5 lg:col-span-4">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Trophy className="h-4 w-4 text-gold" /> Top Tables</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {Object.entries(TOP_LABELS).map(([key, label]) => {
                const v = data.top[key];
                return (
                  <li key={key} className="flex items-center justify-between gap-3">
                    <span className="text-fg-muted">{label}</span>
                    <span className="font-medium">{v ? `Table ${v.number} · ${v.value}` : '—'}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><TrendingDown className="h-4 w-4 text-fg-muted" /> Needs Attention</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {Object.entries(LEAST_LABELS).map(([key, label]) => {
                const v = data.least[key];
                return (
                  <li key={key} className="flex items-center justify-between gap-3">
                    <span className="text-fg-muted">{label}</span>
                    <span className="font-medium">{v ? `Table ${v.number} · ${v.value}` : '—'}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Customer analytics */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="font-display text-lg font-semibold">Customers</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-bg px-3 py-3">
              <p className="text-xs text-fg-muted">Served</p>
              <p className="mt-0.5 font-display text-xl font-semibold">{data.customer.served}</p>
            </div>
            <div className="rounded-lg bg-bg px-3 py-3">
              <p className="text-xs text-fg-muted">Avg Spend</p>
              <p className="mt-0.5 font-display text-xl font-semibold">{formatCurrency(data.customer.avgSpend)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Star className="h-4 w-4 text-gold" /> Favourite Items</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {data.customer.favouriteItems.length === 0 ? <li className="text-fg-muted">No data yet.</li> : data.customer.favouriteItems.map((f) => (
              <li key={f.name} className="flex justify-between"><span className="truncate">{f.name}</span><span className="text-fg-muted">{f.qty}</span></li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Wallet className="h-4 w-4 text-accent" /> Payment Methods</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {data.customer.paymentMix.length === 0 ? <li className="text-fg-muted">No payments yet.</li> : data.customer.paymentMix.map((p) => (
              <li key={p.method} className="flex justify-between"><span>{p.method}</span><span className="text-fg-muted">{p.count}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-table performance */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="px-5 py-3 font-medium">Table</th>
              <th className="px-5 py-3 font-medium">Sessions</th>
              <th className="px-5 py-3 font-medium">Customers</th>
              <th className="px-5 py-3 font-medium">Orders</th>
              <th className="px-5 py-3 font-medium">Revenue</th>
              <th className="px-5 py-3 font-medium">Avg Bill</th>
              <th className="px-5 py-3 font-medium">Avg Dining</th>
              <th className="px-5 py-3 font-medium">Occupancy</th>
              <th className="px-5 py-3 font-medium">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {data.perTable.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-bg/60">
                <td className="px-5 py-3 font-medium">
                  <Link href={`/table-history/${t.id}`} className="hover:text-accent hover:underline">
                    Table {t.number}{t.name ? <span className="text-xs text-fg-muted"> · {t.name}</span> : null}
                  </Link>
                </td>
                <td className="px-5 py-3 text-fg-muted">{t.sessions}</td>
                <td className="px-5 py-3 text-fg-muted">{t.customers}</td>
                <td className="px-5 py-3 text-fg-muted">{t.orders}</td>
                <td className="px-5 py-3 font-medium">{formatCurrency(t.revenue)}</td>
                <td className="px-5 py-3 text-fg-muted">{formatCurrency(t.avgBill)}</td>
                <td className="px-5 py-3 text-fg-muted">{t.avgDiningMinutes} min</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${t.occupancyPct}%` }} />
                    </span>
                    {t.occupancyPct}%
                  </span>
                </td>
                <td className="px-5 py-3 text-fg-muted">{t.utilizationPct}%</td>
              </tr>
            ))}
            {data.perTable.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-fg-muted">No tables yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
