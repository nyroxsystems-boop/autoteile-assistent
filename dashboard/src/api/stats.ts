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

  // TODO: Replace with real backend call once available.
  const dummy: OverviewStats = {
    ordersInPeriod: 42,
    incomingMessages: 128,
    abortedOrders: 3,
    conversionRate: 56,
    averageMargin: 21,
    averageBasket: 249.5
  };

  console.log('[stats] fetchOverviewStats returning dummy data', dummy);
  return Promise.resolve(dummy);
}
