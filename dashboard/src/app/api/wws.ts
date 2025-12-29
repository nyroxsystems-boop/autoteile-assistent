/// <reference types="vite/client" />
import { apiFetch } from './client';

// Aligned with bot-service/src/types/dashboard.ts

export interface Order {
    id: string; // UUID
    status: string; // 'new' | 'in_progress' | 'done'
    language?: string | null;
    created_at: string;
    updated_at: string;
    createdAt?: string;
    updatedAt?: string;
    customerId?: string | null;
    customerPhone?: string | null;

    // Vehicle Data
    vehicle?: {
        vin?: string | null;
        hsn?: string | null;
        tsn?: string | null;
        make?: string | null;
        model?: string | null;
        year?: number | null;
        engine?: string | null;
    } | null;

    // Part Data
    part?: {
        partCategory?: string | null;
        position?: string | null;
        partText?: string | null;
        partDetails?: Record<string, any> | null;
        oemStatus?: "pending" | "success" | "not_found" | "multiple_matches" | null;
        oemNumber?: string | null;
    } | null;

    oem_number?: string | null;

    // Legacy support (optional)
    external_ref?: string;
    order_data?: any;
    contact?: { name: string; wa_id?: string };

    // Aliases found in legacy code
    vehicle_json?: any; // To allow legacy code to compile, though undefined
    part_json?: any;
    oem?: string;
}

export interface Offer {
    id: string;
    orderId: string;
    shopName?: string; // e.g. "Autodoc"
    supplierName?: string; // Compatibility

    // Product Info
    brand: string;
    productName: string;
    oemNumber?: string | null;
    sku?: string; // Optional if scraping gives it

    // Pricing
    basePrice: number;
    currency?: string;
    deliveryTimeDays?: number;

    // Meta
    status: string; // 'draft' | 'published'
    tier?: string | null;
    meta_json?: any;

    // Frontend helpers
    product_name?: string; // Alias
    price?: string; // Alias for display
}

export interface Invoice {
    id: number;
    invoice_number: string;
    status: 'draft' | 'issued' | 'paid' | 'canceled';
    total: string;
    currency: string;
    issue_date: string;
    due_date: string;
    order?: number;
    contact?: {
        name: string;
    };
}

export interface Supplier {
    id: number;
    name: string;
    rating: string;
    api_type: string;
    status?: string;
    lastUpdate?: string;
    reliability?: number;
    created_at?: string;
    updated_at?: string;
}

export interface DashboardSummary {
    ordersNew: number;
    ordersInProgress: number;
    invoicesDraft: number;
    invoicesIssued: number;
    revenueToday: number;
    revenueHistory?: Array<{ date: string; revenue: number; orders: number }>;
    topCustomers?: Array<{ name: string; revenue: number; orders: number; avatar: string }>;
    activities?: Array<{ id: string; type: 'message' | 'quote' | 'order' | 'completed'; customer: string; description: string; time: string; status: 'waiting' | 'processing' | 'success' | 'error' }>;
    avgMargin?: number;
    marginRevenue?: number;
    lastSync: string;
}

export interface MeResponse {
    user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        is_owner: boolean;
    };
    tenant: {
        id: number;
        name: string;
        slug: string;
    } | null;
}

export interface MerchantSettings {
    merchantId: string;
    selectedShops: string[];
    marginPercent: number;
    priceProfiles: any[];
}

export interface Message {
    id: string;
    direction: 'IN' | 'OUT';
    content: string;
    createdAt: string;
    isFromCustomer: boolean;
}

export interface AdminStats {
    total_tenants: number;
    total_users: number;
    total_devices: number;
    tenants: Array<{
        id: number;
        name: string;
        slug: string;
        user_count: number;
        max_users: number;
        device_count: number;
        max_devices: number;
        is_active: boolean;
    }>;
}

export interface ActiveDevice {
    id: number;
    user: string;
    device_id: string;
    last_seen: string;
    ip: string;
    ua: string;
}

export async function getOrders(): Promise<Order[]> {
    return apiFetch<Order[]>('/api/dashboard/orders');
}

export async function getOrderMessages(orderId: string | number): Promise<Message[]> {
    return apiFetch<Message[]>(`/api/dashboard/orders/${orderId}/messages`);
}

