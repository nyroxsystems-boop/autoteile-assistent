import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOrders } from '../api/orders';
import { fetchOverviewStats, type OverviewStats } from '../api/stats';
import type { Order } from '../api/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import OrdersOverTimeChart from '../features/overview/components/OrdersOverTimeChart';
import ConversionRateChart from '../features/overview/components/ConversionRateChart';
import PageHeader from '../ui/PageHeader';
import { useTimeframe } from '../features/timeframe/TimeframeContext';
import BotHealthWidget from '../components/BotHealthWidget';

type RecItem = {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  rationale: string;
};

const recItems: RecItem[] = [
  { id: 'rec1', severity: 'high', title: 'Dead-Stock 90T+ abbauen', rationale: '12 SKUs > 90 Tage, Kapital 14.200 €' },
  { id: 'rec2', severity: 'medium', title: 'Marge bei Bremsbelägen anheben', rationale: 'Ø Marge 11% vs Ziel 18% (SKU-Set 2440)' },
  { id: 'rec3', severity: 'high', title: 'Retouren DHL Nord reduzieren', rationale: 'Abbruchrate +18% bei Lieferzeit >3 Tage' },
  { id: 'rec4', severity: 'low', title: 'Bundle Öl + Filter testen', rationale: 'Warenkorb +12%, Retouren -4% (Demo)' },
  { id: 'rec5', severity: 'medium', title: 'Kompatibilitäts-Hinweise ergänzen', rationale: '20% Abbruchgrund: Kompatibilität unklar' }
];

const OverviewPage = () => {
  const { timeframe } = useTimeframe();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dismissedRecs, setDismissedRecs] = useState<string[]>([]);

  const isStatsLoading = !stats && !error;

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await fetchOverviewStats(timeframe);
        setStats(result);
      } catch (err) {
        console.error('[OverviewPage] Fehler beim Laden der Statistiken', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    };

    loadStats();
  }, [timeframe]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await listOrders();
        setOrders(data);
      } catch (err) {
        console.error('[OverviewPage] Fehler beim Laden der Bestellungen', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    };

    loadOrders();
  }, []);

  const buckets = useMemo(() => buildOrderBuckets(timeframe, orders), [timeframe, orders]);
  const ordersSeries = useMemo(() => buckets.map((b) => b.orders.length), [buckets]);
  const doneSeries = useMemo(
    () =>
      buckets.map((b) =>
        b.orders.filter((o) => {
          const s = String(o.status ?? '').toLowerCase();
          return s.includes('done') || s.includes('show_offers') || s.includes('complete');
        }).length
      ),
    [buckets]
  );
  const conversionSeries = useMemo(
    () =>
      buckets.map((_, idx) => {
        const done = doneSeries[idx] ?? 0;
        const total = (ordersSeries[idx] ?? 0) || 1;
        return Math.round((done / total) * 100);
      }),
    [doneSeries, ordersSeries]
  );

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date((b as any)?.created_at ?? b.createdAt ?? 0).getTime() - new Date((a as any)?.created_at ?? a.createdAt ?? 0).getTime())
      .slice(0, 5);
  }, [orders]);

  const activeRecs = recItems.filter((r) => !dismissedRecs.includes(r.id)).slice(0, 3);

  const normalizeValue = (value: string | number | null | undefined) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Übersicht"
        subtitle="Cockpit – wichtigste KPIs, Empfehlungen und Vorschaumodule."
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button as={Link} to="/recommendations" variant="secondary" size="sm">
              Alle Empfehlungen
            </Button>
            <Button as={Link} to="/insights/forensics" variant="ghost" size="sm">
              Forensik öffnen
            </Button>
          </div>
        }
      />

      <BotHealthWidget />

      {error ? (
        <Card>
          <div style={{ color: 'var(--text)' }}>
            <strong>Fehler:</strong> {error}
          </div>
        </Card>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}
      >
        {isStatsLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx}>
                <div className="skeleton-row" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="skeleton-block" style={{ height: 14 }} />
                  <div className="skeleton-block" style={{ height: 20, width: '60%' }} />
                  <div className="skeleton-block" style={{ height: 12, width: '80%' }} />
                </div>
              </Card>
            ))
          : (
            <>
              <KpiCard title="Offene Bestellungen (OEM)" value={orders.filter((o) => ['not_found', 'multiple_matches'].includes((o as any)?.part?.oemStatus)).length} description="Offene oder problematische OEM-Ermittlung." />
              <KpiCard title="Empfangene Nachrichten" value={stats?.incomingMessages ?? '–'} description="Eingehende WhatsApp-Nachrichten im Zeitraum." />
              <KpiCard title="Abgebrochene Bestellungen" value={stats?.abortedOrders ?? '–'} description="Begonnene, aber nicht abgeschlossene Vorgänge." />
              <KpiCard title="Ø Marge" value={`${stats?.averageMargin ?? '–'} %`} description="Mittelwert der angewendeten Marge pro Bestellung." />
            </>
          )}
      </div>

      <Card
        title="PartsBot Empfehlungen (Top 3)"
        subtitle="Heute priorisiert – basierend auf Anfragen, Abbrüchen, Lager & Marge"
        actions={
          <Button as={Link} to="/recommendations" variant="primary" size="sm">
            Alle Empfehlungen
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeRecs.map((rec) => (
            <div
              key={rec.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 10,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 8,
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background:
                      rec.severity === 'high' ? '#ef4444' : rec.severity === 'medium' ? '#f59e0b' : '#22c55e'
                  }}
                />
                <div>
                  <div style={{ fontWeight: 800 }}>{rec.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{rec.rationale}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setToast('Vorgemerkt (Demo)')}
                >
                  Anwenden
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setToast('Erinnerung: morgen (Demo)')}
                >
                  Später
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDismissedRecs((prev) => [...prev, rec.id])}
                >
                  Ignorieren
                </Button>
              </div>
            </div>
          ))}
          {activeRecs.length === 0 ? <div style={{ color: 'var(--muted)' }}>Alle Empfehlungen wurden verarbeitet.</div> : null}
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 14
        }}
      >
        <Card
          title="Vermeidbarer Umsatzverlust"
          subtitle="Kurzvorschau Forensik"
          actions={<Button as={Link} to="/insights/forensics" variant="ghost" size="sm">Zu Forensik</Button>}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>14.800 €</div>
            <Badge variant="warning">Haupttreiber: Lieferzeit</Badge>
          </div>
          <MiniSparkline />
          <div style={{ color: 'var(--muted)', marginTop: 8, fontSize: 13 }}>Hotspots Vorschau · {timeframe}</div>
        </Card>
        <Card
          title="Gebundenes Kapital"
          subtitle="Kurzvorschau Kapital-Radar"
          actions={<Button as={Link} to="/inventory/capital" variant="ghost" size="sm">Zum Kapital-Radar</Button>}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>72.400 €</div>
            <Badge variant="neutral">Risiko-SKUs: 9</Badge>
          </div>
          <MiniSparkline variant="green" />
          <div style={{ color: 'var(--muted)', marginTop: 8, fontSize: 13 }}>Liegedauer-Fokus · {timeframe}</div>
        </Card>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 14
        }}
      >
        <Card title="Bestellungen im Zeitraum" subtitle={`Zeitleiste · ${timeframe}`} padded>
          <OrdersOverTimeChart data={buckets.map((b, idx) => ({ date: b.label, value: ordersSeries[idx] ?? 0 }))} />
        </Card>
        <Card title="Konversionsrate" subtitle={`Abschlussrate · ${timeframe}`} padded>
          <ConversionRateChart data={buckets.map((b, idx) => ({ date: b.label, value: conversionSeries[idx] ?? 0 }))} />
        </Card>
      </div>

      <Card
        title="Aktuelle Bestellungen (Kurzliste)"
        subtitle="Auszug · maximal 5 Zeilen"
        actions={<Button as={Link} to="/orders" variant="ghost" size="sm">Alle Bestellungen</Button>}
      >
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Erstellt</th>
                <th>Wert (€)</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="table-row">
                  <td>{o.id}</td>
                  <td><Badge variant="neutral">{String(o.status ?? '–')}</Badge></td>
                  <td>{formatDate((o as any)?.created_at ?? o.createdAt)}</td>
                  <td>{normalizeValue((o as any)?.total ?? 0)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--muted)', padding: 12, textAlign: 'center' }}>
                    Keine Bestellungen im gewählten Zeitraum.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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

