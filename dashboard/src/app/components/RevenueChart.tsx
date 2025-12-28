import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--status-processing)" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="var(--status-processing)" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--status-success)" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="var(--status-success)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `€${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '12px',
          }}
          labelStyle={{
            color: 'hsl(var(--foreground))',
            fontWeight: 600,
            marginBottom: '8px',
          }}
          itemStyle={{
            color: 'hsl(var(--muted-foreground))',
            fontSize: '14px',
          }}
          formatter={(value: number, name: string) => [
            name === 'revenue' ? `€${value}` : value,
            name === 'revenue' ? 'Umsatz' : 'Bestellungen'
          ]}
        />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stroke="var(--status-processing)" 
          strokeWidth={2}
          fill="url(#colorRevenue)" 
        />
        <Area 
          type="monotone" 
          dataKey="orders" 
          stroke="var(--status-success)" 
          strokeWidth={2}
          fill="url(#colorOrders)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}