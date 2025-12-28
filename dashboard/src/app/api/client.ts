
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_TOKEN = import.meta.env.VITE_WAWI_API_TOKEN || 'api_dev_secret';

function getDeviceId() {
    let id = localStorage.getItem('deviceId');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('deviceId', id);
    }
    return id;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Multi-tenancy support
    const tenantId = localStorage.getItem('selectedTenantId');
    const token = localStorage.getItem('auth_access_token') || API_TOKEN;
    const deviceId = getDeviceId();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
        ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
        ...(token ? { 'Authorization': `Token ${token}` } : {}),
        ...(options.headers as any || {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `Request failed with status ${response.status}`);
    }

    // Some endpoints might return 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}
