import { apiClient } from './client';
import type { PriceProfile } from '../features/settings/types';

export type MerchantSettings = {
  merchantId: string;
  selectedShops: string[];
  marginPercent: number;
  priceProfiles?: PriceProfile[];
};

export async function fetchMerchantSettings(merchantId: string): Promise<MerchantSettings | null> {
  try {
    const res = await apiClient.get<MerchantSettings>(`/dashboard/merchant/settings/${merchantId}`);
    return res as MerchantSettings;
  } catch (err: any) {
    // 404 -> return null
    if (err?.status === 404) return null;
    throw err;
  }
}

export async function saveMerchantSettings(
  merchantId: string,
  payload: { selectedShops?: string[]; marginPercent?: number; priceProfiles?: PriceProfile[] }
): Promise<boolean> {
  const res = await apiClient.post(`/dashboard/merchant/settings/${merchantId}`, payload);
  return !!(res && (res as any).ok);
}
