import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface TopCustomer {
  name: string;
  revenue: string;
  orders: number;
  change: number;
  avatar: string;
}

interface TopCustomersProps {
  customers: TopCustomer[];
}

export function TopCustomers({ customers }: TopCustomersProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h3 className="text-foreground">Top Kunden</h3>
          <p className="text-sm text-muted-foreground mt-1">Diese Woche</p>
        </div>
        <TrendingUp className="w-5 h-5 text-[var(--status-success)]" />
      </div>
      <div className="space-y-4 overflow-y-auto flex-1">
        {customers.map((customer, index) => (
          <div 
            key={index}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--status-processing-bg)] text-[var(--status-processing-fg)] flex items-center justify-center font-semibold">
              {customer.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground group-hover:text-[var(--status-processing)] transition-colors">
                {customer.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {customer.orders} Bestellungen
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">
                {customer.revenue}
              </div>
              <div className={`text-sm flex items-center gap-1 justify-end ${
                customer.change > 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-error)]'
              }`}>
                <ArrowUpRight className="w-3 h-3" />
                {customer.change}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}