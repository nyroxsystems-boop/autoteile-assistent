
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Basic dynamic tenant ID from localStorage (set by Auth System)
const getTenantId = () => {
    const user = localStorage.getItem('auth_user');
    if (user) {
        try {
            const parsed = JSON.parse(user);
            return parsed.tenantId || "public";
        } catch (e) { return "public"; }
    }
    return "public";
};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to inject current Tenant ID
api.interceptors.request.use((config) => {
    const tenantId = getTenantId();
    if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId;
    }
    return config;
});

export interface Product {
    pk: number;
    name: string;
    description: string;
    IPN?: string; // Internal Part Number
    active: boolean;
    image?: string;
    category?: number;
    default_location?: number;
    metadata?: any;
    stock?: number;

    // Auto-Parts Specifics (Premium WWS)
    oe_number?: string;       // Originalteile-Nummer (Critical)
    manufacturer?: string;    // e.g. Bosch, ATE
    location?: string;        // Storage Location (e.g. A-01-02)
}

export const ProductService = {
    async listProducts(search: string = ''): Promise<Product[]> {
        const response = await api.get('/api/products', {
            params: { search }
        });
        return response.data;
    },

    async getProduct(id: number): Promise<Product> {
        const response = await api.get(`/api/products/${id}`);
        return response.data;
    },

    async createProduct(data: Partial<Product>): Promise<Product> {
        const response = await api.post('/api/products', data);
        return response.data;
    },

    async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
        const response = await api.patch(`/api/products/${id}`, data);
        return response.data;
    },

    async adjustStock(id: number, action: 'add' | 'remove' | 'count', quantity: number): Promise<any> {
        const response = await api.post(`/api/products/${id}/stock`, { action, quantity });
        return response.data;
    }
};
