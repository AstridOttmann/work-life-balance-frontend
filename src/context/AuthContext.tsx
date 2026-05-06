import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { api, authApi } from '../services/api';

interface AuthContextValue {
  token: string | null;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem('email'));

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
  }, []);

  const login = useCallback(async (emailInput: string, password: string) => {
    const { token: newToken, email: newEmail } = await authApi.login(emailInput, password);
    localStorage.setItem('token', newToken);
    localStorage.setItem('email', newEmail);
    setToken(newToken);
    setEmail(newEmail);
  }, []);

  useEffect(() => {
    const resId = api.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) logout();
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(resId);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
