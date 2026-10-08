'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

export function RevenueBarChart({ data }: { data: { outlet: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="outlet"
          tickFormatter={(v: string) => v.replace('Outlet ', 'O')}
          tick={{ fontSize: 11, fill: 'var(--color-fg-muted)' }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tickFormatter={(v: number) => `$${v}`}
          tick={{ fontSize: 11, fill: 'var(--color-fg-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
          contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', fontSize: 12 }}
          cursor={{ fill: 'var(--color-accent-soft)' }}
        />
        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="var(--color-accent)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
