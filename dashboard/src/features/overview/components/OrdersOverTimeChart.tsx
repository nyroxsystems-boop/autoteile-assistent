import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export type ChartPoint = { date: string; value: number };

type Props = {
  data: ChartPoint[];
};

const OrdersOverTimeChart: React.FC<Props> = ({ data }) => {
  const safeData = data?.length ? data : [{ date: '–', value: 0 }];

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={safeData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f8bff" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#4f8bff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="var(--muted)" tickLine={false} />
          <YAxis stroke="var(--muted)" tickLine={false} width={40} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-panel)',
              border: `1px solid var(--border)`,
              borderRadius: 10
            }}
            labelStyle={{ color: 'var(--muted)' }}
            formatter={(value: number) => [value, 'Bestellungen']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#4f8bff"
            strokeWidth={2.5}
            fill="url(#ordersGradient)"
            dot={{ r: 3, stroke: '#4f8bff', fill: '#fff' }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrdersOverTimeChart;
