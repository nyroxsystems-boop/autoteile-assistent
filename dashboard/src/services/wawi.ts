import { apiClient } from '../lib/apiClient';
import { endpoints } from './endpoints';

export const wawiService = {
  getMe: () => apiClient.get(endpoints.me),
  health: () => apiClient.get(endpoints.health),

  resolve: (params: { phone_number_id?: string; tenant_id?: string }) =>
    apiClient.get(endpoints.resolve, { query: params }),

  upsertContact: (payload: any) => apiClient.post(endpoints.upsertContact, payload),

  inventoryByOem: (oem: string) => apiClient.get(endpoints.inventoryByOem(oem)),

  confirmOrder: (orderId: string | number, payload: any) =>
    apiClient.post(endpoints.confirmOrder(orderId), payload)
};
