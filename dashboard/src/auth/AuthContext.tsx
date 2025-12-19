import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  AuthSession,
  clearTokens,
  getStoredSession,
  onUnauthorized,
  setTokens
} from '../lib/auth';

type AuthContextValue = {
  session: AuthSession | null;
  login: (email: string, password: string, tenant?: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const navigate = useNavigate();

  useEffect(() => {
    onUnauthorized(() => {
      logout();
    });
  }, []);

  const login = async (email: string, password: string, tenant?: string) => {
    try {
      const res = await apiClient.post<{
        access: string;
        refresh: string;
        user: any;
        tenant: any;
      }>('/api/auth/login', { email, password, tenant });

      const nextSession: AuthSession = {
        user: res.user,
        tenant: res.tenant,
        role: res?.tenant?.role
      };
      setTokens(res.access, res.refresh, nextSession);
      setSession(nextSession);
      return true;
    } catch (err) {
      console.error('[auth] login failed', err);
      return false;
    }
  };

  const logout = () => {
    clearTokens();
    setSession(null);
    navigate('/auth');
  };

  const value = useMemo(() => ({ session, login, logout }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) {
    if (import.meta.env.VITE_DISABLE_LOGIN === "true") { return children as any; }
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}
