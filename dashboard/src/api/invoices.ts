import { apiClient } from './client';
import type { Order } from './types';

export type InvoiceLine = {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total?: number;
};

export type Invoice = {
  id: string;
  invoice_number: string | null;
  status: string;
  order: string | null;
  contact: string | null;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  currency: string;
  billing_address_json?: any;
  shipping_address_json?: any;
  lines?: InvoiceLine[];
  created_at?: string;
};

const mapOrderToInvoice = (order: Order): Invoice => ({
  id: String(order.id),
  invoice_number: (order as any)?.external_ref ?? null,
  status: order.status ?? 'draft',
  order: String(order.id),
  contact: (order as any)?.contact ?? null,
  issue_date: (order as any)?.created_at ?? (order as any)?.createdAt ?? null,
  due_date: null,
  subtotal: Number((order as any)?.total_price ?? (order as any)?.totalPrice ?? 0),
  tax_total: 0,
  total: Number((order as any)?.total_price ?? (order as any)?.totalPrice ?? 0),
  currency: (order as any)?.currency ?? 'EUR',
  billing_address_json: (order as any)?.billing_address_json,
  shipping_address_json: (order as any)?.shipping_address_json,
  lines: (order as any)?.lines ?? [],
  created_at: (order as any)?.created_at ?? (order as any)?.createdAt ?? undefined
});

export const listInvoices = async (): Promise<Invoice[]> => {
  const orders = await apiClient.get<Order[]>('/api/dashboard/orders');
  return (orders ?? []).map(mapOrderToInvoice);
};

export const getInvoice = async (id: string | number): Promise<Invoice> => {
  const order = await apiClient.get<Order>(`/api/dashboard/orders/${id}`);
  return mapOrderToInvoice(order);
};

export const createInvoice = async (payload: Partial<Invoice>): Promise<Invoice> => {
  const created = await apiClient.post<Order>('/api/dashboard/orders', payload);
  return mapOrderToInvoice(created);
};

export const issueInvoice = async (id: string | number): Promise<Invoice> => getInvoice(id);
export const sendInvoice = async (id: string | number): Promise<Invoice> => getInvoice(id);
export const markInvoicePaid = async (id: string | number): Promise<Invoice> => getInvoice(id);
export const cancelInvoice = async (id: string | number): Promise<Invoice> => getInvoice(id);

export const downloadInvoicePdf = async (_id: string | number) => {
  console.warn('[invoices] PDF Download nicht verfügbar (Orders-Proxy)');
};

export const createInvoiceFromOrder = async (orderId: string | number): Promise<Invoice> =>
  getInvoice(orderId);
