import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder, getOrderOffers } from '../api/orders';
import type { Order, OrderData, SelectedOfferSummary, ShopOffer } from '../api/types';

type OfferRow = ShopOffer & { priceValue: number; currencyValue: string };

const OrderDetailPage = () => {
  const { id: orderId } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);

  const [orderError, setOrderError] = useState<string | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);

  const [isOrderLoading, setIsOrderLoading] = useState<boolean>(false);
  const [isOffersLoading, setIsOffersLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrderData = async () => {
      setIsOrderLoading(true);
      setOrderError(null);
      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (error) {
        setOrderError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsOrderLoading(false);
      }
    };

    const fetchOffersData = async () => {
      setIsOffersLoading(true);
      setOffersError(null);
      try {
        const data = await getOrderOffers(orderId);
        setOffers(
          (data ?? []).map((offer) => ({
            ...offer,
            priceValue: offer.basePrice ?? offer.finalPrice ?? 0,
            currencyValue: offer.currency ?? 'EUR'
          }))
        );
      } catch (error) {
        setOffersError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsOffersLoading(false);
      }
    };

    fetchOrderData();
    fetchOffersData();
  }, [orderId]);

  const orderData: OrderData =
    (order as any)?.order_data ||
    (order as any)?.orderData || {
      conversationStatus: null,
      vehicleDescription: null,
      partDescription: null
    };

  const selectedOfferId = orderData?.selectedOfferId ?? null;
  const selectedOfferSummary: SelectedOfferSummary | null = orderData?.selectedOfferSummary ?? null;

  const selectedOffer = useMemo(
    () => (selectedOfferId ? offers.find((o) => o.id === selectedOfferId) ?? null : null),
    [offers, selectedOfferId]
  );

  const selectedCardOffer: any = selectedOffer ?? (selectedOfferSummary
    ? {
        shopName: selectedOfferSummary.shopName ?? '—',
        brand: selectedOfferSummary.brand ?? '—',
        priceValue: selectedOfferSummary.price ?? NaN,
        currencyValue: selectedOfferSummary.currency ?? 'EUR',
        deliveryTimeDays: selectedOfferSummary.deliveryTimeDays ?? null,
        productUrl: (selectedOfferSummary as any)?.productUrl ?? null,
        id: selectedOfferId ?? undefined
      }
    : null);

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
          <div>
            <div style={styles.label}>Conversation</div>
            <div style={styles.value}>{orderData?.conversationStatus ?? '—'}</div>
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <header style={styles.sectionHeader}>
          <h3 style={styles.title}>Order Summary</h3>
        </header>
        <div style={styles.rowGrid}>
          <div>
            <div style={styles.label}>Customer</div>
            <div style={styles.value}>{(order as any)?.customerName ?? '—'}</div>
          </div>
          <div>
            <div style={styles.label}>Contact</div>
            <div style={styles.value}>{(order as any)?.customerPhone ?? (order as any)?.customerContact ?? '—'}</div>
          </div>
          <div>
            <div style={styles.label}>Requested Part</div>
            <div style={styles.value}>{(order as any)?.requestedPartName ?? orderData?.partDescription ?? '—'}</div>
          </div>
          <div>
            <div style={styles.label}>Language</div>
            <div style={styles.value}>{order?.language ?? '—'}</div>
          </div>
        </div>
        <div style={styles.detailBox}>
          <div style={styles.label}>Vehicle (description)</div>
          <div style={styles.value}>{orderData?.vehicleDescription ?? '—'}</div>
        </div>
      </section>

      <section style={styles.card}>
        <header style={styles.sectionHeader}>
          <h3 style={styles.title}>
            {order?.language === 'en' ? "Customer's selected product" : 'Gewähltes Produkt des Kunden'}
          </h3>
          {selectedOfferId ? <span style={styles.selectedBadge}>Selected by customer</span> : null}
        </header>
        {selectedCardOffer ? (
          <div style={styles.selectedGrid}>
            <div>
              <div style={styles.label}>{order?.language === 'en' ? 'Brand' : 'Marke'}</div>
              <div style={styles.value}>{(selectedCardOffer as any).brand ?? '—'}</div>
            </div>
            <div>
              <div style={styles.label}>Shop</div>
              <div style={styles.value}>{(selectedCardOffer as any).shopName ?? '—'}</div>
            </div>
            <div>
              <div style={styles.label}>{order?.language === 'en' ? 'Price' : 'Preis'}</div>
              <div style={styles.value}>
                {Number.isFinite((selectedCardOffer as any).priceValue)
                  ? `${(selectedCardOffer as any).priceValue.toFixed(2)} ${
                      (selectedCardOffer as any).currencyValue ?? 'EUR'
                    }`
                  : '—'}
              </div>
            </div>
            <div>
              <div style={styles.label}>{order?.language === 'en' ? 'Delivery' : 'Lieferzeit'}</div>
              <div style={styles.value}>
                {(selectedCardOffer as any).deliveryTimeDays ??
                  (order?.language === 'en' ? 'n/a' : 'k.A.')}
              </div>
            </div>
            <div>
              <div style={styles.label}>Rating</div>
              <div style={styles.value}>
                {(selectedCardOffer as any).rating
                  ? `${(selectedCardOffer as any).rating}/5`
                  : order?.language === 'en'
                  ? 'n/a'
                  : 'k.A.'}
              </div>
            </div>
            {(selectedCardOffer as any).productUrl ? (
              <div style={styles.linkRow}>
                <a
                  href={(selectedCardOffer as any).productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.linkButton}
                >
                  {order?.language === 'en' ? 'Open product' : 'Zum Produkt'}
                </a>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={styles.emptyBox}>
            {order?.language === 'en'
              ? 'The customer has not selected an offer yet.'
              : 'Der Kunde hat noch kein Angebot ausgewählt.'}
          </div>
        )}
      </section>

      <section style={styles.card}>
        <header style={styles.sectionHeader}>
          <h3 style={styles.title}>
            {order?.language === 'en' ? 'All offers for this order' : 'Alle Angebote zu dieser Bestellung'}
          </h3>
        </header>

        {offersError ? (
          <div style={styles.errorBox}>
            <strong>Offers error:</strong> {offersError}
          </div>
        ) : null}

        {isOffersLoading ? (
          <div style={styles.loading}>Loading offers…</div>
        ) : offers.length === 0 ? (
          <div style={styles.emptyBox}>
            {order?.language === 'en'
              ? 'No offers have been found for this order yet.'
              : 'Es wurden noch keine Angebote zu dieser Bestellung gefunden.'}
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Shop</th>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Preis</th>
                  <th style={styles.th}>Verfügbarkeit</th>
                  <th style={styles.th}>Lieferzeit</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Link</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => {
                  const isSelected = selectedOfferId && offer.id === selectedOfferId;
                  const priceLabel = `${(offer.priceValue ?? offer.basePrice ?? 0).toFixed(2)} ${
                    offer.currencyValue ?? 'EUR'
                  }`;
                  return (
                    <tr
                      key={offer.id}
                      style={{
                        ...styles.tr,
                        ...(isSelected ? styles.selectedRow : {})
                      }}
                    >
                      <td style={styles.td}>
                        <div style={styles.cellStack}>
                          <div style={styles.value}>{offer.shopName ?? '—'}</div>
                      {isSelected ? (
                        <span style={styles.selectedBadgeSmall}>
                          {order?.language === 'en' ? 'Selected' : 'Ausgewählt'}
                        </span>
                      ) : null}
                        </div>
                      </td>
                      <td style={styles.td}>{offer.brand ?? '—'}</td>
                      <td style={styles.td}>{priceLabel}</td>
                      <td style={styles.td}>{offer.availability ?? '—'}</td>
                      <td style={styles.td}>
                        {offer.deliveryTimeDays !== null && offer.deliveryTimeDays !== undefined
                          ? `${offer.deliveryTimeDays} Tage`
                          : '—'}
                      </td>
                      <td style={styles.td}>
                        {offer.rating !== null && offer.rating !== undefined ? `${offer.rating}/5` : '—'}
                      </td>
                      <td style={styles.td}>
                        {offer.productUrl ? (
                          <a
                            href={offer.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.link}
                          >
                            {order?.language === 'en' ? 'Open product' : 'Zum Produkt'}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
  selectedBadge: {
    padding: '6px 10px',
    backgroundColor: '#ecfdf3',
    color: '#166534',
    borderRadius: 8,
    border: '1px solid #bbf7d0',
    fontWeight: 700
  },
  selectedBadgeSmall: {
    display: 'inline-block',
    marginTop: 4,
    padding: '4px 8px',
    backgroundColor: '#ecfdf3',
    color: '#166534',
    borderRadius: 9999,
    border: '1px solid #bbf7d0',
    fontSize: 12,
    fontWeight: 700
  },
  selectedRow: {
    backgroundColor: '#f8fafc'
  },
  rowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
  selectedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12
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
  link: {
    color: '#1d4ed8',
    fontWeight: 700
  },
  linkButton: {
    display: 'inline-block',
    padding: '10px 12px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    borderRadius: 10,
    textDecoration: 'none',
    fontWeight: 700
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  }
};

export default OrderDetailPage;
