
import { useState, useEffect } from 'react';
import { getMe, MeResponse } from '../api/wws';

export function useMe() {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await getMe();
                setMe(data);
            } catch (err: any) {
                console.error('Failed to load user profile', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { me, loading, error };
}
