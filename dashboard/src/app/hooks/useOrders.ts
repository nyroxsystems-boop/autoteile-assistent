
import { useState, useEffect } from 'react';
import { getOrders, Order } from '../api/wws';

export function useOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getOrders();
            setOrders(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return { orders, loading, error, refresh: fetchOrders };
}
