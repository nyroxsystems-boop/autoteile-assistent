
import { useState, useEffect } from 'react';
import { getConversations } from '../api/wws';

export function useConversations() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        try {
            const data = await getConversations();
            setConversations(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Laden der Konversationen');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return { conversations, loading, error, refresh };
}
