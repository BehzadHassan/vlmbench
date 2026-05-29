'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LandingPage } from '@/components/LandingPage';
// trigger recompile
import { ViewerDashboard } from '@/components/ViewerDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';

export default function Page() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 rounded-full animate-spin"
            style={{ borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent-indigo)' }}
          />
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Initializing...
          </span>
        </div>
      </div>
    );
  }

  if (role === 'viewer') return <ViewerDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  
  return <LandingPage />;
}
