import React, { useEffect, useMemo, useState, type CSSProperties } from 'react';

type OfferStatus = 'new' | 'selected' | 'hidden' | 'expired' | 'error';

type Offer = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  product_name: string;
  brand?: string;
  base_price?: number;
  tier?: string;
  url: string;
  status: OfferStatus;
};

type OffersResponse = {
  order_id: string;
  offers: Offer[];
};

type Props = {
  orderId: string;
};

type TierFilter = 'all' | 'low' | 'medium' | 'high';
type PriceSort = 'none' | 'asc' | 'desc';

const ShopOffersTable: React.FC<Props> = ({ orderId }) => {
  const [data, setData] = useState<OffersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [priceSort, setPriceSort] = useState<PriceSort>('none');

  useEffect(() => {
    const fetchOffers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${orderId}/offers`);
        if (!res.ok) {
          throw new Error(`Laden fehlgeschlagen (${res.status})`);
        }
        const json: OffersResponse = await res.json();
        setData(json);
      } catch (err) {
        console.error('[ShopOffersTable] Fehler beim Laden', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOffers();
    }
  }, [orderId]);

  const visibleOffers = useMemo(() => {
    const offers = data?.offers ?? [];
    const filtered = offers.filter((offer) => offer.status !== 'hidden');

    const tierFiltered =
      tierFilter === 'all'
        ? filtered
        : filtered.filter((offer) => (offer.tier ?? '').toLowerCase() === tierFilter);

    if (priceSort === 'none') return tierFiltered;

    const sorted = [...tierFiltered].sort((a, b) => {
      const priceA = a.base_price ?? Number.POSITIVE_INFINITY;
      const priceB = b.base_price ?? Number.POSITIVE_INFINITY;
      if (priceA === priceB) return 0;
      return priceSort === 'asc' ? priceA - priceB : priceB - priceA;
    });

    return sorted;
  }, [data, tierFilter, priceSort]);

  const togglePriceSort = () => {
    setPriceSort((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.subtitle}>Angebote für Bestellung</p>
          <h2 style={styles.title}>Shop-Angebote</h2>
        </div>
        <div style={styles.controls}>
          <label style={styles.filterLabel}>
            Tier:
            <select
              style={styles.select}
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as TierFilter)}
            >
              <option value="all">alle</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <button style={styles.sortButton} onClick={togglePriceSort}>
            Preis: {priceSort === 'none' ? '—' : priceSort === 'asc' ? 'aufsteigend' : 'absteigend'}
          </button>
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
              <th style={styles.th}>Produkt</th>
              <th style={styles.th}>Supplier</th>
              <th style={styles.th}>Preis</th>
              <th style={styles.th}>Tier</th>
              <th style={styles.th}>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td style={styles.td} colSpan={5}>
                  Angebote werden geladen…
                </td>
              </tr>
            ) : null}

            {!isLoading && visibleOffers.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan={5}>
                  Keine Angebote gefunden.
                </td>
              </tr>
            ) : null}

            {!isLoading &&
              visibleOffers.map((offer) => (
                <tr key={offer.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.cellStack}>
                      <div style={styles.productName}>{offer.product_name}</div>
                      {offer.brand ? <div style={styles.muted}>{offer.brand}</div> : null}
                    </div>
                  </td>
                  <td style={styles.td}>{offer.supplier_name}</td>
                  <td style={styles.td}>
                    {offer.base_price !== undefined && offer.base_price !== null
                      ? `€ ${offer.base_price.toFixed(2)}`
                      : '—'}
                  </td>
                  <td style={styles.td}>{offer.tier ?? '—'}</td>
                  <td style={styles.tdAction}>
                    <button
                      style={styles.actionButton}
                      onClick={() => window.open(offer.url, '_blank')}
                    >
                      Hier bestellen
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
    alignItems: 'center',
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
  controls: {
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#0f172a'
  },
  select: {
    padding: '6px 8px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#ffffff'
  },
  sortButton: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    cursor: 'pointer',
    fontSize: 13
  },
  tableWrapper: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    background: '#f8fafc',
    padding: '12px 14px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: 13,
    color: '#475569',
    fontWeight: 700
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'middle'
  },
  tdAction: {
    padding: '12px 14px',
    borderBottom: '1px solid #e2e8f0',
    textAlign: 'right'
  },
  tr: {
    backgroundColor: '#ffffff'
  },
  cellStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  productName: {
    fontWeight: 700,
    color: '#0f172a'
  },
  muted: {
    color: '#94a3b8',
    fontSize: 12
  },
  actionButton: {
    padding: '10px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#2563eb',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 8px 18px rgba(37, 99, 235, 0.25)'
  },
  errorBox: {
    background: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecdd3',
    borderRadius: 10,
    padding: '10px 12px'
  }
};

export default ShopOffersTable;
