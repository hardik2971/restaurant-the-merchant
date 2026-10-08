'use client';

import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Segment {
  label: string;
  value: number;
  color: string;
}

export function EmployeeGauge({ segments, total }: { segments: Segment[]; total: number }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={segments}
            dataKey="value"
            startAngle={180}
            endAngle={0}
            cx="50%"
            cy="95%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
          >
            {segments.map((s) => (
              <Cell key={s.label} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <p className="font-display text-2xl font-semibold leading-none">{total}</p>
        <p className="text-[11px] text-fg-muted">Employees</p>
      </div>
    </div>
  );
}
