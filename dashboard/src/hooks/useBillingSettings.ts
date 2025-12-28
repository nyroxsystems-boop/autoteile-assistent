import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface BillingSettings {
    company_name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    postal_code: string;
    country: string;
    tax_id: string;
    iban: string;
    email: string;
    phone: string;
    invoice_template: string;
    invoice_color: string;
    invoice_font: string;
    logo_position: string;
    number_position: string;
    address_layout: string;
    table_style: string;
    accent_color: string;
}

export const useBillingSettings = () => {
    const [settings, setSettings] = useState<BillingSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get<BillingSettings>('/api/settings/billing');
            setSettings(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load billing settings');
        } finally {
            setLoading(false);
        }
    };

    const update = async (updates: Partial<BillingSettings>) => {
        try {
            await apiClient.patch('/api/settings/billing', updates);
            setSettings((prev) => (prev ? { ...prev, ...updates } : null));
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to update settings');
            return false;
        }
    };

    return { settings, loading, error, update, reload: fetchSettings };
};
