import { StatusChip } from '../components/StatusChip';
import { PageHeader } from '../components/PageHeader';
import { MetricCard } from '../components/MetricCard';
import { DataTable } from '../components/DataTable';
import { RevenueChart } from '../components/RevenueChart';
import { TopCustomers } from '../components/TopCustomers';
import { ActivityFeed } from '../components/ActivityFeed';
import { Button } from '../components/ui/button';
import { Package, MessageSquare, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../api/wws';

interface HeuteViewProps {
  onNavigate: (view: string, filter?: string) => void;
}

// View logic

export function HeuteView({
  onNavigate
}: HeuteViewProps) {
  const { summary, loading: summaryLoading } = useDashboardSummary();
  const { orders, loading: ordersLoading } = useOrders();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Chart data - from summary
  const chartData = summary?.revenueHistory || [];

  // Top customers data
  const topCustomers = summary?.topCustomers?.map(c => ({
    name: c.name,
    revenue: `€${c.revenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
    orders: c.orders,
    change: 0,
    avatar: c.avatar
  })) || [];

  // Activity feed data
  const activities = summary?.activities?.map(a => ({
    ...a,
    time: new Date(a.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  })) || [];

  // Task Cards Data - was heute blockiert oder Geld bringt
  // Render logic

  const columns = [
    {
      key: 'customer',
      header: 'Kunde',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--status-success)]" />
          <span>{order.contact?.name || 'Unbekannter Kunde'}</span>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Fahrzeug',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span>{order.vehicle_json?.make} {order.vehicle_json?.model}</span>
        </div>
      ),
    },
    {
      key: 'oem',
      header: 'OEM-Nummer',
      render: (order: Order) => (
        <code className="px-2 py-1 bg-muted rounded text-xs text-mono">
          {order.oem}
        </code>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: Order) => {
        let status: 'waiting' | 'processing' | 'success' | 'error' = 'processing';
        if (order.status === 'new') status = 'processing';
        else if (order.status === 'collect_part') status = 'waiting';
        else if (order.status === 'done' || order.status === 'invoiced') status = 'success';

        return <StatusChip status={status} label={order.status} size="sm" />;
      },
    },
    {
      key: 'action',
      header: 'Nächste Aktion',
      align: 'right' as const,
      render: (order: Order) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onNavigate('auftraege');
          }}
        >
          {order.status === 'new' ? 'Angebot erstellen' : 'Details'}
        </Button>
      ),
    },
  ];

  if (summaryLoading || ordersLoading) return <div className="p-20 text-center text-muted-foreground">Lade Dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Heute"
        description="Dein aktueller Arbeitsstand aus WhatsApp, Angeboten und Aufträgen"
      />

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="WhatsApp Nachrichten"
          value={summary?.ordersNew.toString() || "0"}
          change={12}
          changeLabel="vs. gestern"
          icon={<MessageSquare className="w-5 h-5" />}
          variant="primary"
        />
        <MetricCard
          label="In Bearbeitung"
          value={summary?.ordersInProgress.toString() || "0"}
          change={2.3}
          changeLabel="vs. letzte Woche"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
        <MetricCard
          label="Offene Belege"
          value={summary?.invoicesDraft.toString() || "0"}
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          label="Umsatz (heute)"
          value={`€${summary?.revenueToday.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
          change={18}
          changeLabel="vs. gestern"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Chart & Current Tasks Combined */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col h-[calc(100vh-220px)]">
            {/* Revenue Chart Section */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-foreground">Umsatz & Bestellungen</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {timeRange === '7d' && 'Letzte 7 Tage'}
                    {timeRange === '30d' && 'Letzte 30 Tage'}
                    {timeRange === '90d' && 'Letzte 90 Tage'}
                    {timeRange === '1y' && 'Letztes Jahr'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Time Range Selector */}
                  <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
                    <button
                      onClick={() => setTimeRange('7d')}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${timeRange === '7d'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      7T
                    </button>
                    <button
                      onClick={() => setTimeRange('30d')}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${timeRange === '30d'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      30T
                    </button>
                    <button
                      onClick={() => setTimeRange('90d')}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${timeRange === '90d'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      90T
                    </button>
                    <button
                      onClick={() => setTimeRange('1y')}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${timeRange === '1y'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Jahr
                    </button>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--status-processing)]"></div>
                      <span className="text-sm text-muted-foreground">Umsatz</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--status-success)]"></div>
                      <span className="text-sm text-muted-foreground">Bestellungen</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[280px] flex items-center justify-center">
                {chartData.length > 0 ? (
                  <RevenueChart data={chartData} />
                ) : (
                  <div className="text-muted-foreground text-sm italic">Keine Umsatzdaten für diesen Zeitraum vorhanden</div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border my-6 flex-shrink-0"></div>

            {/* Current Tasks Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-foreground mb-4">Aktuelle Vorgänge</h3>
              <div className="overflow-auto flex-1">
                <DataTable
                  columns={columns}
                  data={orders.slice(0, 10)}
                  onRowClick={() => onNavigate('auftraege')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Top Customers & Activity Feed */}
        <div className="flex flex-col gap-4 h-[calc(100vh-220px)]">
          <div className="flex-shrink-0 h-[380px]">
            <TopCustomers customers={topCustomers} />
          </div>
          <div className="flex-1 min-h-0">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}