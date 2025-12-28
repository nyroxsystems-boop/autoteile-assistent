
import { useState, useEffect } from 'react';
import { getMerchantSettings, updateMerchantSettings, MerchantSettings } from '../api/wws';
import { toast } from 'sonner';

export function useMerchantSettings() {
    const [settings, setSettings] = useState<MerchantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        try {
            const data = await getMerchantSettings();
            setSettings(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Laden der Einstellungen');
        } finally {
            setLoading(false);
        }
    };

    const update = async (newSettings: Partial<MerchantSettings>) => {
        try {
            await updateMerchantSettings(newSettings);
            toast.success('Einstellungen gespeichert');
            refresh();
        } catch (err: any) {
            toast.error('Fehler beim Speichern');
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return { settings, loading, error, refresh, update };
}
