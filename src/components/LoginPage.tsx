'use client';

import React, { useState } from 'react';
import { Eye, Shield, Lock, ArrowRight, Satellite, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LoginPageProps {
  onClose?: () => void;
}

export function LoginPage({ onClose }: LoginPageProps) {
  const { loginAsViewer, loginAsAdmin } = useAuth();
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!password.trim()) {
      setError('Please enter the admin password');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await loginAsAdmin(password);
    if (!result.success) {
      setError(result.error || 'Authentication failed');
    } else {
      if (onClose) onClose();
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdminLogin();
  };

  return (
    <div className="absolute inset-0 z-[100] bg-grid flex items-center justify-center p-4 overflow-hidden"
      style={{ background: `var(--bg-deep)` }}
    >
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors btn-ghost"
        >
          Cancel
        </button>
      )}
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent-indigo) 0%, transparent 70%)' }}
      />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.03] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent-emerald) 0%, transparent 70%)' }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl animate-fade-in-scale">
        <div className="glass-panel-solid rounded-2xl p-8 md:p-12 space-y-8">

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
              style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
            >
              <Satellite className="w-8 h-8" style={{ color: 'var(--accent-indigo-light)' }} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              LEVIR-CD Evaluation
            </h1>
            <p className="text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
              Vision-Language Model Change Detection Assessment
            </p>
          </div>

          {/* Divider */}
          <div className="divider" />

          {/* Admin Login Card */}
          <div className="grid grid-cols-1 max-w-md mx-auto">
            <div
              className="text-left p-6 rounded-xl transition-all duration-300"
              style={{
                background: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
                e.currentTarget.style.boxShadow = '0 0 24px rgba(99, 102, 241, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99, 102, 241, 0.2)' }}
                >
                  <Shield className="w-5 h-5" style={{ color: 'var(--accent-indigo-light)' }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Admin Access
                </h3>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                Authenticate to manage evaluations, score responses, flag items, and configure settings.
              </p>

              <div className="space-y-3 animate-fade-in">
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm dark-input"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-xs animate-fade-in" style={{ color: 'var(--accent-rose)' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  onClick={handleAdminLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold btn-indigo disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Sign In as Admin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-2">
            <p className="text-label" style={{ color: 'var(--text-faint)' }}>
              Research Evaluation Tool • LEVIR-CD Dataset
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
