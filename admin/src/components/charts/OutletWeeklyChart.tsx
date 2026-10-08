'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { WeeklyMetric } from '@/lib/outlets-data';

export function OutletWeeklyChart({ data }: { data: WeeklyMetric[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-fg-muted)' }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v: number) => `$${v / 1000}K`}
          tick={{ fontSize: 11, fill: 'var(--color-fg-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number, name) => [`$${v.toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Cost']}
          contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', fontSize: 12 }}
        />
        <Line type="monotone" dataKey="revenue" stroke="#3a3a3a" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="cost" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
