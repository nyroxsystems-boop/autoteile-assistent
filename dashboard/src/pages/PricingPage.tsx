import { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import PageHeader from '../ui/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { fetchMerchantSettings, saveMerchantSettings } from '../api/merchant';
import { defaultPriceProfiles, type PriceProfile } from '../features/settings/types';

const KNOWN_SHOPS = [
  'Autodoc',
  'Stahlgruber',
  'Mister Auto',
  'ATP Autoteile',
  'Autoteile Teufel',
  'Leebmann24',
  'kfzteile24',
  'Motointegrator',
  'Oscaro',
  'Autodoc Pro'
];

const PricingPage = () => {
  const auth = useAuth();
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [shopSearch, setShopSearch] = useState('');
  const [priceProfiles, setPriceProfiles] = useState<PriceProfile[]>(defaultPriceProfiles);
  const [marginInputs, setMarginInputs] = useState<Record<string, string>>(buildMarginInputs(defaultPriceProfiles));
  const [defaultMargin, setDefaultMargin] = useState<number | null>(
    defaultPriceProfiles.find((p) => p.isDefault)?.margin ? defaultPriceProfiles.find((p) => p.isDefault)!.margin * 100 : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!auth?.session?.merchantId) return;
      try {
        const s = await fetchMerchantSettings(auth.session.merchantId);
        if (s) {
          setSelectedShops(s.selectedShops ?? []);
          setDefaultMargin(s.marginPercent ?? null);
          if (s.priceProfiles && s.priceProfiles.length) {
            setPriceProfiles(s.priceProfiles);
            setMarginInputs(buildMarginInputs(s.priceProfiles));
          }
        }
      } catch (err) {
        console.error('[PricingPage] Fehler beim Laden der Merchant-Settings', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      }
    };

    loadSettings();
  }, [auth?.session?.merchantId]);

  const defaultProfileId = useMemo(() => priceProfiles.find((p) => p.isDefault)?.id, [priceProfiles]);

  const handleToggleShop = (shop: string) => {
    setSelectedShops((prev) => (prev.includes(shop) ? prev.filter((s) => s !== shop) : [...prev, shop]));
  };

  const handleAddShop = () => {
    const val = shopSearch.trim();
    if (!val) return;
    if (!selectedShops.includes(val)) setSelectedShops((prev) => [...prev, val]);
    setShopSearch('');
  };

  const handleSave = async () => {
    if (!auth?.session?.merchantId) {
      setError('Bitte zuerst anmelden, um Einstellungen zu speichern.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await saveMerchantSettings(auth.session.merchantId, {
        selectedShops,
        marginPercent: defaultMargin ?? 0,
        priceProfiles
      });
      setToast('Einstellungen gespeichert (Demo)');
    } catch (err) {
      console.error('[PricingPage] Fehler beim Speichern', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedShops([]);
    setPriceProfiles(defaultPriceProfiles);
    setMarginInputs(buildMarginInputs(defaultPriceProfiles));
    const def = defaultPriceProfiles.find((p) => p.isDefault);
    setDefaultMargin(def ? def.margin * 100 : null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader
        title="Preisprofile & Margen"
        subtitle="Shops auswählen und Preisprofile pflegen. Änderungen speichern, um sie zu übernehmen."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
              Zurücksetzen
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Speichert…' : 'Speichern'}
            </Button>
          </div>
        }
      />

      {error ? (
        <Card>
          <div style={{ color: 'var(--text)' }}>
            <strong>Fehler:</strong> {error}
          </div>
        </Card>
      ) : null}

      <Card title="Shops & Grundlagen" subtitle="Shops auswählen, die bei der Angebotssuche genutzt werden.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {selectedShops.map((s) => (
              <Badge key={s} variant="neutral">
                {s}{' '}
                <button
                  onClick={() => handleToggleShop(s)}
                  style={{
                    marginLeft: 6,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer'
                  }}
                  aria-label={`${s} entfernen`}
                >
                  ✕
                </button>
              </Badge>
            ))}
            {selectedShops.length === 0 ? (
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Noch keine Shops ausgewählt.</span>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={shopSearch}
              onChange={(e) => setShopSearch(e.target.value)}
              placeholder="Shop suchen oder hinzufügen…"
              style={{
                flex: 1,
                minWidth: 240,
                borderRadius: 10,
                border: '1px solid var(--border)',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text)'
              }}
              list="shop-options"
            />
            <datalist id="shop-options">
              {KNOWN_SHOPS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <Button variant="primary" size="sm" onClick={handleAddShop}>
              Hinzufügen
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedShops([])}>
              Auswahl löschen
            </Button>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>
            Standard-Marge (Fallback) basiert auf dem markierten Standard-Profil.
          </div>
        </div>
      </Card>

      <Card title="Preisprofile" subtitle="Profile auswählen, Margen anpassen, Standard-Profil markieren.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {priceProfiles.map((profile) => (
            <div
              key={profile.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.05)',
                border: profile.isDefault ? '1px solid rgba(79,139,255,0.45)' : '1px solid var(--border)',
                boxShadow: profile.isDefault ? '0 6px 18px rgba(79,139,255,0.18)' : 'none',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 700
              }}
            >
              <span>{profile.name}</span>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{Math.round(profile.margin * 100)} %</span>
              {profile.isDefault ? (
                <span
                  style={{
                    fontSize: 11,
                    color: '#4f8bff',
                    background: 'rgba(79,139,255,0.12)',
                    borderRadius: 6,
                    padding: '2px 6px',
                    border: '1px solid rgba(79,139,255,0.35)'
                  }}
                >
                  Standard
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div style={{ color: 'var(--muted)', fontWeight: 700, marginBottom: 10 }}>Preisprofile bearbeiten:</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {priceProfiles.map((profile, idx) => (
            <div
              key={profile.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 12,
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minHeight: 260
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 800 }}>{profile.name}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <input
                    type="checkbox"
                    checked={profile.isDefault === true}
                    onChange={() => {
                      setPriceProfiles((prev) => {
                        const next = prev.map((p, pIdx) =>
                          pIdx === idx ? { ...p, isDefault: !p.isDefault } : p
                        );
                        const firstDefault = next.find((p) => p.isDefault);
                        setDefaultMargin(firstDefault ? Math.round(firstDefault.margin * 10000) / 100 : null);
                        return next;
                      });
                    }}
                  />
                  Standard
                </label>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{profile.description}</div>
              <div style={{ marginTop: 'auto' }}>
                <Input
                  label="Marge (%)"
                  type="text"
                  inputMode="decimal"
                  value={marginInputs[profile.id] ?? ''}
                  placeholder="z.B. 28"
                  style={{ height: 52, display: 'flex', alignItems: 'center', width: '100%' }}
                  onFocus={(e) => {
                    const len = e.target.value.length;
                    requestAnimationFrame(() => {
                      try {
                        e.target.setSelectionRange(len, len);
                      } catch {}
                    });
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setMarginInputs((prev) => ({ ...prev, [profile.id]: '' }));
                      setPriceProfiles((prev) =>
                        prev.map((p, pIdx) => (pIdx === idx ? { ...p, margin: 0 } : p))
                      );
                      if (profile.isDefault) setDefaultMargin(null);
                      return;
                    }
                    const cleaned = raw.replace(/^0+(?=\d)/, '');
                    setMarginInputs((prev) => ({ ...prev, [profile.id]: cleaned }));

                    const val = Number(cleaned);
                    if (Number.isNaN(val)) return;
                    const newMargin = val / 100;
                    setPriceProfiles((prev) =>
                      prev.map((p, pIdx) => (pIdx === idx ? { ...p, margin: newMargin } : p))
                    );
                    if (profile.isDefault) {
                      setDefaultMargin(val);
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Speichert…' : 'Speichern'}
          </Button>
          <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
            Zurücksetzen
          </Button>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
            Standard-Profil: {defaultProfileId ?? '–'} · Standard-Marge: {defaultMargin ?? '–'}%
          </span>
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

function formatMarginValue(margin: number | null | undefined): string {
  if (margin === null || margin === undefined) return '';
  const percent = Math.round(margin * 10000) / 100;
  return Number.isFinite(percent) ? String(percent) : '';
}

function buildMarginInputs(profiles: PriceProfile[]) {
  return Object.fromEntries(profiles.map((p) => [p.id, formatMarginValue(p.margin)]));
}

export default PricingPage;
