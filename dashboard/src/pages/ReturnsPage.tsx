import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const returnData = [
  { id: 'R-1021', sku: 'BREM-2440', reason: 'Lieferzeit zu lang', status: 'Neu', amount: '129 €', age: '2d', channel: 'WhatsApp' },
  { id: 'R-1022', sku: 'FILTER-900', reason: 'Falscher Artikel', status: 'Geprüft', amount: '22 €', age: '1d', channel: 'Shop' },
  { id: 'R-1023', sku: 'BATT-AGM60', reason: 'Qualitätsmangel', status: 'Übermittelt', amount: '119 €', age: '4d', channel: 'Telefon' },
  { id: 'R-1024', sku: 'RADLAGER-77', reason: 'Doppelbestellung', status: 'Neu', amount: '78 €', age: '3d', channel: 'Shop' },
  { id: 'R-1025', sku: 'OEL-5W30', reason: 'Preis zu hoch', status: 'Fehler', amount: '45 €', age: '5d', channel: 'WhatsApp' },
  { id: 'R-1026', sku: 'WISCH-SET2', reason: 'Kompatibilität unklar', status: 'Geprüft', amount: '18 €', age: '2d', channel: 'Shop' }
];

const ReturnsPage = () => {
  const { timeframe } = useTimeframe();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Retouren"
        subtitle={`Status, Gründe und Kanäle · ${timeframe}`}
        actions={
          <>
            <Button variant="secondary" size="sm">Export</Button>
            <Button variant="primary" size="sm">Neue RMA (Demo)</Button>
          </>
        }
      />

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Retourenquote</div><div style={{ fontSize: 22, fontWeight: 800 }}>3,8 %</div></Card>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Offene RMAs</div><div style={{ fontSize: 22, fontWeight: 800 }}>6</div></Card>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Ø Bearbeitungszeit</div><div style={{ fontSize: 22, fontWeight: 800 }}>2,4 Tage</div></Card>
          <Card><div style={{ color: 'var(--muted)', fontSize: 12 }}>Erstattete Summe</div><div style={{ fontSize: 22, fontWeight: 800 }}>1.180 €</div></Card>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>Grund</th>
                <th>Status</th>
                <th>Betrag</th>
                <th>Alter</th>
                <th>Kanal</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {returnData.map((r) => (
                <tr key={r.id} className="table-row">
                  <td>{r.id}</td>
                  <td>{r.sku}</td>
                  <td>{r.reason}</td>
                  <td><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                  <td>{r.amount}</td>
                  <td>{r.age}</td>
                  <td>{r.channel}</td>
                  <td><Button size="sm" variant="ghost">Details</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

function statusVariant(status: string): 'danger' | 'neutral' | 'warning' | 'success' {
  if (status === 'Neu') return 'warning';
  if (status === 'Geprüft') return 'neutral';
  if (status === 'Übermittelt') return 'success';
  if (status === 'Fehler') return 'danger';
  return 'neutral';
}

export default ReturnsPage;
