
import { useState, useEffect } from 'react';
import { getCustomers } from '../api/wws';

export function useCustomers() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        try {
            const data = await getCustomers();
            setCustomers(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Laden der Kunden');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return { customers, loading, error, refresh };
}
