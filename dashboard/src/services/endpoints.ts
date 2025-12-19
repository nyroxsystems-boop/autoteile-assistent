export const endpoints = {
  me: '/api/user/',
  health: '/api/health',
  resolve: '/api/whatsapp/resolve',
  upsertContact: '/api/contacts/upsert',
  inventoryByOem: (oem: string) => `/api/bot/inventory/by-oem/${encodeURIComponent(oem)}`,
  confirmOrder: (orderId: string | number) => `/api/orders/${orderId}/confirm`
};
