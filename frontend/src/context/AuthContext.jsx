import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('hr_token');
    const storedUser = localStorage.getItem('hr_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('hr_token');
        localStorage.removeItem('hr_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    const { token: t, ...userData } = data;
    localStorage.setItem('hr_token', t);
    localStorage.setItem('hr_user', JSON.stringify(userData));
    setToken(t);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    setToken(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback((perm) => {
    if (!user) return false;
    if (user.isAdmin || user.isSuperAdmin) return true;
    const permissions = user.permissions || [];
    return permissions.includes(perm);
  }, [user]);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('hr_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    isLoggedIn: !!token && !!user,
    login,
    logout,
    hasPermission,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
