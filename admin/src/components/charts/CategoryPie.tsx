'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#f15a24', '#e0a04b', '#7c8467', '#3b82f6', '#9a6cf1', '#16a34a', '#ef4444'];

export function CategoryPie({ data }: { data: { category: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="revenue"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number, name) => [`$${v.toLocaleString()}`, name as string]}
          contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
