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
    const { listOrders } = await import('./orders');
    const orders = await listOrders();

    const totalOrders = orders.length;
    const aborted = orders.filter((o) => (o.status ?? '').toLowerCase().includes('abort')).length;
    const completed = orders.filter((o) => (o.status ?? '').toLowerCase().includes('paid') || (o.status ?? '').toLowerCase().includes('confirmed')).length;
    const conversionRate = totalOrders ? Math.round((completed / totalOrders) * 100) : 0;
    const averageBasket =
      totalOrders && orders.some((o) => o.totalPrice || (o as any).total_price)
        ? Number(
            orders.reduce((sum, o) => {
              const val = (o as any).total_price ?? (o as any).totalPrice ?? 0;
              return sum + Number(val || 0);
            }, 0) / totalOrders
          )
        : 0;

    const stats: OverviewStats = {
      ordersInPeriod: totalOrders,
      incomingMessages: orders.length, // proxy until dedicated metric exists
      abortedOrders: aborted,
      conversionRate,
      averageMargin: 0, // unknown without dedicated field
      averageBasket: Math.round(averageBasket * 100) / 100
    };

    console.log('[stats] fetchOverviewStats derived', stats);
    return stats;
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
