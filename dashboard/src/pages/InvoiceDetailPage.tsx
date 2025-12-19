import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  cancelInvoice,
  downloadInvoicePdf,
  getInvoice,
  issueInvoice,
  markInvoicePaid,
  sendInvoice,
  type Invoice
} from '../api/invoices';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getInvoice(id);
      setInvoice(data);
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleAction = async (action: () => Promise<Invoice>) => {
    if (!id) return;
    try {
      const data = await action();
      setInvoice(data);
    } catch (err: any) {
      setError(err?.message || 'Aktion fehlgeschlagen');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          ← Zurück
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" onClick={() => handleAction(() => issueInvoice(id!))}>
            Nummer vergeben
          </Button>
          <Button size="sm" onClick={() => downloadInvoicePdf(id!)} disabled={!invoice}>
            PDF
          </Button>
          <Button size="sm" onClick={() => handleAction(() => sendInvoice(id!))}>
            Senden
          </Button>
          <Button size="sm" onClick={() => handleAction(() => markInvoicePaid(id!))}>
            Bezahlt
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleAction(() => cancelInvoice(id!))}>
            Stornieren
          </Button>
        </div>
      </div>

      <Card title={`Order ${invoice?.invoice_number || 'Draft'}`} subtitle={`Status: ${invoice?.status ?? '-'}`}>
        {loading ? <div className="skeleton-block" style={{ width: 200, height: 12 }} /> : null}
        {error ? <div className="error-box">{error}</div> : null}

        {invoice ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <strong>Total:</strong> {invoice.total} {invoice.currency}
            </div>
            <div>
              <strong>Fällig:</strong> {invoice.due_date || '—'}
            </div>
            <div>
              <strong>Bestellung:</strong> {invoice.order ?? '—'}
            </div>
            <div>
              <strong>Kunde:</strong> {invoice.contact ?? '—'}
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Beschreibung</th>
                    <th>Menge</th>
                    <th>Einzelpreis</th>
                    <th>Steuer %</th>
                    <th>Summe</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.lines ?? []).map((line) => (
                    <tr key={line.id}>
                      <td>{line.description}</td>
                      <td>{line.quantity}</td>
                      <td>{line.unit_price}</td>
                      <td>{line.tax_rate}</td>
                      <td>{line.line_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default InvoiceDetailPage;
