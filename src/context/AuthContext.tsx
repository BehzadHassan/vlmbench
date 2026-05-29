'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'viewer' | 'admin' | null;

interface AuthContextType {
  role: UserRole;
  adminToken: string | null;
  isLoading: boolean;
  loginAsViewer: () => void;
  loginAsAdmin: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedRole = sessionStorage.getItem('levir-role') as UserRole;
    const savedToken = sessionStorage.getItem('levir-admin-token');
    if (savedRole === 'admin' && savedToken) {
      setRole('admin');
      setAdminToken(savedToken);
    } else {
      setRole('viewer');
    }
    setIsLoading(false);
  }, []);

  const loginAsViewer = useCallback(() => {
    setRole('viewer');
    setAdminToken(null);
    sessionStorage.setItem('levir-role', 'viewer');
    sessionStorage.removeItem('levir-admin-token');
  }, []);

  const loginAsAdmin = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      setRole('admin');
      setAdminToken(data.token);
      sessionStorage.setItem('levir-role', 'admin');
      sessionStorage.setItem('levir-admin-token', data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const logout = useCallback(() => {
    setRole('viewer');
    setAdminToken(null);
    sessionStorage.removeItem('levir-role');
    sessionStorage.removeItem('levir-admin-token');
  }, []);

  return (
    <AuthContext.Provider value={{ role, adminToken, isLoading, loginAsViewer, loginAsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
