
import { useState, useEffect } from 'react';
import { getMeTenants } from '../api/wws';

export interface TenantMembership {
    id: number;
    tenant: number;
    tenant_name: string;
    tenant_slug: string;
    role: string;
    is_active: boolean;
}

export function useTenants() {
    const [tenants, setTenants] = useState<TenantMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTenantId, setCurrentTenantId] = useState<number | null>(null);

    useEffect(() => {
        async function load() {
            try {
                // Backend doesn't support multi-tenancy, use mock data
                const mockTenants: TenantMembership[] = [{
                    id: 1,
                    tenant: 1,
                    tenant_name: 'AutoTeile Müller GmbH',
                    tenant_slug: 'dealer-demo-001',
                    role: 'admin',
                    is_active: true
                }];

                setTenants(mockTenants);
                setCurrentTenantId(1);
                localStorage.setItem('selectedTenantId', '1');
            } catch (err) {
                console.error('Failed to load tenants', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const switchTenant = (id: number) => {
        setCurrentTenantId(id);
        localStorage.setItem('selectedTenantId', id.toString());
        // In a real app, this might trigger a page reload or update a context/header
        window.location.reload();
    };

    return {
        tenants,
        loading,
        currentTenant: tenants.find(t => t.tenant === currentTenantId),
        switchTenant
    };
}
