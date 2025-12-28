import { useEffect, useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import { Product, ProductService } from '../services/productService';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import { useNavigate } from 'react-router-dom';

const InventoryPage = () => {
  const { timeframe } = useTimeframe();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'alle' | 'risiko' | 'slow'>('alle');

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await ProductService.listProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (action: 'add' | 'remove', quantity: number) => {
    if (!selectedProduct) return;
    try {
      await ProductService.adjustStock(selectedProduct.pk, action, quantity);
      await loadData(); // Reload to see updates
    } catch (err) {
      alert('Fehler beim Buchen der Lagerbewegung.');
      console.error(err);
    }
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const filtered = useMemo(() => {
    return products
      .filter((i) =>
        (i.name + (i.IPN || '')).toLowerCase().includes(search.trim().toLowerCase())
      )
      .filter((i) => {
        if (filter === 'risiko') return (i.stock || 0) === 0; // Simple Logic for now
        return true;
      });
  }, [products, search, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Lagerübersicht"
        subtitle={`Bestände & Bewegungen (Live) · ${timeframe}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={loadData}>Refresh</Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/products/new')}>Neuen Artikel anlegen</Button>
          </>
        }
      />

      {/* KPI Cards (Premium) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <Card className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2 }}>Gesamtbestand</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: '#fff', letterSpacing: -0.5 }}>
            {products.reduce((acc, p) => acc + (p.stock || 0), 0).toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6, letterSpacing: 0 }}>Stk</span>
          </div>
        </Card>
        <Card className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ color: '#34D399', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2 }}>Bestandswert (Est.)</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: '#34D399', letterSpacing: -0.5 }}>
            € {products.reduce((acc, p) => acc + ((p.stock || 0) * 45), 0).toLocaleString()}
          </div>
        </Card>
        <Card className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(244, 63, 94, 0.05) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
          <div style={{ color: '#FB7185', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2 }}>Kritischer Bestand</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: '#FB7185', letterSpacing: -0.5 }}>
            {products.filter(p => (p.stock || 0) <= 2).length} <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.8, letterSpacing: 0 }}>Artikel</span>
          </div>
        </Card>
      </div>

      {/* Premium Table */}
      <Card style={{ border: 'none', background: 'transparent', padding: 0 }}>
        {/* Search Bar */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 16,
          background: 'var(--bg-panel)', padding: 8, paddingLeft: 16,
          borderRadius: 12, border: '1px solid var(--border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Input
            placeholder="🔍 Suche nach OE-Nr, Hersteller, Artikel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 320, flex: 1, background: 'transparent', border: 'none', fontSize: 15, boxShadow: 'none' }}
          />
          <div style={{ width: 1, background: 'var(--border)', margin: '4px 0' }} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, paddingRight: 16 }}
          >
            <option value="alle">Alle Artikel</option>
            <option value="risiko">Bestandskritisch</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto', background: 'var(--bg-panel)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ padding: '18px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Artikel / Hersteller</th>
                <th style={{ padding: '18px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>OE-Nummer / IPN</th>
                <th style={{ padding: '18px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Lagerort</th>
                <th style={{ padding: '18px', textAlign: 'right', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Bestand</th>
                <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted">Lade Premium Inventar...</td></tr>
              ) : filtered.map((row) => (
                <tr key={row.pk} className="table-row hover:bg-white/5 transition-all text-sm">
                  <td style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{row.name}</div>
                    {row.manufacturer && (
                      <Badge variant="neutral" style={{ fontSize: 10, padding: '2px 8px', letterSpacing: 0.5, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: 'var(--text)' }}>
                        {row.manufacturer.toUpperCase()}
                      </Badge>
                    )}
                  </td>
                  <td style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--primary)', letterSpacing: -0.2, fontWeight: 500 }}>
                      {row.oe_number || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>IPN: {row.IPN || '-'}</div>
                  </td>
                  <td style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                    {row.location || '—'}
                  </td>
                  <td style={{ padding: '16px 18px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: (row.stock || 0) > 0 ? 'var(--text)' : '#F43F5E' }}>
                      {row.stock || 0}
                    </div>
                  </td>
                  <td style={{ padding: '16px 18px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>
                    <Button size="sm" variant="secondary" onClick={() => openStockModal(row)} style={{ marginRight: 8 }}>Bestand</Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/products/${row.pk}`)}>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedProduct && (
        <StockAdjustmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleStockAdjustment}
          productName={selectedProduct.name}
          currentStock={selectedProduct.stock || 0}
        />
      )}
    </div>
  );
};

export default InventoryPage;
