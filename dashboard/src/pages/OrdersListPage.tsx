import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { listOrders } from '../api/orders';
import type { Order } from '../api/types';

const allowedStatuses: Order['status'][] = ['oem_lookup', 'show_offers', 'done'];

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
      console.log('[OrdersListPage] fetching orders');
      setIsLoading(true);
      setError(null);

      try {
        const data = await listOrders();
        console.log(`[OrdersListPage] fetched ${data.length} orders`);
        const filtered = data.filter((order) => allowedStatuses.includes(order.status));
        setOrders(filtered);
      } catch (err) {
        console.error('[OrdersListPage] failed to fetch orders', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

  const renderVehicle = (order: Order) => {
    if (!order.vehicle) return '—';
    const { make, model, year, vin } = order.vehicle;
    const parts = [make, model, year ? year.toString() : null].filter(Boolean).join(' ');
    return (
      <>
        <div>{parts || 'Vehicle TBD'}</div>
        {vin ? <div style={styles.muted}>VIN: {vin}</div> : null}
      </>
    );
  };

  const renderPart = (order: Order) => {
    if (!order.part) return '—';
    const { partCategory, position, oemStatus, oemNumber } = order.part;
    const flagged = oemStatus === 'not_found' || oemStatus === 'multiple_matches';
    return (
      <div style={flagged ? styles.flagged : undefined}>
        <div>{partCategory ?? 'Part category TBD'}</div>
        <div style={styles.muted}>
          {position ?? 'position n/a'} · OEM status: {oemStatus ?? 'pending'}
        </div>
        {oemNumber ? <div style={styles.muted}>OEM: {oemNumber}</div> : null}
      </div>
    );
  };

  const rows = useMemo(() => orders, [orders]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.subtitle}>Orders ready for OEM lookup, offers, or completed</p>
          <h2 style={styles.title}>Orders</h2>
        </div>
        <div style={styles.meta}>
          {isLoading ? <span style={styles.pill}>Loading…</span> : null}
          {!isLoading ? <span style={styles.pill}>{rows.length} visible</span> : null}
        </div>
      </div>

      {error ? (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Language</th>
              <th style={styles.th}>Vehicle</th>
              <th style={styles.th}>Part</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td style={styles.td} colSpan={7}>
                  Loading orders…
                </td>
              </tr>
            ) : null}

            {!isLoading && rows.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan={7}>
                  No orders to show for the selected statuses.
                </td>
              </tr>
            ) : null}

            {!isLoading &&
              rows.map((order) => {
                const flagged =
                  order.part?.oemStatus === 'not_found' ||
                  order.part?.oemStatus === 'multiple_matches';

                return (
                  <tr
                    key={order.id}
                    style={{
                      ...styles.tr,
                      ...(flagged ? styles.trFlagged : {})
                    }}
                  >
                    <td style={styles.td}>{order.id}</td>
                    <td style={styles.td}>{order.status}</td>
                    <td style={styles.td}>{formatDate(order.created_at)}</td>
                    <td style={styles.td}>{order.language ?? 'n/a'}</td>
                    <td style={styles.td}>{renderVehicle(order)}</td>
                    <td style={styles.td}>{renderPart(order)}</td>
                    <td style={styles.td}>
                      <button
                        style={styles.viewButton}
                        onClick={() => {
                          console.log('[OrdersListPage] navigating to order', order.id);
                          navigate(`/orders/${order.id}`);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
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
    minWidth: 900
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
  trFlagged: {
    backgroundColor: '#fff7ed'
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'top',
    fontSize: 14,
    color: '#0f172a'
  },
  muted: {
    color: '#64748b',
    fontSize: 13
  },
  flagged: {
    borderLeft: '4px solid #f97316',
    paddingLeft: 8
  },
  viewButton: {
    padding: '8px 12px',
    backgroundColor: '#1d4ed8',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer'
  }
};

export default OrdersListPage;
