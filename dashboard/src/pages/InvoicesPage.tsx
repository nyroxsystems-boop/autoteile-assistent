import { useEffect, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { listInvoices, type Invoice } from '../api/invoices';
import { Link } from 'react-router-dom';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listInvoices();
        setInvoices(data ?? []);
      } catch (err: any) {
        setError(err?.message || 'Fehler beim Laden der Orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Orders"
        subtitle="Alle Orders je Tenant."
        actions={
          <Button as={Link} to="/orders" variant="ghost" size="sm">
            Aus Bestellung erzeugen
          </Button>
        }
      >
        {loading ? <div className="skeleton-block" style={{ width: 200, height: 12 }} /> : null}
        {error ? (
          <div className="error-box">
            <strong>Fehler:</strong> {error}
          </div>
        ) : null}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Status</th>
                <th>Kunde</th>
                <th>Total</th>
                <th>Fällig</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoice_number || 'Draft'}</td>
                  <td>{inv.status}</td>
                  <td>{inv.contact || '-'}</td>
                  <td>
                    {inv.total} {inv.currency}
                  </td>
                  <td>{inv.due_date || '-'}</td>
                  <td>
                    <Button as={Link} to={`/orders/${inv.id}`} size="sm" variant="ghost">
                      Öffnen
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default InvoicesPage;
