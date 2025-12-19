import { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { listInvoices } from '../api/invoices';

type DocStatus = 'neu' | 'geprüft' | 'übermittelt' | 'fehler';
type TaxTag = 'ust' | 'keine_ust' | 'reverse';

type DocumentRow = {
  id: string;
  name: string;
  sender: string;
  date: string;
  amount: string;
  tax: TaxTag;
  status: DocStatus;
};

const statusLabel: Record<DocStatus, string> = {
  neu: 'Neu',
  geprüft: 'Geprüft',
  übermittelt: 'Übermittelt',
  fehler: 'Fehler'
};
const statusVariant: Record<DocStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  neu: 'neutral',
  geprüft: 'success',
  übermittelt: 'success',
  fehler: 'danger'
};
const taxLabel: Record<TaxTag, string> = {
  ust: 'USt',
  keine_ust: 'Keine USt',
  reverse: 'Reverse Charge'
};

const DocumentsPage = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'alle'>('alle');
  const [taxFilter, setTaxFilter] = useState<TaxTag | 'alle'>('alle');
  const [destination, setDestination] = useState('Finanzamt');
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const invoices = await listInvoices();
        const mapStatus = (status?: string): DocStatus => {
          const s = (status || '').toLowerCase();
          if (s === 'paid') return 'übermittelt';
          if (s === 'issued' || s === 'sent') return 'geprüft';
          if (s === 'canceled') return 'fehler';
          return 'neu';
        };
        const mapped: DocumentRow[] = invoices.map((inv) => ({
          id: inv.invoice_number || String(inv.id),
          name: inv.invoice_number ? `Order ${inv.invoice_number}` : `Order #${inv.id}`,
          sender: inv.billing_address_json?.company || 'Kunde',
          date: inv.issue_date || inv.created_at || new Date().toISOString(),
          amount: `${inv.total?.toFixed ? inv.total.toFixed(2) : inv.total || 0} ${inv.currency || 'EUR'}`,
          tax: 'ust',
          status: mapStatus(inv.status)
        }));
        setDocs(mapped);
      } catch (err) {
        console.error('[documents] load error', err);
        setError('Belege konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const term = search.toLowerCase();
      if (term && !(`${d.id} ${d.name} ${d.sender} ${d.amount}`.toLowerCase().includes(term))) return false;
      if (statusFilter !== 'alle' && d.status !== statusFilter) return false;
      if (taxFilter !== 'alle' && d.tax !== taxFilter) return false;
      return true;
    });
  }, [docs, search, statusFilter, taxFilter]);

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? [] : filtered.map((d) => d.id));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const bulkBarVisible = selectedIds.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Belege & Orders"
        subtitle="Zentrale Ablage für eingehende Dokumente"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm">Dokument hochladen</Button>
            <Button variant="ghost" size="sm">Export</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Suchen (Ordernummer, Absender, Betrag)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 280, flex: 1 }}
          />
          <select
            aria-label="Zeitraum"
            className="topbar-select"
            style={{ minWidth: 140 }}
          >
            <option>Letzte 7 Tage</option>
            <option>Letzte 30 Tage</option>
            <option>Dieses Jahr</option>
            <option>Vergangenes Jahr</option>
          </select>
          <select
            aria-label="Status"
            className="topbar-select"
            style={{ minWidth: 140 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="alle">Status (alle)</option>
            <option value="neu">Neu</option>
            <option value="geprüft">Geprüft</option>
            <option value="übermittelt">Übermittelt</option>
            <option value="fehler">Fehler</option>
          </select>
          <select
            aria-label="Steuer"
            className="topbar-select"
            style={{ minWidth: 140 }}
            value={taxFilter}
            onChange={(e) => setTaxFilter(e.target.value as any)}
          >
            <option value="alle">Steuer (alle)</option>
            <option value="ust">USt</option>
            <option value="keine_ust">Keine USt</option>
            <option value="reverse">Reverse Charge</option>
          </select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div style={{ padding: 12, color: 'var(--muted)' }}>Lade Belege...</div>
        ) : null}
        {error ? (
          <div style={{ padding: 12, color: 'var(--danger)' }}>{error}</div>
        ) : null}
        {bulkBarVisible ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', gap: 8 }}>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{selectedIds.length} ausgewählt</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="secondary">Herunterladen</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Auswahl aufheben</Button>
            </div>
          </div>
        ) : null}

        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
          <table className="table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Alle auswählen" /></th>
                <th>Dokument</th>
                <th>Absender</th>
                <th>Datum</th>
                <th>Betrag</th>
                <th>Steuer</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="table-row">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      aria-label={`${doc.name} auswählen`}
                    />
                  </td>
                  <td style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{doc.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{doc.id}</div>
                    </div>
                  </td>
                  <td>{doc.sender}</td>
                  <td>{new Date(doc.date).toLocaleDateString()}</td>
                  <td>{doc.amount}</td>
                  <td>
                    <Badge variant="neutral">{taxLabel[doc.tax]}</Badge>
                  </td>
                  <td>
                    <Badge variant={statusVariant[doc.status]}>{statusLabel[doc.status]}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm">Ansehen</Button>
                      <Button variant="ghost" size="sm">Download</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 16, color: 'var(--muted)' }}>Keine Dokumente gefunden.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Absendung / Behörden-Übermittlung" subtitle="Dokumente an Behörden oder Steuerberater senden. (UI-Demo)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Ziel wählen</div>
            <select
              className="topbar-select"
              aria-label="Ziel"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option>Finanzamt</option>
              <option>Steuerberater</option>
              <option>ELSTER</option>
              <option>Sonstige Behörde</option>
            </select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" defaultChecked /> Ausgewählte Dokumente
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" /> Zeitraum bündeln
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" defaultChecked /> Metadaten mitsenden (Absender, Betrag, Datum)
              </label>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
              Hinweis: UI / Demo – keine echte Übertragung.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={() => {
                setSendStatus(`Übermittlung vorbereitet (Demo) → ${destination}`);
              }}
            >
              Jetzt übermitteln
            </Button>
            {sendStatus ? <div style={{ color: 'var(--muted)' }}>{sendStatus}</div> : null}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DocumentsPage;