const KpiCard = ({ title, value, description }: { title: string; value: string | number; description: string }) => {
  return (
    <Card className="kpi-card" padded>
      <div style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-strong)' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{description}</div>
    </Card>
  );
};

const MiniSparkline = ({ variant = 'blue' }: { variant?: 'blue' | 'green' }) => {
  const stroke = variant === 'blue' ? '#3b82f6' : '#10b981';
  const fill = variant === 'blue' ? 'rgba(59,130,246,0.18)' : 'rgba(16,185,129,0.18)';
  const points = variant === 'blue' ? '0,40 30,45 60,30 90,50 120,28 150,52 180,24' : '0,50 30,42 60,38 90,44 120,36 150,40 180,34';
  return (
    <svg width="100%" height="70" viewBox="0 0 180 70" preserveAspectRatio="none" role="img" aria-label="Sparkline">
      <defs>
        <linearGradient id={`spark-stroke-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.85" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`spark-fill-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polyline points={`${points} 180,70 0,70`} fill={`url(#spark-fill-${variant})`} stroke="none" />
      <polyline points={points} fill="none" stroke={`url(#spark-stroke-${variant})`} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

type OrderBucket = { label: string; orders: Order[] };

const buildOrderBuckets = (
  range: 'Heute' | 'Diese Woche' | 'Dieser Monat' | 'Dieses Jahr',
  orders: Order[]
): OrderBucket[] => {
  const now = new Date();
  const getDate = (o: Order) => new Date((o as any)?.created_at ?? (o as any)?.createdAt ?? Date.now());

  if (range === 'Heute') {
    return Array.from({ length: 8 }).map((_, idx) => {
      const start = new Date(now);
      start.setHours(idx * 3, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 3);
      const bucketOrders = orders.filter((o) => {
        const d = getDate(o);
        return d >= start && d < end;
      });
      return { label: `${start.getHours()}h`, orders: bucketOrders };
    });
  }

  if (range === 'Diese Woche') {
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const bucketOrders = orders.filter((o) => {
        const od = getDate(o);
        return od >= d && od < next;
      });
      return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), orders: bucketOrders };
    });
  }

  if (range === 'Dieser Monat') {
    return Array.from({ length: 4 }).map((_, idx) => {
      const start = new Date(now);
      start.setDate(1 + idx * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const bucketOrders = orders.filter((o) => {
        const od = getDate(o);
        return od >= start && od < end;
      });
      return { label: `${idx + 1}. Woche`, orders: bucketOrders };
    });
  }

  return Array.from({ length: 12 }).map((_, idx) => {
    const start = new Date(now.getFullYear(), idx, 1);
    const end = new Date(now.getFullYear(), idx + 1, 1);
    const bucketOrders = orders.filter((o) => {
      const od = getDate(o);
      return od >= start && od < end;
    });
    return { label: start.toLocaleDateString(undefined, { month: 'short' }), orders: bucketOrders };
  });
};

function formatDate(value: string | Date | undefined) {
  if (!value) return '–';
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString();
}

export default OverviewPage;
