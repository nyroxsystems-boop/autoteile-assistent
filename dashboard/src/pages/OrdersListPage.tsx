import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { listOrders } from '../api/orders';
import type { Order } from '../api/types';

const statusLabelMap: Record<string, string> = {
  collect_vehicle: 'Fahrzeugdaten sammeln',
  collect_part: 'Teiledaten sammeln',
  oem_lookup: 'OEM-Ermittlung',
  show_offers: 'Angebote anzeigen',
  done: 'Abgeschlossen',
  choose_language: 'Sprache wählen'
};

const OrdersListPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[OrdersListPage] mounted');
    return () => console.log('[OrdersListPage] unmounted');
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      console.log('[OrdersListPage] Bestellungen werden geladen...');
      setIsLoading(true);
      setError(null);
      try {
        const data = await listOrders();
        console.log('[OrdersListPage] Bestellungen geladen:', data.length);
        setOrders(data);
      } catch (err) {
        console.error('[OrdersListPage] Fehler beim Laden der Bestellungen', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const rows = useMemo(() => orders, [orders]);

  const renderDate = (date?: string) => {
    if (!date) return '–';
    return new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const renderStatus = (status: string) => statusLabelMap[status] ?? status ?? '–';

  const renderVehicle = (order: Order) => {
    const vehicle = order.vehicle ?? null;
    if (!vehicle) return '–';
    const ident = vehicle.vin || [vehicle.hsn, vehicle.tsn].filter(Boolean).join('/') || '–';
    return (
      <div style={styles.cellStack}>
        <div>
          {vehicle.make ?? '-'} {vehicle.model ?? ''}
        </div>
        <div style={styles.muted}>
          Bj. {vehicle.year ?? '-'} · Identifikation: {ident}
        </div>
      </div>
    );
  };

  const renderPart = (order: Order) => {
    const part = order.part ?? null;
    if (!part) return '–';
    return (
      <div style={styles.cellStack}>
        <div>{part.partCategory ?? '-'}</div>
        <div style={styles.muted}>{part.partText ?? '-'}</div>
      </div>
    );
  };

  const renderSelectedBadge = (order: Order) => {
    const selectedId =
      (order as any)?.order_data?.selectedOfferId ??
      (order as any)?.orderData?.selectedOfferId ??
      null;
    if (!selectedId) return null;
    return <span style={styles.selectedBadge}>Produkt gewählt</span>;
  };

  const renderPrice = (order: Order) => {
    const value = order.totalPrice ?? order.total_price ?? null;
    if (value === null || value === undefined) return '–';
    return `€ ${value.toFixed(2)}`;
  };

  const renderCustomer = (order: Order) => {
    return (
      <div style={styles.cellStack}>
        <div>Kunden-ID: {order.customerId ?? '-'}</div>
        <div style={styles.muted}>Telefon: {order.customerPhone ?? '-'}</div>
      </div>
    );
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.subtitle}>Alle Bestellungen aus dem WhatsApp-Bot</p>
          <h2 style={styles.title}>Bestellungen</h2>
        </div>
        <div style={styles.meta}>
          {isLoading ? <span style={styles.pill}>Lädt…</span> : null}
          {!isLoading ? <span style={styles.pill}>{rows.length} sichtbar</span> : null}
        </div>
      </div>

      {error ? (
        <div style={styles.errorBox}>
          <strong>Fehler:</strong> {error}
        </div>
      ) : null}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Bestellung</th>
              <th style={styles.th}>Kunde</th>
              <th style={styles.th}>Fahrzeug</th>
              <th style={styles.th}>Teil</th>
              <th style={styles.th}>Preis</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Erstellt</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td style={styles.td} colSpan={8}>
                  Bestellungen werden geladen…
                </td>
              </tr>
            ) : null}

            {!isLoading && rows.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan={8}>
                  Keine Bestellungen vorhanden.
                </td>
              </tr>
            ) : null}

            {!isLoading &&
              rows.map((order) => (
                <tr key={order.id} style={styles.tr}>
                  <td style={styles.td}>{order.id}</td>
                  <td style={styles.td}>{renderCustomer(order)}</td>
                  <td style={styles.td}>{renderVehicle(order)}</td>
                  <td style={styles.td}>
                    {renderPart(order)}
                    {renderSelectedBadge(order)}
                  </td>
                  <td style={styles.td}>{renderPrice(order)}</td>
                  <td style={styles.td}>{renderStatus(String(order.status))}</td>
                  <td style={styles.td}>
                    {renderDate(order.created_at ?? order.createdAt ?? undefined)}
                  </td>
                  <td style={styles.tdAction}>
                    <button
                      style={styles.viewButton}
                      onClick={() => {
                        console.log('[OrdersListPage] navigating to order', order.id);
                        navigate(`/orders/${order.id}`);
                      }}
                    >
                      Details ansehen
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  subtitle: {
    margin: 0,
    color: '#475569',
    fontSize: 14
  },
  title: {
    margin: '4px 0 0',
    fontSize: 22,
    color: '#0f172a'
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  pill: {
    padding: '6px 10px',
    backgroundColor: '#e2e8f0',
    borderRadius: 9999,
    fontWeight: 600,
    color: '#0f172a',
    border: '1px solid #cbd5e1'
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecdd3'
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 1000
  },
  th: {
    textAlign: 'left',
    padding: '12px 14px',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#475569',
    borderBottom: '1px solid #e2e8f0'
  },
  tr: {
    borderBottom: '1px solid #e2e8f0'
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'top',
    fontSize: 14,
    color: '#0f172a'
  },
  tdAction: {
    padding: '12px 14px',
    verticalAlign: 'middle'
  },
  cellStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  muted: {
    color: '#64748b',
    fontSize: 13
  },
  viewButton: {
    padding: '8px 12px',
    backgroundColor: '#1d4ed8',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer'
  },
  selectedBadge: {
    marginTop: 6,
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: 9999,
    backgroundColor: '#ecfdf3',
    color: '#166534',
    border: '1px solid #bbf7d0',
    fontSize: 12,
    fontWeight: 700
  }
};

export default OrdersListPage;
