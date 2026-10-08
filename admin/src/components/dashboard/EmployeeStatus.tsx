import { ArrowUpRight } from 'lucide-react';
import { EmployeeGauge } from '@/components/charts/EmployeeGauge';

interface Segment {
  label: string;
  value: number;
  color: string;
}

export function EmployeeStatus({ total, segments }: { total: number; segments: Segment[] }) {

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between">
        <h2 className="font-display text-lg font-semibold">Employee Status</h2>
        <button
          type="button"
          aria-label="Open employee status"
          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:border-accent/40 hover:text-accent"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1 text-sm text-fg-muted">
        Total Employees → <span className="font-semibold text-fg">{total}</span>
      </p>

      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-4">
        <EmployeeGauge segments={segments} total={total} />

        <ul className="space-y-2.5 text-sm">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2 whitespace-nowrap">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-fg-muted">{s.label} →</span>
              <span className="font-semibold">{String(s.value).padStart(2, '0')}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
