import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';

const funnel = [
  { stage: 'Besucher', value: 4200 },
  { stage: 'Anfragen gestartet', value: 980 },
  { stage: 'Angebote gesendet', value: 640 },
  { stage: 'Bestellungen', value: 420 }
];

const reasons = [
  { label: 'Lieferzeit zu lang', value: 32 },
  { label: 'Preis zu hoch', value: 24 },
  { label: 'Kompatibilität unklar', value: 18 },
  { label: 'Doppelbestellung', value: 9 },
  { label: 'Qualitätsmangel', value: 6 }
];

const sessions = [
  { date: 'Mo', val: 110 },
  { date: 'Di', val: 98 },
  { date: 'Mi', val: 120 },
  { date: 'Do', val: 134 },
  { date: 'Fr', val: 142 },
  { date: 'Sa', val: 90 },
  { date: 'So', val: 76 }
];

const ConversionPage = () => {
  const { timeframe } = useTimeframe();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Konversion & Abbrüche"
        subtitle={`Trichter, Abbruchgründe und Verlauf · ${timeframe}`}
        actions={
          <>
            <Button variant="secondary" size="sm">Export</Button>
            <Button variant="primary" size="sm">Bericht erstellen (Demo)</Button>
          </>
        }
      />

      <Card title="Trichter" subtitle="Besucher bis Bestellung (Demo)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {funnel.map((s, idx) => (
            <Card key={s.stage}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{s.stage}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: 6 }}>
                <div
                  style={{
                    width: `${Math.max(20, 100 - idx * 18)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2563eb, #8b5cf6)'
                  }}
                />
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card title="Verlauf Sitzungen / abgeschlossene Bestellungen">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, color: 'var(--muted)', fontSize: 12 }}>
            <Badge variant="neutral">Sitzungen</Badge>
            <Badge variant="warning">Bestellungen (Demo)</Badge>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {sessions.map((d, idx) => (
              <div key={d.date} style={{ flex: 1 }}>
                <div
                  style={{
                    height: d.val,
                    background: 'linear-gradient(180deg, rgba(59,130,246,0.8), rgba(59,130,246,0.15))',
                    borderRadius: 8
                  }}
                />
                <div
                  style={{
                    height: Math.max(6, (d.val / 150) * 40),
                    marginTop: 4,
                    background: 'linear-gradient(180deg, rgba(234,179,8,0.8), rgba(234,179,8,0.15))',
                    borderRadius: 8
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>{d.date}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Top Abbruchgründe" subtitle="Anteil in % (Demo)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
