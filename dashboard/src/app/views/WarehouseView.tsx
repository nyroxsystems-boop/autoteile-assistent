
import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { Package, AlertTriangle, ArrowDownRight, Search, Filter } from 'lucide-react';
import { StatusChip } from '../components/StatusChip';

interface Part {
  id: number;
  name: string;
  IPN: string;
  description: string;
  total_in_stock: number;
  minimum_stock: number;
  category_name?: string;
  image?: string;
}

export function WarehouseView() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    setLoading(true);
    try {
      // InvenTree Part API
      const data = await apiFetch<Part[]>('/part/');
      setParts(data);
    } catch (err) {
      console.error('Failed to load parts', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = parts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.IPN?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = parts.filter(p => p.total_in_stock < p.minimum_stock).length;

  return (
    <div className="space-y-6">
      <div>
        <h1>Warenwirtschaft</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Bestandsübersicht aus InvenTree ERP
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          label="Artikel insgesamt"
          value={parts.length}
          icon={<Package className="w-5 h-5" />}
        />
        <MetricCard
          label="Niedriger Bestand"
          value={lowStockCount}
          variant={lowStockCount > 0 ? 'error' : 'success'}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <MetricCard
          label="Gesamtwert"
          value="-- €"
          icon={<ArrowDownRight className="w-5 h-5" />}
        />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full bg-muted/30 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary"
              placeholder="Suchen nach Name oder IPN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={loadParts}>
            Aktualisieren
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="px-6 py-4">Part / SKU</th>
                <th className="px-6 py-4">Beschreibung</th>
                <th className="px-6 py-4">Bestand</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Lade Bestandsdaten...</td></tr>
              ) : filteredParts.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Keine Artikel gefunden.</td></tr>
              ) : filteredParts.map(part => (
                <tr key={part.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{part.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{part.IPN || `#${part.id}`}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {part.description}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{part.total_in_stock}</span>
                      <span className="text-xs text-muted-foreground">/ Min: {part.minimum_stock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StatusChip
                      status={part.total_in_stock < part.minimum_stock ? 'error' : 'success'}
                      label={part.total_in_stock < part.minimum_stock ? 'Bestellen' : 'Lagernd'}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Minimal button fallback if not imported correctly
function Button({ children, variant, size, onClick, className }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${variant === 'outline' ? 'border border-border hover:bg-muted' : 'bg-primary text-white'} ${className}`}
    >
      {children}
    </button>
  );
}