import { useEffect, useState } from 'react';
import Card from '../ui/Card';
import apiClient from '../lib/apiClient';

const SuppliersPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get('/api/dashboard/suppliers');
        const rows = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
        setRows(rows);
      } catch (err: any) {
        setError(err?.message ?? 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cols = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Suppliers</h1>
      <Card>
        {loading ? <div className="skeleton-block" style={{ width: 120, height: 12 }} /> : null}
        {error ? <div className="error-box">Fehler: {error}</div> : null}
        {!loading && !error && rows.length === 0 ? <div style={{ color: 'var(--muted)' }}>Keine Daten</div> : null}
        {rows.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {cols.map((c) => (
                      <td key={c}>{typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default SuppliersPage;
