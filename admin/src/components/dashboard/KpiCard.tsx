import { Package, PackageCheck, PackageX, Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatDelta } from '@/lib/utils';
import type { Kpi } from '@/lib/dashboard-data';

const ICONS: Record<string, React.ElementType> = {
  orders: Package,
  delivered: PackageCheck,
  canceled: PackageX,
  revenue: Coins,
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = ICONS[kpi.key] ?? Package;
  const up = kpi.delta >= 0;
  const Delta = up ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        'rounded-card border p-5 shadow-card transition-colors',
        kpi.accent ? 'border-accent bg-accent text-white' : 'border-border bg-surface',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'grid h-9 w-9 place-items-center rounded-lg',
            kpi.accent ? 'bg-white/20 text-white' : 'bg-bg text-fg-muted',
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className={cn('text-sm font-medium', kpi.accent ? 'text-white/90' : 'text-fg-muted')}>
          {kpi.label}
        </span>
      </div>

      <p className="mt-4 font-display text-[32px] font-semibold leading-none">{kpi.value}</p>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold',
            kpi.accent
              ? 'bg-white/20 text-white'
              : up
                ? 'bg-success-soft text-success'
                : 'bg-danger-soft text-danger',
          )}
        >
          <Delta className="h-3 w-3" />
          {formatDelta(kpi.delta)}
        </span>
        <span className={cn('text-xs', kpi.accent ? 'text-white/80' : 'text-fg-muted')}>
          Since last month
        </span>
      </div>
    </div>
  );
}
