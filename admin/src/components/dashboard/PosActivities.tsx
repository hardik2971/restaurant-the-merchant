import { TrendingUp } from 'lucide-react';
import { PaymentGauge } from '@/components/charts/PaymentGauge';
import { FilterPill } from '@/components/ui/FilterPill';
import { formatDelta } from '@/lib/utils';

interface Pos {
  totalSales: string;
  salesDelta: number;
  totalBills: number;
  avgValue: string;
  peakHour: string;
  payment: { cash: number; card: number; online: number };
}

export function PosActivities({ pos: POS }: { pos: Pos }) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">POS Activities</h2>
        <FilterPill label="Today's" />
      </div>

      {/* Total sales */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm text-fg-muted">Total Sales</span>
        <span className="text-fg-muted">→</span>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <p className="font-display text-3xl font-semibold">{POS.totalSales}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-1.5 py-0.5 text-xs font-semibold text-success">
          <TrendingUp className="h-3 w-3" />
          {formatDelta(POS.salesDelta)}
        </span>
        <span className="text-xs text-fg-muted">Since Yesterday</span>
      </div>

      {/* Stat row */}
      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
        {[
          ['Total Bills', String(POS.totalBills)],
          ['AVG Value', POS.avgValue],
          ['Peak Hour', POS.peakHour],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-fg-muted">{label}</p>
            <p className="mt-1 font-display text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Payment method */}
      <p className="mt-5 text-sm font-medium">Payment Method</p>
      <div className="mt-2">
        <PaymentGauge value={POS.payment.cash} label="Cash Payment" />
      </div>
      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Card {POS.payment.card}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#cbd0d8]" /> Online {POS.payment.online}%
        </span>
      </div>

      <button
        type="button"
        className="mt-5 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
      >
        View Details
      </button>
    </section>
  );
}
