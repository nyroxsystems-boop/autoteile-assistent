import React from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { ChartPoint } from './OrdersOverTimeChart';

type Props = {
  data: ChartPoint[];
};

const ConversionRateChart: React.FC<Props> = ({ data }) => {
  const safeData = data?.length ? data : [{ date: '–', value: 0 }];

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <LineChart data={safeData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="var(--muted)" tickLine={false} />
          <YAxis stroke="var(--muted)" tickLine={false} width={50} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-panel)',
              border: `1px solid var(--border)`,
              borderRadius: 10
            }}
            labelStyle={{ color: 'var(--muted)' }}
            formatter={(value: number) => [`${value.toFixed(0)}%`, 'Conversion']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#a855f7"
            strokeWidth={2.5}
            dot={{ r: 3, stroke: '#a855f7', fill: '#fff' }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConversionRateChart;
