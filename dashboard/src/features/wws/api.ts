import { apiClient } from '../../api/client';

export type ProviderType = 'demo_wws' | 'http_api' | 'scraper';

export interface WwsConnection {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  isActive: boolean;
  authConfig?: any;
  config?: any;
}

export interface CreateWwsConnectionInput {
  name: string;
  type: ProviderType;
  baseUrl: string;
  isActive?: boolean;
  authConfig?: any;
  config?: any;
}

export interface UpdateWwsConnectionInput {
  name?: string;
  type?: ProviderType;
  baseUrl?: string;
  isActive?: boolean;
  authConfig?: any;
  config?: any;
}

export interface TestConnectionResponse {
  ok: boolean;
  error?: string;
  sampleResultsCount?: number;
}

export async function fetchConnections(): Promise<WwsConnection[]> {
  return apiClient.get<WwsConnection[]>('/api/wws-connections');
}

export async function createConnection(input: CreateWwsConnectionInput): Promise<WwsConnection> {
  return apiClient.post<WwsConnection>('/api/wws-connections', input);
}

export async function updateConnection(
  id: string,
  input: UpdateWwsConnectionInput
): Promise<WwsConnection> {
  return apiClient.put<WwsConnection>(`/api/wws-connections/${id}`, input);
}

export async function deleteConnection(id: string): Promise<void> {
  await apiClient.delete(`/api/wws-connections/${id}`);
}

export async function testConnection(id: string, oemNumber: string): Promise<TestConnectionResponse> {
  return apiClient.post<TestConnectionResponse>(`/api/wws-connections/${id}/test`, { oemNumber });
}

export async function testInventory(oemNumber: string) {
  return apiClient.get<{ oemNumber: string; offers: any[] }>(
    `/api/bot/inventory/by-oem/${encodeURIComponent(oemNumber)}`
  );
}
