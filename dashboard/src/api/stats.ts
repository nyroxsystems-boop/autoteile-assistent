export type OverviewStats = {
  ordersInPeriod: number;
  incomingMessages: number;
  abortedOrders: number;
  conversionRate: number;
  averageMargin: number;
  averageBasket: number;
};

export async function fetchOverviewStats(timeRange: string): Promise<OverviewStats> {
  console.log('[stats] fetchOverviewStats called', { timeRange });
  try {
    const { apiClient } = await import('./client');
    const apiStats = await apiClient.get<any>('/api/dashboard/stats');

    // Fallback/Derivation logic if data is missing
    const { listOrders } = await import('./orders');
    const orders = await listOrders();

    return {
      ordersInPeriod: apiStats.ordersCount ?? orders.length,
      incomingMessages: apiStats.incomingMessages ?? orders.length,
      abortedOrders: apiStats.abortedOrders ?? 0,
      conversionRate: 0,
      averageMargin: apiStats.averageMargin ?? 0,
      averageBasket: 0
    };
  } catch (error) {
    console.error('[stats] fetchOverviewStats error, returning safe defaults', error);
    return {
      ordersInPeriod: 0,
      incomingMessages: 0,
      abortedOrders: 0,
      conversionRate: 0,
      averageMargin: 0,
      averageBasket: 0
    };
  }
}
