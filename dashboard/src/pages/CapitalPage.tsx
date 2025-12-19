import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const capitalData = [
  { sku: 'BREM-2440', stock: 120, einstand: '45 €', capital: '5.400 €', days: '120', action: 'B2B-Abverkauf' },
  { sku: 'FILTER-900', stock: 340, einstand: '6 €', capital: '2.040 €', days: '95', action: 'Bundle' },
  { sku: 'RADLAGER-77', stock: 60, einstand: '38 €', capital: '2.280 €', days: '150', action: 'Preis senken' },
  { sku: 'BATT-AGM60', stock: 18, einstand: '110 €', capital: '1.980 €', days: '210', action: 'Lieferant-Rückgabe' },
  { sku: 'WISCH-SET2', stock: 220, einstand: '4 €', capital: '880 €', days: '75', action: 'Bundle' },
  { sku: 'OEL-5W30', stock: 90, einstand: '18 €', capital: '1.620 €', days: '60', action: 'B2B-Abverkauf' }
];

const CapitalPage = () => {
  const { timeframe } = useTimeframe();
  const [planner, setPlanner] = useState<{ open: boolean; sku?: string }>({ open: false });
  const [note, setNote] = useState('');
  const [target, setTarget] = useState('');
  const [actionType, setActionType] = useState('Preis senken');
  const [planStatus, setPlanStatus] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Gebundenes Kapital Radar"
        subtitle={`Slow Mover & Kapitalbindung – Fokus auf Liquidität · ${timeframe}`}
        actions={
          <>
            <Button variant="secondary" size="sm">Export</Button>
            <Button variant="primary" size="sm">Aktionen planen</Button>
          </>
        }
      />

      <Card>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" /> Nur Risiko
          </label>
          <select className="topbar-select" style={{ minWidth: 130 }}>
            <option>30 Tage</option>
            <option>90 Tage</option>
            <option>180 Tage</option>
            <option>365 Tage</option>
          </select>
          <Input placeholder="SKU, Hersteller, Kategorie…" style={{ minWidth: 240, flex: 1 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Im Lager gebunden</div><div style={{ fontSize: 22, fontWeight: 800 }}>72.400 €</div></Card>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Kurzfristig freisetzbar</div><div style={{ fontSize: 22, fontWeight: 800 }}>18.600 €</div></Card>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Dead Stock Kandidaten</div><div style={{ fontSize: 22, fontWeight: 800 }}>9</div></Card>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Artikel / SKU</th>
                <th>Bestand</th>
                <th>Einstand</th>
                <th>Kapitalwert</th>
                <th>Liegedauer</th>
                <th>Empfohlene Aktion</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {capitalData.map((c) => (
                <tr key={c.sku} className="table-row">
                  <td>{c.sku}</td>
                  <td>{c.stock}</td>
                  <td>{c.einstand}</td>
                  <td>{c.capital}</td>
                  <td>{c.days} Tage</td>
                  <td><Badge variant="neutral">{c.action}</Badge></td>
                  <td>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setPlanner({ open: true, sku: c.sku });
                        setPlanStatus(null);
                      }}
                    >
                      Aktion planen
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {planner.open ? (
          <div
            style={{
              marginTop: 12,
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 12,
              background: 'rgba(255,255,255,0.03)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10
            }}
          >
            <div style={{ fontWeight: 800 }}>Plan für {planner.sku}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: 'var(--muted)', fontSize: 12 }}>Aktionstyp</label>
              <select
                className="topbar-select"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
              >
                <option>Preis senken</option>
                <option>Bundle</option>
                <option>B2B-Abverkauf</option>
                <option>Lieferant-Rückgabe</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: 'var(--muted)', fontSize: 12 }}>Zielpreis (€)</label>
              <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="z.B. 14,90" />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: 'var(--muted)', fontSize: 12 }}>Notiz</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{
                  minHeight: 80,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  padding: 10,
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text)'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button
                variant="primary"
                onClick={() => {
                  setPlanStatus('Plan gespeichert (Demo)');
                }}
              >
                Plan speichern (Demo)
              </Button>
              <Button variant="ghost" onClick={() => setPlanner({ open: false })}>
                Schließen
              </Button>
              {planStatus ? <span style={{ color: 'var(--muted)' }}>{planStatus}</span> : null}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default CapitalPage;
