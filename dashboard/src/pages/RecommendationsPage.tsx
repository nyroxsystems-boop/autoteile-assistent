import { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';
import { wawiService } from '../services/wawi';

type RecCategory = 'marge' | 'lager' | 'retouren' | 'service';
type RecItem = {
  id: string;
  title: string;
  rationale: string;
  category: RecCategory;
  severity: 'high' | 'medium' | 'low';
  state?: 'vorgemerkt' | 'ignoriert' | 'spaeter';
};

const tabs = ['Alle', 'Heute', 'Hoher Impact', 'Vorgemerkt', 'Ignoriert'] as const;

const RecommendationsPage = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Alle');
  const [selected, setSelected] = useState<string[]>([]);
  const [items, setItems] = useState<RecItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'alle' | RecCategory>('alle');
  const [severityFilter, setSeverityFilter] = useState<'alle' | 'high' | 'medium' | 'low'>('alle');
  const [toast, setToast] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [simPrice, setSimPrice] = useState<string>('');
  const [oemQuery, setOemQuery] = useState<string>('11428507683');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = async (oem: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await wawiService.inventoryByOem(oem);
      const offers = (data as any)?.offers ?? [];
      const mapped: RecItem[] = offers.map((offer: any, idx: number) => ({
        id: offer.id?.toString() ?? `${oem}-${idx}`,
        title: offer.product_name || offer.brand || offer.supplier_name || 'Angebot',
        rationale: `${offer.price ?? '-'} ${offer.currency ?? ''} · ${offer.supplier_name ?? ''}`,
        category: 'marge',
        severity:
          offer.price && Number(offer.price) > 200
            ? 'high'
            : offer.price && Number(offer.price) > 100
              ? 'medium'
              : 'low'
      }));
      setItems(mapped);
      setDetailId(mapped[0]?.id ?? null);
      if (mapped.length === 0) setToast('Keine Angebote gefunden');
    } catch (err) {
      console.error('[recommendations] load error', err);
      setError('Angebote konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations(oemQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter((i) => (categoryFilter === 'alle' ? true : i.category === categoryFilter))
      .filter((i) => (severityFilter === 'alle' ? true : i.severity === severityFilter))
      .filter((i) => {
        if (activeTab === 'Hoher Impact') return i.severity === 'high';
        if (activeTab === 'Vorgemerkt') return i.state === 'vorgemerkt';
        if (activeTab === 'Ignoriert') return i.state === 'ignoriert';
        return true;
      })
      .filter((i) => activeTab === 'Heute' ? true : true);
  }, [items, categoryFilter, severityFilter, activeTab]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const applyAction = (id: string, state: RecItem['state']) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, state } : i))
    );
    if (state === 'vorgemerkt') setToast('Vorgemerkt (Demo)');
  };

  const undoIgnore = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, state: undefined } : i)));
  };

  const bulkAction = (label: string) => {
    if (selected.length === 0) return;
    setToast(`${label} (Demo)`);
  };

  const detail = items.find((i) => i.id === detailId) ?? filtered[0] ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="PartsBot Empfehlungen"
        subtitle="Priorisiert nach Impact auf Marge, Cash & Retouren"
        actions={
          <>
            <Input
              value={oemQuery}
              onChange={(e) => setOemQuery(e.target.value)}
              placeholder="OEM / Suchbegriff"
              style={{ minWidth: 160 }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadRecommendations(oemQuery || 'DEMO-OEM')}
              disabled={loading}
            >
              {loading ? 'Lädt...' : 'Angebote laden'}
            </Button>
          </>
        }
      />

      <Card>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tabs.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={activeTab === t ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </Button>
          ))}
          <select
            className="topbar-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            style={{ minWidth: 140 }}
          >
            <option value="alle">Kategorie</option>
            <option value="marge">Marge</option>
            <option value="lager">Lager</option>
            <option value="retouren">Retouren</option>
            <option value="service">Service</option>
          </select>
          <select
            className="topbar-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            style={{ minWidth: 140 }}
          >
            <option value="alle">Impact</option>
            <option value="high">Hoch</option>
            <option value="medium">Mittel</option>
            <option value="low">Niedrig</option>
          </select>
        </div>
        {error ? <div style={{ paddingTop: 8, color: 'var(--danger)' }}>{error}</div> : null}
        {loading ? <div style={{ paddingTop: 8, color: 'var(--muted)' }}>Lade Angebote...</div> : null}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 12 }}>
        <Card>
          {selected.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{selected.length} markiert</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="secondary" onClick={() => bulkAction('Als Aufgabe speichern')}>Als Aufgabe speichern</Button>
                <Button size="sm" variant="ghost" onClick={() => bulkAction('Markierte analysieren')}>Markierte analysieren</Button>
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((rec) => (
              <div
                key={rec.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 10,
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 8,
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setDetailId(rec.id)}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(rec.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(rec.id);
                    }}
                    aria-label={`${rec.title} auswählen`}
                  />
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
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <Badge variant="neutral">{rec.category}</Badge>
                      {rec.state === 'spaeter' ? <Badge variant="warning">Heute+1 (Demo)</Badge> : null}
                      {rec.state === 'vorgemerkt' ? <Badge variant="success">Vorgemerkt (Demo)</Badge> : null}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyAction(rec.id, 'vorgemerkt');
                    }}
                  >
                    Anwenden
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyAction(rec.id, 'spaeter');
                    }}
                  >
                    Später
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyAction(rec.id, 'ignoriert');
                    }}
                  >
                    Ignorieren
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 ? <div style={{ color: 'var(--muted)' }}>Keine Empfehlungen.</div> : null}
          </div>
        </Card>

        <Card title={detail ? detail.title : 'Details'} subtitle="Rationale & Simulator">
          {detail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: 'var(--muted)' }}>{detail.rationale}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge variant="neutral">Kategorie: {detail.category}</Badge>
                <Badge variant="warning">Impact: {detail.severity}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Preis-Simulator (€)</div>
                  <Input value={simPrice} onChange={(e) => setSimPrice(e.target.value)} placeholder="z.B. 89,00" />
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Erwarteter Effekt</div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
                    {simPrice ? `Marge +${Math.min(8, Number(simPrice) / 100).toFixed(1)}% (Demo)` : 'Bitte Wert eingeben'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="primary" onClick={() => setToast('Vorgemerkt (Demo)')}>Vorgemerkt setzen</Button>
                <Button size="sm" variant="ghost" onClick={() => setToast('Empfehlung übernommen (Demo)')}>Empfehlung übernehmen</Button>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--muted)' }}>Bitte Empfehlung auswählen.</div>
          )}
        </Card>
      </div>

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

export default RecommendationsPage;
