const ACCESS_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';
const SESSION_KEY = 'auth_session';

export type AuthSession = {
  user?: any;
  tenant?: any;
  role?: string;
};

let unauthorizedHandler: (() => void) | null = null;

export function setTokens(access?: string, refresh?: string, session?: AuthSession) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function onUnauthorized(fn: () => void) {
  unauthorizedHandler = fn;
}

export function triggerUnauthorized() {
  if (unauthorizedHandler) unauthorizedHandler();
}
