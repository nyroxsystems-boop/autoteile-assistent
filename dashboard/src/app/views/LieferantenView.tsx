import { useSuppliers } from '../hooks/useSuppliers';
import { StatusChip } from '../components/StatusChip';
import { MetricCard } from '../components/MetricCard';
import { Store, Clock, TrendingUp } from 'lucide-react';

export function LieferantenView() {
  const { suppliers, loading, error } = useSuppliers();

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'active':
        return 'success' as const;
      case 'degraded':
      case 'warning':
        return 'waiting' as const;
      case 'offline':
      case 'disabled':
        return 'error' as const;
      default:
        return 'waiting' as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'active':
        return 'Online';
      case 'degraded':
      case 'warning':
        return 'Eingeschränkt';
      case 'offline':
      case 'disabled':
        return 'Offline';
      default:
        return status;
    }
  };

  if (loading) return <div className="p-20 text-center text-muted-foreground">Lade Lieferanten...</div>;
  if (error) return <div className="p-20 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Lieferanten</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Shop-API Verbindungen und Verfügbarkeit
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          label="Aktive Lieferanten"
          value={suppliers.filter(s => s.status?.toLowerCase() === 'online' || s.status?.toLowerCase() === 'active').length}
          icon={<Store className="w-5 h-5" />}
          variant="success"
        />
        <MetricCard
          label="Ø Zuverlässigkeit"
          value={suppliers.length > 0
            ? (suppliers.reduce((acc, s) => acc + (parseFloat(s.rating) || 5.0), 0) / suppliers.length * 20).toFixed(1) + "%"
            : "100%"}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="primary"
        />
        <MetricCard
          label="Anzahl Gesamt"
          value={suppliers.length}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Lieferant
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Typ
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Status
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Zuletzt Gesehen
                </th>
                <th className="text-right px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Zuverlässigkeit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="hover:bg-muted/30 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="px-2.5 py-1 bg-muted rounded-md text-sm font-medium w-fit">
                      {supplier.api_type || 'Manuell'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip
                      status={getStatusVariant(supplier.status || 'online')}
                      label={getStatusLabel(supplier.status || 'online')}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{supplier.lastUpdate || 'Heute'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold
                      ${(parseFloat(supplier.rating) || 5.0) >= 4.5
                        ? 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border border-[var(--status-success-border)]'
                        : (parseFloat(supplier.rating) || 5.0) >= 4.0
                          ? 'bg-[var(--status-processing-bg)] text-[var(--status-processing-fg)] border border-[var(--status-processing-border)]'
                          : 'bg-[var(--status-waiting-bg)] text-[var(--status-waiting-fg)] border border-[var(--status-waiting-border)]'
                      }
                    `}>
                      {(parseFloat(supplier.rating) * 20).toFixed(0)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
        <p className="text-muted-foreground leading-relaxed">
          Shop-APIs werden alle 2 Minuten aktualisiert. Bei Verbindungsproblemen wird automatisch auf alternative Lieferanten ausgewichen.
        </p>
      </div>
    </div>
  );
}