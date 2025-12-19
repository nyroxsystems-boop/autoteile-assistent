import { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const kpiData = [
  { title: 'Vermeidbarer Umsatzverlust', value: '14.800 €', desc: 'letzte 30 Tage' },
  { title: 'Haupttreiber', value: 'Lieferzeit & Kompatibilität', desc: 'Top 2 Ursachen' },
  { title: 'Betroffene SKUs', value: '17', desc: '>10% Abbruch/Retouren' }
];

const causeData = [
  { label: 'Lieferzeit zu lang', value: 38 },
  { label: 'Preis zu hoch', value: 22 },
  { label: 'Kompatibilität unklar', value: 31 },
  { label: 'Doppelbestellung', value: 12 },
  { label: 'Qualitätsmangel', value: 18 }
];

const hotspotData = [
  { sku: 'BREM-2440', cause: 'Lieferzeit zu lang', abbruch: '18%', retouren: '6%', marge: '14%', note: 'Express-Option anbieten' },
  { sku: 'FILTER-900', cause: 'Preis zu hoch', abbruch: '12%', retouren: '3%', marge: '22%', note: 'Bundle mit Öl filter' },
  { sku: 'RADLAGER-77', cause: 'Kompatibilität unklar', abbruch: '15%', retouren: '5%', marge: '19%', note: 'Kompatibilitätstext ergänzen' },
  { sku: 'BATT-AGM60', cause: 'Doppelbestellung', abbruch: '9%', retouren: '8%', marge: '11%', note: 'Warenkorb-Prüfung verstärken' },
  { sku: 'WISCH-SET2', cause: 'Qualitätsmangel', abbruch: '6%', retouren: '10%', marge: '24%', note: 'Lieferant prüfen' },
  { sku: 'OEL-5W30', cause: 'Preis zu hoch', abbruch: '7%', retouren: '2%', marge: '17%', note: 'Preisstaffel prüfen' }
];

const ForensicsPage = () => {
  const { timeframe } = useTimeframe();
  const [selected, setSelected] = useState<string[]>([]);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const allSelected = selected.length === hotspotData.length;
  const toggleAll = () => setSelected(allSelected ? [] : hotspotData.map((h) => h.sku));
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const detail = useMemo(() => hotspotData.find((h) => h.sku === detailsId) ?? hotspotData[0], [detailsId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Forensik"
        subtitle={`Abbruch- & Retourenursachen – Treiber, Hotspots und Maßnahmen · ${timeframe}`}
        actions={
          <>
            <Button variant="secondary" size="sm">Export</Button>
            <Button variant="primary" size="sm">Bericht erstellen (Demo)</Button>
          </>
        }
      />

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {kpiData.map((k) => (
            <Card key={k.title}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{k.title}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{k.value}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{k.desc}</div>
            </Card>
          ))}
        </div>
      </Card>

      <Card title="Abbruch- & Retourenursachen">
        <CauseBarChart data={causeData} />
      </Card>

      <Card title="Hotspots (SKU × Ursache)">
        {selected.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{selected.length} markiert</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="secondary">Markierte analysieren</Button>
              <Button size="sm" variant="ghost">Als Aufgabe speichern</Button>
            </div>
          </div>
        ) : null}
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Alle auswählen" /></th>
                <th>SKU / Artikel</th>
                <th>Ursache</th>
                <th>Abbruchrate</th>
                <th>Retourenquote</th>
                <th>Ø Marge</th>
                <th>Empfehlung</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {hotspotData.map((h) => (
                <tr key={h.sku} className="table-row">
                  <td><input type="checkbox" checked={selected.includes(h.sku)} onChange={() => toggle(h.sku)} aria-label={`${h.sku} auswählen`} /></td>
                  <td>{h.sku}</td>
                  <td><Badge variant="neutral">{h.cause}</Badge></td>
                  <td>{h.abbruch}</td>
                  <td>{h.retouren}</td>
                  <td>{h.marge}</td>
                  <td style={{ color: 'var(--muted)' }}>{h.note}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDetailsId(h.sku);
                        setToast('Vorgemerkt (Demo)');
                      }}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {detail ? (
          <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 12, padding: 10 }}>
            <div style={{ fontWeight: 800 }}>{detail.sku}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Timeline (Demo): letzte 7 Events</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <Badge variant="warning">Ursache: {detail.cause}</Badge>
              <Badge variant="neutral">Nachrichten: 3</Badge>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" size="sm" onClick={() => setToast('Vorgemerkt (Demo)')}>Empfehlung übernehmen</Button>
              <Button variant="ghost" size="sm">Später</Button>
            </div>
          </div>
        ) : null}
      </Card>

      {toast ? (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
          {toast}
          <button
            onClick={() => setToast(null)}
            style={{ marginLeft: 10, background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
};

const CauseBarChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 160, color: 'var(--muted)', fontSize: 13 }}>{d.label}</div>
          <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.round((d.value / max) * 100)}%`,
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #2563eb, #22c55e)'
              }}
            />
          </div>
          <div style={{ width: 40, textAlign: 'right', color: 'var(--muted)', fontSize: 13 }}>{d.value}%</div>
        </div>
      ))}
    </div>
  );
};

export default ForensicsPage;
