import type { ApiError } from './types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions = {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    '[api] VITE_API_BASE_URL is not set. Falling back to http://localhost:3000. Update your .env file to point to the bot-service backend.'
  );
}

const buildUrl = (path: string, query?: ApiRequestOptions['query']) => {
  const resolvedPath =
    path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const url = new URL(resolvedPath);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

const parseJsonSafe = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('[api] response parse fallback (non-JSON body)', error);
    return text;
  }
};

const toApiError = (input: {
  message: string;
  status?: number;
  url?: string;
  body?: unknown;
}): ApiError & Error => {
  const error = new Error(input.message) as Error & ApiError;
  error.status = input.status;
  error.url = input.url;
  error.body = input.body;
  return error;
};

const request = async <T>(
  method: HttpMethod,
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { query, body, headers = {} } = options;
  const url = buildUrl(path, query);
  const shouldSendBody =
    body !== undefined && body !== null && method !== 'GET' && method !== 'DELETE';
  const requestHeaders = shouldSendBody
    ? { 'Content-Type': 'application/json', ...headers }
    : headers;

  console.log('[api] request:start', {
    method,
    url,
    query: query ?? null,
    body: body ?? null,
    headers: requestHeaders
  });

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: shouldSendBody ? JSON.stringify(body) : undefined
    });

    const raw = await response.text();
    const parsed = parseJsonSafe(raw);

    if (response.ok) {
      console.log('[api] response:success', {
        method,
        url,
        status: response.status,
        data: parsed
      });
      return parsed as T;
    }

    const apiError = toApiError({
      message: `API request failed (${response.status}) for ${method} ${url}`,
      status: response.status,
      url,
      body: parsed
    });
    console.error('[api] response:error', apiError);
    throw apiError;
  } catch (error) {
    const apiError = toApiError({
      message: (error as Error)?.message ?? 'Unknown network error',
      url,
      status: (error as ApiError)?.status,
      body: (error as ApiError)?.body
    });
    console.error('[api] request:exception', apiError);
    throw apiError;
  }
};

export const apiClient = {
  request,
  get: <T>(path: string, options: ApiRequestOptions = {}) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options: ApiRequestOptions = {}) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options: ApiRequestOptions = {}) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options: ApiRequestOptions = {}) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options: ApiRequestOptions = {}) =>
    request<T>('DELETE', path, options)
};
