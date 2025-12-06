import { apiClient } from './client';
import type { ApiError, Order, ShopOffer } from './types';

const logError = (context: string, error: unknown) => {
  const apiError = error as ApiError;
  console.error(`[ordersApi] ${context} error`, {
    message: apiError?.message ?? 'Unknown error',
    status: apiError?.status,
    url: apiError?.url,
    body: apiError?.body ?? apiError
  });
};

export const listOrders = async (): Promise<Order[]> => {
  console.log('[ordersApi] listOrders() called');
  console.log('[ordersApi] listOrders() request config', { method: 'GET', url: '/dashboard/orders' });

  try {
    const orders = await apiClient.get<Order[]>('/dashboard/orders');
    console.log('[ordersApi] listOrders() success', { count: orders?.length ?? 0 });
    return orders;
  } catch (error) {
    logError('listOrders()', error);
    throw error;
  }
};

export const getOrder = async (id: string): Promise<Order> => {
  console.log('[ordersApi] getOrder() called', { id });
  console.log('[ordersApi] getOrder() request config', { method: 'GET', url: `/dashboard/orders/${id}` });

  try {
    const order = await apiClient.get<Order>(`/dashboard/orders/${id}`);
    console.log('[ordersApi] getOrder() success', { id: order?.id ?? id, status: order?.status });
    return order;
  } catch (error) {
    logError('getOrder()', error);
    throw error;
  }
};

export const getOrderOffers = async (orderId: string): Promise<ShopOffer[]> => {
  console.log('[ordersApi] getOrderOffers() called', { orderId });
  console.log('[ordersApi] getOrderOffers() request config', {
    method: 'GET',
    url: `/dashboard/orders/${orderId}/offers`
  });

  try {
    const offers = await apiClient.get<ShopOffer[]>(`/dashboard/orders/${orderId}/offers`);
    console.log('[ordersApi] getOrderOffers() success', { orderId, count: offers?.length ?? 0 });
    return offers;
  } catch (error) {
    logError('getOrderOffers()', error);
    throw error;
  }
};

export const publishOffers = async (
  orderId: string,
  offerIds: string[]
): Promise<{ success: boolean }> => {
  console.log('[ordersApi] publishOffers() called', { orderId, offerIds });
  console.log('[ordersApi] publishOffers() request config', {
    method: 'POST',
    url: `/dashboard/orders/${orderId}/offers/publish`,
    body: { offerIds }
  });

  try {
    const response = await apiClient.post<{ success: boolean }>(
      `/dashboard/orders/${orderId}/offers/publish`,
      { offerIds }
    );
    console.log('[ordersApi] publishOffers() success', { orderId, offerIds, response });
    return response;
  } catch (error) {
    logError('publishOffers()', error);
    throw error;
  }
};
