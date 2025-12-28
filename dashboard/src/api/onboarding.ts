import { apiClient } from '../lib/apiClient';

export interface OnboardingInitResponse {
    sessionId: string;
    tenantId: string;
}

export const onboardingApi = {
    initialize: async (name: string, email: string) => {
        return apiClient.post<OnboardingInitResponse>('/api/admin/onboarding/initialize', { name, email });
    },

    configureTwilio: async (sessionId: string, phoneNumber: string, sid: string, token: string) => {
        return apiClient.post('/api/admin/onboarding/twilio', { sessionId, phoneNumber, sid, token });
    },

    importInventory: async (sessionId: string, csvData: string) => {
        return apiClient.post('/api/admin/onboarding/import', { sessionId, csvData });
    },

    connectShop: async (sessionId: string, shopType: 'shopify' | 'woocommerce', apiKey: string, shopUrl: string) => {
        return apiClient.post('/api/admin/onboarding/shop', { sessionId, shopType, apiKey, shopUrl });
    }
};
