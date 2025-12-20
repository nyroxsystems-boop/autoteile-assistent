type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions = {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const ENV_USER_TOKEN = import.meta.env.VITE_WAWI_API_TOKEN;
const ENV_SERVICE_TOKEN = import.meta.env.VITE_WAWI_SERVICE_TOKEN;
const isDev = import.meta.env.DEV;

const SERVICE_PATHS = [
  '/api/orders',
  '/api/offers',
  '/api/suppliers',
  '/api/wws-connections',
  '/api/dealers/',
  '/api/requests',
  '/api/bot/'
];

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
    if (isDev) console.warn('[api] response parse fallback (non-JSON body)', error);
    return text;
  }
};

const normalizePath = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      return new URL(path).pathname || '/';
    } catch {
      return '/';
    }
  }
  if (!path.startsWith('/')) return `/${path}`;
  return path;
};

const isServicePath = (path: string) => {
  const p = normalizePath(path);
  return SERVICE_PATHS.some((prefix) => p.startsWith(prefix));
};

const userTokenHeader = () => {
  const envToken = ENV_USER_TOKEN;
  if (envToken) return `Token ${envToken}`;
  try {
    const stored = localStorage.getItem('auth_access_token');
    return stored ? `Token ${stored}` : undefined;
  } catch {
    return envToken ? `Token ${envToken}` : undefined;
  }
};

const serviceTokenHeader = () => {
  const svc = ENV_SERVICE_TOKEN;
  return svc ? `Bearer ${svc}` : undefined;
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

  const requestHeaders: Record<string, string> = {
    ...(shouldSendBody ? { 'Content-Type': 'application/json' } : {}),
    ...headers
  };

  const needsService = isServicePath(path);
  const auth = needsService ? serviceTokenHeader() : userTokenHeader();

  if (auth) {
    requestHeaders.Authorization = auth;
  } else if (isDev) {
    console.warn(
      `[api] kein ${needsService ? 'Service' : 'User'} Token gesetzt (VITE_${
        needsService ? 'WAWI_SERVICE_TOKEN' : 'WAWI_API_TOKEN'
      })`
    );
  }

  if (isDev) {
    console.log('[api] request', {
      method,
      url,
      query: query ?? null,
      body: body ?? null,
      authType: needsService ? 'service' : 'user'
    });
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: shouldSendBody ? JSON.stringify(body) : undefined
  });

  const raw = await response.text();
  const parsed = parseJsonSafe(raw);

  if (response.ok) {
    if (isDev) console.log('[api] response ok', { method, url, status: response.status, parsed });
    return parsed as T;
  }

  const error = new Error(`API request failed (${response.status}) for ${method} ${url}`);
  (error as any).status = response.status;
  (error as any).body = parsed;
  if (isDev) console.error('[api] response error', error);
  throw error;
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
  delete: <T>(path: string, options: ApiRequestOptions = {}) => request<T>('DELETE', path, options)
};

type ApiResponse<T> = { data: T };

const wrapResponse = async <T>(promise: Promise<T>): Promise<ApiResponse<T>> => ({
  data: await promise
});

const apiClientDefault = {
  request: <T = any>(method: HttpMethod, path: string, options: ApiRequestOptions = {}) =>
    wrapResponse(apiClient.request<T>(method, path, options)),
  get: <T = any>(path: string, options: ApiRequestOptions = {}) =>
    wrapResponse(apiClient.get<T>(path, options)),
  post: <T = any>(path: string, body?: unknown, options: ApiRequestOptions = {}) =>
    wrapResponse(apiClient.post<T>(path, body, options)),
  put: <T = any>(path: string, body?: unknown, options: ApiRequestOptions = {}) =>
    wrapResponse(apiClient.put<T>(path, body, options)),
  patch: <T = any>(path: string, body?: unknown, options: ApiRequestOptions = {}) =>
    wrapResponse(apiClient.patch<T>(path, body, options)),
  delete: <T = any>(path: string, options: ApiRequestOptions = {}) =>
    wrapResponse(apiClient.delete<T>(path, options))
};

export default apiClientDefault;
