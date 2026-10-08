import { CostRevenueChart } from '@/components/charts/CostRevenueChart';
import { FilterPill } from '@/components/ui/FilterPill';

interface OutletPoint {
  outlet: string;
  sells: number;
  cost: number;
}

export function OutletsChart({
  series,
  activeOutlet,
  revenueTotal,
}: {
  series: OutletPoint[];
  activeOutlet: string;
  revenueTotal: string;
}) {
  return (
    <section className="card p-5">
      <div className="flex items-start justify-between">
        <h2 className="font-display text-lg font-semibold">Outlets Operational Cost Vs Revenue</h2>
        <FilterPill label="Weekly" />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <p className="font-display text-4xl font-semibold">
          {revenueTotal}
          <span className="ml-2 align-middle text-base font-normal text-fg-muted">Revenue</span>
        </p>
        <div className="flex items-center gap-4 text-xs text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3a]" /> Sells
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Operational Cost
          </span>
        </div>
      </div>

      <div className="mt-3">
        <CostRevenueChart data={series} activeOutlet={activeOutlet} />
      </div>
    </section>
  );
}