export async function sendMessage(orderId: string | number, content: string): Promise<Message> {
    return apiFetch<Message>(`/api/dashboard/orders/${orderId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
    });
}

export async function getOrderOffers(orderId: string | number): Promise<Offer[]> {
    return apiFetch<Offer[]>(`/api/offers?orderId=${orderId}`);
}

export async function createOffer(orderId: string | number, offerData: any): Promise<Offer> {
    return apiFetch<Offer>(`/api/dashboard/orders/${orderId}/offers`, {
        method: 'POST',
        body: JSON.stringify(offerData)
    });
}

export async function publishOffers(orderId: string | number, offerIds: number[]): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/dashboard/orders/${orderId}/offers/publish`, {
        method: 'POST',
        body: JSON.stringify({ offerIds }),
    });
}

export async function createInvoice(orderId: number): Promise<Invoice> {
    return apiFetch(`/api/dashboard/orders/${orderId}/create-invoice`, {
        method: 'POST',
    });
}

export async function getInvoices(): Promise<Invoice[]> {
    return apiFetch<Invoice[]>('/api/billing/invoices');
}

export async function getSuppliers(): Promise<Supplier[]> {
    return apiFetch<Supplier[]>('/api/suppliers');
}

export async function login(credentials: { email?: string, username?: string, password?: string, tenant?: string }): Promise<any> {
    const device_id = localStorage.getItem('deviceId');
    const data = await apiFetch<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ ...credentials, device_id }),
    });
    if (data.access) {
        localStorage.setItem('auth_access_token', data.access);
        if (data.refresh) localStorage.setItem('auth_refresh_token', data.refresh);
    }
    return data;
}

export async function getMeTenants(): Promise<any[]> {
    return apiFetch<any[]>('/api/auth/me/tenants');
}

export async function getCustomers(): Promise<any[]> {
    return apiFetch<any[]>('/api/customers');
}

export async function getConversations(): Promise<any[]> {
    return apiFetch<any[]>('/api/conversations');
}

export async function downloadInvoicePdf(id: number): Promise<void> {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/billing/invoices/${id}/pdf`);
    if (!response.ok) throw new Error('PDF download failed');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${id}.pdf`;
    a.click();
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
    return apiFetch<DashboardSummary>('/api/dashboard/stats');
}

export async function getMe(): Promise<MeResponse> {
    return apiFetch<MeResponse>('/api/auth/me');
}

export async function getBotHealth(): Promise<{ status: string }> {
    return apiFetch<{ status: string }>('/api/bot/health');
}

export async function getMerchantSettings(): Promise<MerchantSettings> {
    return apiFetch<MerchantSettings>('/api/dashboard/merchant/settings/dealer-demo-001');
}

export async function updateMerchantSettings(settings: Partial<MerchantSettings>): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>('/api/dashboard/merchant/settings/dealer-demo-001', {
        method: 'POST',
        body: JSON.stringify(settings),
    });
}
export async function getAdminStats(): Promise<AdminStats> {
    return apiFetch<AdminStats>('/admin-stats/');
}

export async function listActiveDevices(tenantId: number): Promise<ActiveDevice[]> {
    return apiFetch<ActiveDevice[]>(`/tenants/${tenantId}/devices/`);
}

export async function removeActiveDevice(tenantId: number, deviceId: string): Promise<void> {
    return apiFetch(`/tenants/${tenantId}/remove-device/`, {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId }),
    });
}

export async function updateTenantLimits(tenantId: number, limits: { max_users: number, max_devices: number }): Promise<void> {
    return apiFetch(`/tenants/${tenantId}/`, {
        method: 'PATCH',
        body: JSON.stringify(limits),
    });
}

export async function createTenantUser(tenantId: number, userData: any): Promise<void> {
    return apiFetch(`/tenants/${tenantId}/users/`, {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

export async function getTeam(): Promise<any[]> {
    return apiFetch<any[]>('/auth/team/');
}

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

export async function getBillingSettings(): Promise<BillingSettings> {
    return apiFetch<BillingSettings>('/billing/settings/billing/tenant/');
}

export async function updateBillingSettings(settings: Partial<BillingSettings>): Promise<void> {
    return apiFetch('/billing/settings/billing/tenant/', {
        method: 'PUT',
        body: JSON.stringify(settings),
    });
}
