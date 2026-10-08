'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import type { OutletPoint } from '@/lib/dashboard-data';

const fmtK = (v: number) => `$${Math.round(v / 1000)}K`;

function ChartTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="flex flex-col gap-1">
      {payload.map((p) => (
        <span
          key={p.dataKey}
          className="rounded-full px-3 py-1 text-xs font-semibold text-white shadow-pop"
          style={{ background: p.dataKey === 'cost' ? 'var(--color-accent)' : '#3a3a3a' }}
        >
          {fmtK(p.value)}
        </span>
      ))}
    </div>
  );
}

export function CostRevenueChart({
  data,
  activeOutlet,
}: {
  data: OutletPoint[];
  activeOutlet: string;
}) {
  const activeIndex = data.findIndex((d) => d.outlet === activeOutlet);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="0" />
        <XAxis
          dataKey="outlet"
          tickFormatter={(v: string) => v.replace('Outlet ', 'Outlet ')}
          tick={{ fontSize: 11, fill: 'var(--color-fg-muted)' }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tickFormatter={(v: number) => `$${v / 1000}K`}
          tick={{ fontSize: 11, fill: 'var(--color-fg-muted)' }}
          axisLine={false}
          tickLine={false}
          domain={[0, 15000]}
          ticks={[0, 3000, 6000, 9000, 12000, 15000]}
        />
        {activeIndex >= 0 && (
          <ReferenceArea
            x1={data[Math.max(0, activeIndex - 0.5)]?.outlet}
            x2={data[activeIndex]?.outlet}
            fill="var(--color-accent)"
            fillOpacity={0.06}
          />
        )}
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: 'var(--color-accent)', strokeDasharray: '4 4' }}
        />
        <Line
          type="monotone"
          dataKey="sells"
          stroke="#3a3a3a"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: '#3a3a3a' }}
        />
        <Line
          type="monotone"
          dataKey="cost"
          stroke="var(--color-accent)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: 'var(--color-accent)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
