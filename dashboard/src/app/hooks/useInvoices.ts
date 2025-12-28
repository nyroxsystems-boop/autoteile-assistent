
import { useState, useEffect } from 'react';
import { getInvoices, Invoice } from '../api/wws';

export function useInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const data = await getInvoices();
                setInvoices(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch invoices:', err);
                setError('Fehler beim Laden der Rechnungen');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { invoices, loading, error };
}
