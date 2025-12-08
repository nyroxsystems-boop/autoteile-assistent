import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { listOrders } from '../api/orders';
import { fetchOverviewStats, type OverviewStats } from '../api/stats';
import type { Order } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { fetchMerchantSettings, saveMerchantSettings, type MerchantSettings } from '../api/merchant';

const OverviewPage = () => {
  const [timeRange, setTimeRange] = useState<'Heute' | 'Diese Woche' | 'Dieser Monat'>('Heute');
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [defaultMargin, setDefaultMargin] = useState<number | null>(null);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [step, setStep] = useState<number>(0);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const auth = useAuth();

  // a small default list of known shops (can be replaced by a real backend list later)
  const KNOWN_SHOPS = ['Autodoc', 'Stahlgruber', 'Mister Auto'];
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[OverviewPage] mounted');
    return () => console.log('[OverviewPage] unmounted');
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await fetchOverviewStats(timeRange);
        setStats(result);
        console.log('[OverviewPage] Statistiken aktualisiert', result);
      } catch (err) {
        console.error('[OverviewPage] Fehler beim Laden der Statistiken', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    };

    loadStats();
  }, [timeRange]);

  useEffect(() => {
    const loadOrders = async () => {
      console.log('[OverviewPage] Bestellungen für KPIs werden geladen...');
      try {
        const data = await listOrders();
        console.log('[OverviewPage] Bestellungen geladen:', data.length);
        setOrders(data);
      } catch (err) {
        console.error('[OverviewPage] Fehler beim Laden der Bestellungen', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    };

    loadOrders();
  }, []);

  // load merchant settings when session is available
  useEffect(() => {
    const loadSettings = async () => {
      if (!auth?.session?.merchantId) return;
      try {
        const s = await fetchMerchantSettings(auth.session.merchantId);
        if (s) {
          setSelectedShops(s.selectedShops ?? []);
          setDefaultMargin(s.marginPercent ?? null);
        }
      } catch (err) {
        console.error('[OverviewPage] Fehler beim Laden der Merchant-Settings', err);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [auth?.session?.merchantId]);

  const oemIssuesCount = useMemo(
    () =>
      orders.filter(
        (o) => o?.part?.oemStatus === 'not_found' || o?.part?.oemStatus === 'multiple_matches'
      ).length,
    [orders]
  );

  const handleRangeChange = (value: 'Heute' | 'Diese Woche' | 'Dieser Monat') => {
    console.log('[OverviewPage] Zeitraum geändert:', value);
    setTimeRange(value);
  };

  const handleMarginChange = (value: string) => {
    const parsed = value === '' ? null : Number(value);
    console.log('[OverviewPage] Standard-Marge geändert:', parsed);
    setDefaultMargin(Number.isNaN(parsed) ? null : parsed);
  };

  const handleMarginSave = () => {
    // legacy single-field save (keeps behavior but delegates to stepper save below)
    console.log('[OverviewPage] Standard-Marge speichern angeklickt', defaultMargin);
    handleSaveSettings();
  };

  const handleToggleShop = (shop: string) => {
    setSelectedShops((prev) => (prev.includes(shop) ? prev.filter((s) => s !== shop) : [...prev, shop]));
  };

  const handleSaveSettings = async () => {
    if (!auth?.session?.merchantId) {
      setError('Bitte zuerst anmelden, um Einstellungen zu speichern.');
      return;
    }
    setIsSavingSettings(true);
    setError(null);
    try {
      await saveMerchantSettings(auth.session.merchantId, {
        selectedShops,
        marginPercent: defaultMargin ?? 0
      });
      setError(null);
      setStep(0);
      console.log('[OverviewPage] Merchant settings saved');
    } catch (err) {
      console.error('[OverviewPage] Fehler beim Speichern der Merchant-Settings', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setIsSavingSettings(false);
    }
  };

  console.log('[OverviewPage] Hinweis-Sektion gerendert');

  return (
    <div style={styles.wrapper} className="container">
      <div className="card" style={{ padding: 20 }}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Schnellüberblick</p>
          <h1 style={styles.title}>Übersicht</h1>
        </div>
        <div style={styles.rangeSelector}>
          <label htmlFor="zeitraum" style={styles.label}>
            Zeitraum
          </label>
          <select
            id="zeitraum"
            value={timeRange}
            onChange={(e) => handleRangeChange(e.target.value as typeof timeRange)}
            style={styles.select}
          >
            <option value="Heute">Heute</option>
            <option value="Diese Woche">Diese Woche</option>
            <option value="Dieser Monat">Dieser Monat</option>
          </select>
        </div>
      </div>

      {error ? (
        <div style={styles.errorBox}>
          <strong>Fehler:</strong> {error}
        </div>
      ) : null}

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Kennzahlen</h2>
        <div style={styles.kpiGrid}>
          <KpiCard
            title="Bestellungen im Zeitraum"
            value={stats?.ordersInPeriod ?? '–'}
            description="Alle neu gestarteten Bestellungen im gewählten Zeitraum."
          />
          <KpiCard
            title="Offene Bestellungen (OEM-Prüfung)"
            value={oemIssuesCount}
            description="Bestellungen mit offener oder problematischer OEM-Ermittlung."
          />
          <KpiCard
            title="Empfangene Nachrichten"
            value={stats?.incomingMessages ?? '–'}
            description="Eingehende WhatsApp-Nachrichten im Zeitraum."
          />
          <KpiCard
            title="Abgebrochene Bestellungen"
            value={stats?.abortedOrders ?? '–'}
            description="Begonnene, aber nicht abgeschlossene Vorgänge. (TODO: echte Definition)"
          />
          <KpiCard
            title="Konversionsrate (%)"
            value={`${stats?.conversionRate ?? '–'}%`}
            description="Abschlussrate gegenüber gestarteten Anfragen."
          />
          <KpiCard
            title="Durchschnittliche Marge (%)"
            value={`${stats?.averageMargin ?? '–'}%`}
            description="Mittelwert der angewendeten Marge pro Bestellung."
          />
          <KpiCard
            title="Durchschnittlicher Warenkorb (€)"
            value={`€ ${stats?.averageBasket ?? '–'}`}
            description="Durchschnittlicher Endpreis pro Bestellung."
          />
        </div>
      </section>
      </div>

      <section style={styles.section} className="card">
        <h2 style={styles.sectionTitle}>Onboarding & Grundeinstellungen</h2>
        <p style={styles.muted}>Einmalig auswählen: Shops und Standard-Marge. Später jederzeit änderbar.</p>

  <div style={styles.stepper}>
          <div style={styles.stepHeader}>
            <div style={{ ...styles.stepPill, ...(step === 0 ? styles.stepActive : {}) }}>1</div>
            <div style={styles.stepTitle}>Shops auswählen</div>
          </div>
          {step === 0 ? (
            <div style={styles.stepBody}>
              <p style={styles.muted}>Wähle die Shops aus, die bei der Angebotssuche berücksichtigt werden sollen.</p>
              <div style={styles.shopsGrid}>
                {KNOWN_SHOPS.map((s) => (
                  <label key={s} style={styles.shopCard}>
                    <input type="checkbox" checked={selectedShops.includes(s)} onChange={() => handleToggleShop(s)} />
                    <div style={styles.shopName}>{s}</div>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button style={styles.primaryButton} onClick={() => setStep(1)} disabled={selectedShops.length === 0}>
                  Weiter
                </button>
                <button style={styles.ghostButton} onClick={() => setSelectedShops([])}>
                  Zurücksetzen
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.stepBody}>
              <div style={styles.stepHeader}>
                <div style={{ ...styles.stepPill, ...(step === 1 ? styles.stepActive : {}) }}>2</div>
                <div style={styles.stepTitle}>Standard-Marge</div>
              </div>
              <p style={styles.muted}>Diese Marge wird prozentual auf den Teilepreis aufgeschlagen.</p>
              <div style={styles.marginRow}>
                <label htmlFor="defaultMargin" style={styles.label}>
                  Standard-Marge (%)
                </label>
                <input
                  id="defaultMargin"
                  type="number"
                  value={defaultMargin ?? ''}
                  placeholder="z.B. 20"
                  onChange={(e) => handleMarginChange(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button style={styles.primaryButton} onClick={handleSaveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? 'Speichert…' : 'Speichern & Abschließen'}
                </button>
                <button style={styles.ghostButton} onClick={() => setStep(0)}>
                  Zurück
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Hinweise & Status</h2>
        <ul style={styles.list}>
          <li>Empfangene Nachrichten heute: {stats?.incomingMessages ?? '–'} (TODO: live)</li>
          <li>Abgebrochene Bestellungen heute: {stats?.abortedOrders ?? '–'} (TODO)</li>
          <li>Bestellungen, die auf OEM-Klärung warten: {oemIssuesCount}</li>
        </ul>
      </section>
    </div>
  );
};

type KpiCardProps = {
  title: string;
  value: string | number;
  description: string;
};

const KpiCard = ({ title, value, description }: KpiCardProps) => {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiTitle}>{title}</div>
      <div style={styles.kpiValue}>{value}</div>
      <div style={styles.kpiDescription}>{description}</div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  eyebrow: {
    margin: 0,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12
  },
  title: {
    margin: '4px 0 0',
    fontSize: 26,
    color: '#0f172a'
  },
  rangeSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  label: {
    fontWeight: 700,
    color: '#0f172a'
  },
  select: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 14
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    color: '#0f172a'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12
  },
  kpiCard: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  kpiTitle: {
    fontSize: 13,
    color: '#475569',
    fontWeight: 700
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a'
  },
  kpiDescription: {
    fontSize: 13,
    color: '#64748b'
  },
  muted: {
    color: '#475569'
  },
  marginRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  },
  input: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    minWidth: 140
  },
  primaryButton: {
    padding: '10px 14px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    cursor: 'pointer'
  },
  list: {
    margin: 0,
    paddingLeft: 20,
    color: '#334155',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecdd3'
  }
  ,
  stepper: {
    border: '1px solid #e6eef8',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  stepPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6eef8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: '#0f172a'
  },
  stepActive: {
    backgroundColor: '#1d4ed8',
    color: '#fff'
  },
  stepTitle: {
    fontWeight: 800,
    color: '#0f172a'
  },
  stepBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  shopsGrid: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap'
  },
  shopCard: {
    border: '1px solid #e2e8f0',
    padding: 10,
    borderRadius: 8,
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  shopName: {
    fontWeight: 700
  },
  ghostButton: {
    padding: '10px 14px',
    background: 'transparent',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    cursor: 'pointer'
  }
};

export default OverviewPage;
