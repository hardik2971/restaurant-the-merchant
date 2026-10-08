'use client';

import { useMemo, useState } from 'react';
import { MapPin, Phone, User, Store, CheckCircle2, DollarSign, Percent } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { OutletWeeklyChart } from '@/components/charts/OutletWeeklyChart';
import { current, margin, type Outlet } from '@/lib/outlets-data';
import { cn, formatCurrency } from '@/lib/utils';

function MarginPill({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        'rounded-full px-1.5 py-0.5 text-xs font-semibold',
        positive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
      )}
    >
      {positive ? '+' : ''}
      {value}% margin
    </span>
  );
}

export function OutletsManager({ outlets }: { outlets: Outlet[] }) {
  const [active, setActive] = useState<Outlet | null>(null);

  const stats = useMemo(() => {
    const activeCount = outlets.filter((o) => o.isActive).length;
    const revenue = outlets.reduce((s, o) => s + current(o).revenue, 0);
    const cost = outlets.reduce((s, o) => s + current(o).cost, 0);
    const avgMargin = revenue ? Math.round(((revenue - cost) / revenue) * 100) : 0;
    return { total: outlets.length, activeCount, revenue, avgMargin };
  }, [outlets]);

  const STAT_CARDS = [
    { label: 'Total Outlets', value: String(stats.total), icon: Store },
    { label: 'Active', value: String(stats.activeCount), icon: CheckCircle2 },
    { label: 'Weekly Revenue', value: formatCurrency(stats.revenue), icon: DollarSign },
    { label: 'Avg Margin', value: `${stats.avgMargin}%`, icon: Percent },
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {outlets.map((o) => {
          const c = current(o);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setActive(o)}
              className="card p-5 text-left transition-shadow hover:shadow-pop"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">{o.name}</h3>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-fg-muted">
                    <MapPin className="h-3.5 w-3.5" /> {o.location}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-xs font-semibold',
                    o.isActive ? 'bg-success-soft text-success' : 'bg-bg text-fg-muted',
                  )}
                >
                  {o.isActive ? 'Active' : 'Closed'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-bg px-3 py-2">
                  <p className="text-xs text-fg-muted">Revenue</p>
                  <p className="font-display text-base font-semibold">{formatCurrency(c.revenue)}</p>
                </div>
                <div className="rounded-lg bg-bg px-3 py-2">
                  <p className="text-xs text-fg-muted">Op. Cost</p>
                  <p className="font-display text-base font-semibold">{formatCurrency(c.cost)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                  <User className="h-3.5 w-3.5" /> {o.manager}
                </span>
                <MarginPill value={margin(o)} />
              </div>
            </button>
          );
        })}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.name ?? ''}>
        {active && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
                <MapPin className="h-4 w-4" /> {active.location}
              </span>
              <MarginPill value={margin(active)} />
            </div>

            <dl className="divide-y divide-border rounded-xl border border-border px-4">
              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="inline-flex items-center gap-2 text-fg-muted">
                  <MapPin className="h-4 w-4" /> Address
                </dt>
                <dd className="text-right font-medium">{active.address}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="inline-flex items-center gap-2 text-fg-muted">
                  <Phone className="h-4 w-4" /> Phone
                </dt>
                <dd className="text-right font-medium">{active.phone}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="inline-flex items-center gap-2 text-fg-muted">
                  <User className="h-4 w-4" /> Manager
                </dt>
                <dd className="text-right font-medium">{active.manager}</dd>
              </div>
            </dl>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Revenue vs Operational Cost</p>
                <div className="flex items-center gap-3 text-xs text-fg-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3a]" /> Revenue
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Cost
                  </span>
                </div>
              </div>
              <OutletWeeklyChart data={active.weekly} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
