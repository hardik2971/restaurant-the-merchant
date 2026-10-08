'use client';

import { DollarSign, ShoppingBag, Boxes, Receipt, Download } from 'lucide-react';
import { RevenueBarChart } from '@/components/charts/RevenueBarChart';
import { CategoryPie } from '@/components/charts/CategoryPie';
import type { ReportsData } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';

const PIE_COLORS = ['#f15a24', '#e0a04b', '#7c8467', '#3b82f6', '#9a6cf1', '#16a34a', '#ef4444'];

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsView({ data }: { data: ReportsData }) {
  const { summary, revenueByOutlet, topItems, categoryMix, orderTypes, paymentMix } = data;
  const maxQty = Math.max(1, ...topItems.map((t) => t.qty));
  const catTotal = categoryMix.reduce((s, c) => s + c.revenue, 0);

  const STAT_CARDS = [
    { label: 'Revenue', value: formatCurrency(summary.revenue), icon: DollarSign },
    { label: 'Orders', value: String(summary.orders), icon: ShoppingBag },
    { label: 'Items Sold', value: String(summary.itemsSold), icon: Boxes },
    { label: 'Avg Order', value: formatCurrency(summary.avgOrder), icon: Receipt },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              'top-items.csv',
              topItems.map((t) => ({ Item: t.name, Quantity: t.qty, Revenue: t.revenue })),
            )
          }
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          <Download className="h-4 w-4" />
          Export top items (CSV)
        </button>
      </div>

      {/* Summary */}
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Revenue by outlet */}
        <section className="card p-5 lg:col-span-7">
          <h2 className="font-display text-lg font-semibold">Revenue by Outlet</h2>
          <div className="mt-4">
            <RevenueBarChart data={revenueByOutlet} />
          </div>
        </section>

        {/* Category mix */}
        <section className="card p-5 lg:col-span-5">
          <h2 className="font-display text-lg font-semibold">Category Mix</h2>
          <div className="mt-4">
            <CategoryPie data={categoryMix} />
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {categoryMix.map((c, i) => (
              <li key={c.category} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {c.category}
                </span>
                <span className="text-fg-muted">
                  {formatCurrency(c.revenue)} · {catTotal ? Math.round((c.revenue / catTotal) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Top items */}
        <section className="card p-5 lg:col-span-7">
          <h2 className="font-display text-lg font-semibold">Top Selling Items</h2>
          <ul className="mt-4 space-y-3">
            {topItems.map((t) => (
              <li key={t.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-fg-muted">
                    {t.qty} sold · {formatCurrency(t.revenue)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-bg">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${(t.qty / maxQty) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Order types + payment */}
        <section className="card space-y-5 p-5 lg:col-span-5">
          <div>
            <h2 className="font-display text-lg font-semibold">Order Types</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {orderTypes.map((t) => (
                <li key={t.type} className="flex items-center justify-between">
                  <span>{t.type}</span>
                  <span className="font-medium">{t.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border pt-4">
            <h2 className="font-display text-lg font-semibold">Payment Methods</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {paymentMix.map((p) => (
                <li key={p.method} className="flex items-center justify-between">
                  <span>{p.method}</span>
                  <span className="font-medium">{p.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
