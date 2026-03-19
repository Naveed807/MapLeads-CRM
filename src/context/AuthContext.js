import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

// Decode a JWT payload (base64) without verifying — used to extract role/planTier
function decodeJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [org, setOrg]         = useState(null);
  const [loading, setLoading] = useState(true);

  // Load persisted user + org on mount
  useEffect(() => {
    const stored    = localStorage.getItem('mapleads_user');
    const storedOrg = localStorage.getItem('mapleads_org');
    const token     = localStorage.getItem('mapleads_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    if (storedOrg) {
      try { setOrg(JSON.parse(storedOrg)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const _persist = (data) => {
    // Augment user with role + planTier decoded from the JWT
    const payload     = decodeJwt(data.accessToken);
    const userWithMeta = {
      ...data.user,
      role:     payload?.role     ?? 'OWNER',
      planTier: payload?.planTier ?? 'BASIC',
      orgId:    payload?.orgId,
    };
    setUser(userWithMeta);
    setOrg(data.org ?? null);
    localStorage.setItem('mapleads_user',  JSON.stringify(userWithMeta));
    localStorage.setItem('mapleads_org',   JSON.stringify(data.org ?? null));
    localStorage.setItem('mapleads_token', data.accessToken);
    return { ...data, user: userWithMeta };
  };

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    return _persist(data);
  }, []);                              // eslint-disable-line react-hooks/exhaustive-deps

  const adminLogin = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    if (!data.user?.isAdmin) throw new Error('Not authorized as admin');
    return _persist(data);
  }, []);                              // eslint-disable-line react-hooks/exhaustive-deps

  const register = useCallback(async (name, email, password, orgName) => {
    const data = await authApi.register(name, email, password, orgName);
    return _persist(data);
  }, []);                              // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setUser(null);
    setOrg(null);
    localStorage.removeItem('mapleads_user');
    localStorage.removeItem('mapleads_org');
    localStorage.removeItem('mapleads_token');
  }, []);

  const isAdmin  = user?.isAdmin   === true;
  const planTier = user?.planTier  ?? org?.subscription?.plan?.tier ?? 'BASIC';
  const orgRole  = user?.role      ?? 'OWNER';

  return (
    <AuthContext.Provider value={{ user, org, loading, login, adminLogin, register, logout, isAdmin, planTier, orgRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
