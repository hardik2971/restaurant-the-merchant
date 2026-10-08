import { ArrowUpRight } from 'lucide-react';
import type { SalesType } from '@/lib/dashboard-data';

// Decreasing orange intensity for the three bars (matches the mockup).
const BAR_COLORS = ['bg-accent', 'bg-[#f7945f]', 'bg-[#fbc6a8]'];

export function SalesOrderTypes({ types: SALES_TYPES }: { types: SalesType[] }) {
  return (
    <section className="card flex h-full flex-col p-5">
      <div className="flex items-start justify-between">
        <h2 className="font-display text-lg font-semibold">Sales &amp; Order Types</h2>
        <button
          type="button"
          aria-label="Open sales breakdown"
          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:border-accent/40 hover:text-accent"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 grid flex-1 grid-cols-3">
        {SALES_TYPES.map((s, i) => (
          <div
            key={s.label}
            className={i > 0 ? 'border-l border-dashed border-border pl-4' : 'pr-4'}
          >
            <p className="text-xs text-fg-muted">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{s.percent}%</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-1.5">
        {SALES_TYPES.map((s, i) => (
          <div
            key={s.label}
            className={`h-2.5 rounded-full ${BAR_COLORS[i]}`}
            style={{ width: `${s.percent}%` }}
          />
        ))}
      </div>
    </section>
  );
}
