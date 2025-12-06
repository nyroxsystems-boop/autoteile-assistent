import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder, getOrderOffers, publishOffers } from '../api/orders';
import type { Order, ShopOffer } from '../api/types';

type OfferRow = ShopOffer & {
  selected?: boolean;
  marginPercent: number | null;
};

const OrderDetailPage = () => {
  const { id: orderId } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [defaultMargin, setDefaultMargin] = useState<number>(20);

  const [orderError, setOrderError] = useState<string | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [isOrderLoading, setIsOrderLoading] = useState<boolean>(false);
  const [isOffersLoading, setIsOffersLoading] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  useEffect(() => {
    console.log('[OrderDetailPage] mounted for orderId:', orderId);
    return () => console.log('[OrderDetailPage] unmounted for orderId:', orderId);
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrderData = async () => {
      console.log('[OrderDetailPage] fetching order', orderId);
      setIsOrderLoading(true);
      setOrderError(null);
      try {
        const data = await getOrder(orderId);
        console.log('[OrderDetailPage] fetched order', data);
        setOrder(data);
      } catch (error) {
        console.error('[OrderDetailPage] API error', error);
        setOrderError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsOrderLoading(false);
      }
    };

    const fetchOffersData = async () => {
      console.log('[OrderDetailPage] fetching offers', orderId);
      setIsOffersLoading(true);
      setOffersError(null);
      try {
        const data = await getOrderOffers(orderId);
        console.log('[OrderDetailPage] fetched offers', data);
        setOffers(
          data.map((offer) => ({
            ...offer,
            selected: false,
            marginPercent: offer.marginPercent
          }))
        );
      } catch (error) {
        console.error('[OrderDetailPage] API error', error);
        setOffersError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsOffersLoading(false);
      }
    };

    fetchOrderData();
    fetchOffersData();
  }, [orderId]);

  const offersWithComputedPrice = useMemo(() => {
    return offers.map((offer) => {
      const appliedMargin =
        offer.marginPercent !== null && offer.marginPercent !== undefined
          ? offer.marginPercent
          : defaultMargin;
      const finalPrice = offer.basePrice * (1 + (appliedMargin ?? 0) / 100);
      return { ...offer, finalPrice, appliedMargin };
    });
  }, [offers, defaultMargin]);

  const handleMarginChange = (offerId: string, value: string) => {
    const parsed = value === '' ? null : Number(value);
    setOffers((prev) =>
      prev.map((offer) =>
        offer.id === offerId ? { ...offer, marginPercent: Number.isNaN(parsed) ? null : parsed } : offer
      )
    );
  };

  const handleSelect = (offerId: string, checked: boolean) => {
    setOffers((prev) =>
      prev.map((offer) => (offer.id === offerId ? { ...offer, selected: checked } : offer))
    );
  };

  const handlePublish = async () => {
    setPublishError(null);
    if (!orderId) {
      setPublishError('Order ID is missing');
      return;
    }
    const selectedOfferIds = offers.filter((o) => o.selected).map((o) => o.id);
    if (selectedOfferIds.length === 0) {
      setPublishError('Please select at least one offer to publish.');
      return;
    }
    console.log('[OrderDetailPage] publishOffers clicked', { orderId, selectedOfferIds });

    try {
      setIsPublishing(true);
      const response = await publishOffers(orderId, selectedOfferIds);
      console.log('[OrderDetailPage] publishOffers success', response);
      setOffers((prev) =>
        prev.map((offer) =>
          selectedOfferIds.includes(offer.id)
            ? { ...offer, status: 'published', selected: false }
            : offer
        )
      );
    } catch (error) {
      console.error('[OrderDetailPage] API error', error);
      setPublishError(error instanceof Error ? error.message : 'Failed to publish offers');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!orderId) {
    return <div style={styles.wrapper}>No order id provided.</div>;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.breadcrumbs}>
        <Link to="/orders">← Back to orders</Link>
        <span style={styles.routeInfo}>/orders/{orderId}</span>
      </div>

      {orderError ? (
        <div style={styles.errorBox}>
          <strong>Order error:</strong> {orderError}
        </div>
      ) : null}

      <section style={styles.card}>
        <header style={styles.sectionHeader}>
          <div>
            <p style={styles.subtitle}>Order #{orderId}</p>
            <h2 style={styles.title}>{order?.status ?? 'Loading...'}</h2>
          </div>
          <div style={styles.badge}>{order?.language ?? 'n/a'}</div>
        </header>
        <div style={styles.rowGrid}>
          <div>
            <div style={styles.label}>Created at</div>
            <div style={styles.value}>
              {order?.created_at
                ? new Date(order.created_at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })
                : '—'}
            </div>
          </div>
          <div>
            <div style={styles.label}>Updated at</div>
            <div style={styles.value}>
              {order?.updated_at
                ? new Date(order.updated_at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })
                : '—'}
            </div>
          </div>
          <div>
            <div style={styles.label}>Status</div>
            <div style={styles.value}>{order?.status ?? '—'}</div>
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <header style={styles.sectionHeader}>
          <h3 style={styles.title}>Vehicle</h3>
        </header>
        <div style={styles.rowGrid}>
          <div>
            <div style={styles.label}>VIN</div>
            <div style={styles.value}>{order?.vehicle?.vin ?? '—'}</div>
          </div>
          <div>
            <div style={styles.label}>HSN / TSN</div>
            <div style={styles.value}>
              {order?.vehicle?.hsn ?? '—'} / {order?.vehicle?.tsn ?? '—'}
            </div>
          </div>
          <div>
            <div style={styles.label}>Make / Model</div>
            <div style={styles.value}>
              {order?.vehicle?.make ?? '—'} {order?.vehicle?.model ?? ''}
            </div>
          </div>
          <div>
            <div style={styles.label}>Year</div>
            <div style={styles.value}>{order?.vehicle?.year ?? '—'}</div>
          </div>
          <div>
            <div style={styles.label}>Engine</div>
            <div style={styles.value}>{order?.vehicle?.engine ?? '—'}</div>
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <header style={styles.sectionHeader}>
          <h3 style={styles.title}>Part</h3>
        </header>
        <div style={styles.rowGrid}>
          <div>
            <div style={styles.label}>Category</div>
            <div style={styles.value}>{order?.part?.partCategory ?? '—'}</div>
          </div>
          <div>
            <div style={styles.label}>Position</div>
            <div style={styles.value}>{order?.part?.position ?? '—'}</div>
          </div>
          <div>
            <div style={styles.label}>Part Text</div>
            <div style={styles.value}>{order?.part?.partText ?? '—'}</div>
          </div>
          <div>
            <div style={styles.label}>OEM Status</div>
            <div style={styles.value}>{order?.part?.oemStatus ?? '—'}</div>
          </div>
          <div>
            <div style={styles.label}>OEM Number</div>
            <div style={styles.value}>{order?.part?.oemNumber ?? '—'}</div>
          </div>
        </div>
        <div style={styles.detailBox}>
          <div style={styles.label}>Part Details</div>
          <pre style={styles.pre}>
{JSON.stringify(order?.part?.partDetails ?? {}, null, 2)}
          </pre>
        </div>
      </section>

      <section style={styles.card}>
        <header style={styles.sectionHeader}>
          <div>
            <h3 style={styles.title}>Offers</h3>
            <p style={styles.subtitle}>
              Final price = basePrice * (1 + margin% / 100). If margin is empty, default applies.
            </p>
          </div>
          <div style={styles.defaultMargin}>
            <label htmlFor="defaultMargin" style={styles.label}>
              Default Margin %
            </label>
            <input
              id="defaultMargin"
              type="number"
              value={defaultMargin}
              onChange={(e) => setDefaultMargin(Number(e.target.value))}
              style={styles.input}
            />
          </div>
        </header>

        {offersError ? (
          <div style={styles.errorBox}>
            <strong>Offers error:</strong> {offersError}
          </div>
        ) : null}

        {isOffersLoading ? (
          <div style={styles.loading}>Loading offers…</div>
        ) : offersWithComputedPrice.length === 0 ? (
          <div style={styles.emptyBox}>No offers available yet.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Select</th>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>OEM</th>
                  <th style={styles.th}>Base Price</th>
                  <th style={styles.th}>Margin %</th>
                  <th style={styles.th}>Final Price</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {offersWithComputedPrice.map((offer) => (
                  <tr key={offer.id} style={styles.tr}>
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={Boolean(offer.selected)}
                        onChange={(e) => handleSelect(offer.id, e.target.checked)}
                      />
                    </td>
                    <td style={styles.td}>{offer.brand}</td>
                    <td style={styles.td}>{offer.productName}</td>
                    <td style={styles.td}>{offer.oemNumber ?? '—'}</td>
                    <td style={styles.td}>€ {offer.basePrice.toFixed(2)}</td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        value={offer.marginPercent ?? ''}
                        placeholder={`${defaultMargin}`}
                        onChange={(e) => handleMarginChange(offer.id, e.target.value)}
                        style={styles.input}
                      />
                    </td>
                    <td style={styles.td}>€ {offer.finalPrice.toFixed(2)}</td>
                    <td style={styles.td}>{offer.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {publishError ? <div style={styles.errorBox}>{publishError}</div> : null}

        <div style={styles.publishRow}>
          <button style={styles.primaryButton} onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? 'Publishing…' : 'Publish selected offers'}
          </button>
        </div>
      </section>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#475569'
  },
  routeInfo: {
    fontSize: 12,
    color: '#94a3b8'
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecdd3'
  },
  emptyBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0'
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  subtitle: {
    margin: 0,
    color: '#475569',
    fontSize: 14
  },
  title: {
    margin: 0,
    fontSize: 20,
    color: '#0f172a'
  },
  badge: {
    padding: '6px 10px',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    fontWeight: 700
  },
  rowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12
  },
  label: {
    color: '#475569',
    fontSize: 13
  },
  value: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: 600
  },
  detailBox: {
    marginTop: 8
  },
  pre: {
    margin: '8px 0 0',
    padding: 12,
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 8,
    overflow: 'auto',
    fontSize: 13
  },
  defaultMargin: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 180
  },
  input: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 14
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 10,
    border: '1px solid #e2e8f0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#475569'
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: 14,
    verticalAlign: 'middle'
  },
  tr: {
    backgroundColor: '#ffffff'
  },
  loading: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    color: '#075985',
    fontWeight: 600
  },
  publishRow: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  primaryButton: {
    padding: '10px 14px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    cursor: 'pointer'
  }
};

export default OrderDetailPage;
