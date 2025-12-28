import { useEffect, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import apiClient from '../lib/apiClient';

interface ConversionStats {
  funnel: { stage: string; value: number }[];
  history: { date: string; val: number }[];
  reasons: { label: string; value: number }[];
}

const ConversionPage = () => {
  const { timeframe } = useTimeframe();
  const [data, setData] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/api/dashboard/analytics/conversion');
        if (data) setData(data as ConversionStats);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const funnel = data?.funnel || [];
  const sessions = data?.history || [];
  const reasons = data?.reasons || [];

  if (loading) return <div style={{ padding: 20 }}>Lade Konversions-Daten...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Konversion & Abbrüche"
        subtitle={`Trichter, Abbruchgründe und Verlauf · ${timeframe}`}
        actions={
          <>
            <Button variant="secondary" size="sm">Export</Button>
            <Button variant="primary" size="sm">Bericht erstellen</Button>
          </>
        }
      />

      <Card title="Trichter" subtitle="Besucher bis Bestellung">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {funnel.map((s, idx) => (
            <Card key={s.stage}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{s.stage}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: 6 }}>
                <div
                  style={{
                    width: `${Math.max(20, 100 - idx * 25)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2563eb, #8b5cf6)'
                  }}
                />
              </div>
            </Card>
          ))}
          {funnel.length === 0 && <div>Keine Daten</div>}
        </div>
      </Card>

      <Card title="Verlauf Sitzungen / abgeschlossene Bestellungen">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, color: 'var(--muted)', fontSize: 12 }}>
            <Badge variant="neutral">Sitzungen</Badge>
            <Badge variant="warning">Bestellungen</Badge>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
            {sessions.length === 0 && <div style={{ color: 'var(--muted)', alignSelf: 'center' }}>Keine Historie verfügbar</div>}
            {sessions.map((d) => (
              <div key={d.date} style={{ flex: 1 }}>
                {d.date}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Top Abbruchgründe" subtitle="Anteil in %">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reasons.length === 0 && <div style={{ color: 'var(--muted)' }}>Keine Daten</div>}
          {reasons.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 200, color: 'var(--muted)', fontSize: 13 }}>{r.label}</div>
              <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${r.value}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #f97316, #ef4444)'
                  }}
                />
              </div>
              <div style={{ width: 50, textAlign: 'right', color: 'var(--muted)', fontSize: 13 }}>{r.value}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ConversionPage;
