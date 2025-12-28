
import { useState, useEffect } from 'react';
import { getBillingSettings, updateBillingSettings, BillingSettings } from '../api/wws';
import { toast } from 'sonner';

export function useBillingSettings() {
    const [settings, setSettings] = useState<BillingSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        try {
            const data = await getBillingSettings();
            setSettings(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Laden der Rechnungs-Einstellungen');
        } finally {
            setLoading(false);
        }
    };

    const update = async (newSettings: Partial<BillingSettings>) => {
        try {
            await updateBillingSettings(newSettings);
            toast.success('Design-Einstellungen gespeichert');
            refresh();
        } catch (err: any) {
            toast.error('Fehler beim Speichern des Designs');
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return { settings, loading, error, refresh, update };
}
