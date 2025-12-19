import { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const inventoryData = [
  { sku: 'BREM-2440', name: 'Bremsbelag Set', stock: 120, free: 90, reserved: 18, inTransit: 12, days: 34, warn: 'Niedrigpreis prüfen' },
  { sku: 'FILTER-900', name: 'Ölfilter Longlife', stock: 340, free: 280, reserved: 40, inTransit: 20, days: 12, warn: 'Hoher Bestand' },
  { sku: 'RADLAGER-77', name: 'Radlager VA', stock: 60, free: 42, reserved: 8, inTransit: 10, days: 95, warn: 'Slow Mover' },
  { sku: 'BATT-AGM60', name: 'Starterbatterie AGM 60Ah', stock: 18, free: 12, reserved: 2, inTransit: 4, days: 180, warn: 'Dead Stock' },
  { sku: 'WISCH-SET2', name: 'Wischerblätter Set', stock: 220, free: 190, reserved: 18, inTransit: 12, days: 48, warn: 'OK' },
  { sku: 'OEL-5W30', name: 'Motoröl 5W30 5L', stock: 90, free: 70, reserved: 10, inTransit: 10, days: 22, warn: 'Preis anheben' },
  { sku: 'FEDER-VA1', name: 'Federbein VA', stock: 32, free: 20, reserved: 4, inTransit: 8, days: 130, warn: 'Slow Mover' },
  { sku: 'LAMP-H7', name: 'H7 Glühlampe 2er', stock: 410, free: 360, reserved: 22, inTransit: 28, days: 16, warn: 'OK' }
];

const InventoryPage = () => {
  const { timeframe } = useTimeframe();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'alle' | 'risiko' | 'slow'>('alle');

  const filtered = useMemo(() => {
    return inventoryData
      .filter((i) =>
        (i.sku + i.name).toLowerCase().includes(search.trim().toLowerCase())
      )
      .filter((i) => {
        if (filter === 'risiko') return i.warn === 'Dead Stock' || i.warn === 'Slow Mover';
        if (filter === 'slow') return i.days > 60;
        return true;
      });
  }, [search, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Lagerübersicht"
        subtitle={`Bestände, Bewegungen und Warnungen · ${timeframe}`}
        actions={
          <>
            <Button variant="secondary" size="sm">Export</Button>
            <Button variant="primary" size="sm">Neuen Artikel anlegen</Button>
          </>
        }
      />

      <Card>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <Input
            placeholder="Suchen (SKU, Artikel, Hersteller)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 260, flex: 1 }}
          />
          <select
            className="topbar-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{ minWidth: 160 }}
          >
            <option value="alle">Alle</option>
            <option value="risiko">Risiko / Dead Stock</option>
            <option value="slow">Liegedauer &gt; 60 Tage</option>
          </select>
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilter('alle'); }}>
            Filter zurücksetzen
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Gesamtbestand</div><div style={{ fontSize: 22, fontWeight: 800 }}>1.290 Stk</div></Card>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Kapitalwert (Demo)</div><div style={{ fontSize: 22, fontWeight: 800 }}>92.400 €</div></Card>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Slow Mover</div><div style={{ fontSize: 22, fontWeight: 800 }}>3</div></Card>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Dead Stock Kandidaten</div><div style={{ fontSize: 22, fontWeight: 800 }}>1</div></Card>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Artikel</th>
                <th>Bestand</th>
                <th>Frei</th>
                <th>Reserviert</th>
                <th>Unterwegs</th>
                <th>Liegedauer</th>
                <th>Warnung</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.sku} className="table-row">
                  <td>{row.sku}</td>
                  <td>{row.name}</td>
                  <td>{row.stock}</td>
                  <td>{row.free}</td>
                  <td>{row.reserved}</td>
                  <td>{row.inTransit}</td>
                  <td>{row.days} Tage</td>
                  <td>
                    <Badge variant={row.warn === 'OK' ? 'neutral' : 'warning'}>{row.warn}</Badge>
                  </td>
                  <td>
                    <Button size="sm" variant="ghost">Details</Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ color: 'var(--muted)', padding: 12, textAlign: 'center' }}>
                    Keine Treffer für die aktuellen Filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default InventoryPage;
