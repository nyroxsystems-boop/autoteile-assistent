
import { useState, useEffect } from 'react';
import { getSuppliers, Supplier } from '../api/wws';

export function useSuppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const data = await getSuppliers();
                setSuppliers(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch suppliers:', err);
                setError('Fehler beim Laden der Lieferanten');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { suppliers, loading, error };
}
