import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [org, setOrg]         = useState(null);
  const [loading, setLoading] = useState(true);

  // Load persisted user on mount
  useEffect(() => {
    const stored = localStorage.getItem('mapleads_user');
    const token  = localStorage.getItem('mapleads_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    setOrg(data.org);
    localStorage.setItem('mapleads_user',  JSON.stringify(data.user));
    localStorage.setItem('mapleads_token', data.accessToken);
    return data;
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    if (!data.user?.isAdmin) throw new Error('Not authorized as admin');
    setUser(data.user);
    setOrg(data.org);
    localStorage.setItem('mapleads_user',  JSON.stringify(data.user));
    localStorage.setItem('mapleads_token', data.accessToken);
    return data;
  }, []);

  const register = useCallback(async (name, email, password, orgName) => {
    const data = await authApi.register(name, email, password, orgName);
    setUser(data.user);
    localStorage.setItem('mapleads_user',  JSON.stringify(data.user));
    localStorage.setItem('mapleads_token', data.accessToken);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setUser(null);
    setOrg(null);
    localStorage.removeItem('mapleads_user');
    localStorage.removeItem('mapleads_token');
  }, []);

  const isAdmin = user?.isAdmin === true;

  return (
    <AuthContext.Provider value={{ user, org, loading, login, adminLogin, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
