
import { useState, useEffect } from 'react';
import { getDashboardSummary, DashboardSummary } from '../api/wws';

export function useDashboardSummary() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        try {
            const data = await getDashboardSummary();
            setSummary(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Laden der Zusammenfassung');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return { summary, loading, error, refresh };
}
