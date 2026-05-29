'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Shield, ArrowRight, Lock, AlertCircle, Map, CheckCircle2, BarChart3, Layers, Scan, Cpu, BrainCircuit, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// --- Image Compare Component ---
const ImageCompare = ({ before, after, mask }: { before: string; after: string; mask?: string }) => {
  const [position, setPosition] = useState(50);
  const [showMask, setShowMask] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent | PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center w-full">
      <div 
        ref={containerRef}
        className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 group select-none cursor-ew-resize"
        onPointerDown={(e) => {
          setIsDragging(true);
          const rect = containerRef.current!.getBoundingClientRect();
          const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
          setPosition((x / rect.width) * 100);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          setIsDragging(false);
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        {/* Background (Before Image) */}
        <img src={before} alt="Before" className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none" />
        
        {/* Foreground (After Image) clipped */}
        <div 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img src={after} alt="After" className="absolute top-0 left-0 w-full h-full object-cover" />
          
          {/* Mask Overlay */}
          {mask && (
            <img 
              src={mask} 
              alt="Mask" 
              className="absolute top-0 left-0 w-full h-full object-cover mix-blend-screen"
              style={{ 
                opacity: showMask ? 0.8 : 0,
                transition: 'opacity 0.3s ease',
                filter: 'sepia(100%) hue-rotate(300deg) saturate(300%)'
              }} 
            />
          )}
        </div>

        {/* Visual Divider */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 pointer-events-none"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center gap-0.5 border border-slate-100">
            <div className="w-4 h-4 text-slate-400 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-full h-full">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
            <div className="w-4 h-4 text-slate-400 flex items-center justify-center rotate-180">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-full h-full">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Labels */}
        <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider z-10 border border-white/10 shadow-lg pointer-events-none">T1: Before</div>
        <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider z-10 border border-white/10 shadow-lg pointer-events-none">T2: After</div>
      </div>

      {/* Mask Toggle Button */}
      {mask && (
        <button 
          onClick={() => setShowMask(!showMask)}
          className="mt-8 px-6 py-2 rounded-full text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
          style={{ 
            background: showMask ? 'var(--accent-indigo)' : 'var(--bg-surface)', 
            color: showMask ? '#fff' : 'var(--text-primary)',
            border: `1px solid ${showMask ? 'transparent' : 'var(--border-strong)'}`
          }}
        >
          <Scan className="w-4 h-4" />
          {showMask ? 'Hide Detection Mask' : 'Show Detection Mask'}
        </button>
      )}
    </div>
  );
};

export function LandingPage() {
  const { loginAsViewer, loginAsAdmin } = useAuth();
  
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Animation trigger
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleAdminLogin = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    const result = await loginAsAdmin(password);
    
    if (!result.success) {
      setError(result.error || 'Authentication failed');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdminLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-grid" style={{ background: 'var(--bg-deep)' }}>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[50vh] pointer-events-none opacity-60" style={{ background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.08), transparent)' }} />
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'rgba(99, 102, 241, 0.15)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'rgba(16, 185, 129, 0.1)' }} />

      <div className="flex-1 flex flex-col items-center p-6 lg:p-12 z-10 w-full">
        <div className={`max-w-6xl w-full flex flex-col items-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* --- HERO SECTION --- */}
          <div className="text-center space-y-8 mb-24 mt-12 w-full">
            <div className="inline-flex items-center justify-center p-2 rounded-2xl mx-auto shadow-xl glass-panel hover:scale-105 transition-transform cursor-default"
              style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)' }}
            >
              <div className="w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-sky-500 opacity-90" />
                <Layers className="w-8 h-8 text-white relative z-10" />
              </div>
            </div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide border border-indigo-500/20 bg-indigo-500/10 text-indigo-600">
                Next-Gen Vision-Language Evaluation
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
                Decode the Earth's <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500">
                  Changing Surface
                </span>
              </h1>
              <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                A sophisticated platform designed for researchers and analysts to review, score, and evaluate Vision-Language Models on the LEVIR-CD dataset.
              </p>
            </div>

            {/* Dataset Details Quick Look */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-white border shadow-sm flex flex-col items-center text-center transition-transform hover:-translate-y-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Qwen2-VL-2B-Instruct</div>
                <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Model Evaluated</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border shadow-sm flex flex-col items-center text-center transition-transform hover:-translate-y-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="text-3xl font-black mb-1" style={{ color: 'var(--accent-indigo)' }}>4</div>
                <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Different Prompts</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border shadow-sm flex flex-col items-center text-center transition-transform hover:-translate-y-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="text-3xl font-black mb-1" style={{ color: 'var(--accent-emerald)' }}>64</div>
                <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Total Image Sets</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border shadow-sm flex flex-col items-center text-center transition-transform hover:-translate-y-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="text-2xl font-black mb-1" style={{ color: 'var(--accent-amber)' }}>LEVIR-CD</div>
                <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Source Dataset</div>
              </div>
            </div>
          </div>

          {/* --- INTERACTIVE SAMPLE SECTION --- */}
          <div className="w-full max-w-5xl mb-32 group">
            <div className="flex flex-col items-center mb-8">
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>See It In Action</h2>
              <p className="text-center max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                Experience our interactive comparison tool. Drag the slider to instantly spot urban development and surface changes between Time 1 and Time 2.
              </p>
            </div>
            
            <div className="p-4 rounded-[2rem] bg-white/50 backdrop-blur-xl border border-slate-200/50 shadow-2xl">
              {/* Uses real val_9 LEVIR-CD data */}
              <ImageCompare before="/images/val_9_A.png" after="/images/val_9_B.png" mask="/images/val_9_label.png" />
            </div>
          </div>

          {/* --- HOW IT WORKS / PIPELINE --- */}
          <div className="w-full mb-32">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>The Evaluation Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent -translate-y-1/2 z-0" />

              {[
                { icon: <Scan className="w-6 h-6" />, title: "Data Ingestion", desc: "High-resolution satellite pairs are loaded into the workspace.", color: "sky" },
                { icon: <Cpu className="w-6 h-6" />, title: "VLM Processing", desc: "AI models generate change captions and masks automatically.", color: "indigo" },
                { icon: <Activity className="w-6 h-6" />, title: "Human Review", desc: "Experts evaluate model outputs for accuracy and hallucinations.", color: "emerald" },
                { icon: <BrainCircuit className="w-6 h-6" />, title: "Insights", desc: "Aggregated scores improve future model iterations.", color: "amber" }
              ].map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-xl hover:-translate-y-2 transition-transform duration-300">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                    style={{ background: `var(--accent-${step.color})`, color: '#fff' }}
                  >
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-px mb-24" style={{ background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)' }} />

          {/* --- ACCESS ROLES SECTION --- */}
          <div className="w-full max-w-5xl mb-16">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>Enter the Workspace</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Viewer Card */}
              <button
                onClick={loginAsViewer}
                className="group text-left p-10 rounded-[2rem] transition-all duration-500 cursor-pointer relative overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = 'var(--accent-indigo-light)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12 pointer-events-none">
                  <Eye className="w-64 h-64" style={{ color: 'var(--accent-indigo)' }} />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 text-white group-hover:shadow-indigo-500/50 transition-all duration-300">
                      <Eye className="w-8 h-8" />
                    </div>
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600">Read Only</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Viewer Access</h3>
                  <p className="text-lg leading-relaxed mb-10 flex-1" style={{ color: 'var(--text-secondary)' }}>
                    Explore evaluation results, browse dataset samples, and analyze model predictions without modifying the core data. Perfect for guests and reviewers.
                  </p>
                  <div className="inline-flex items-center justify-between w-full p-4 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 transition-colors">
                    <span className="font-bold text-slate-700 group-hover:text-indigo-600">Continue as Viewer</span>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </button>

              {/* Admin Card */}
              <div
                className="text-left p-10 rounded-[2rem] transition-all duration-500 relative overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}
                onMouseEnter={(e) => {
                  if (!showAdminInput) {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.borderColor = 'var(--accent-indigo-light)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showAdminInput) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }
                }}
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-transform duration-700 scale-100 hover:scale-125 hover:rotate-12 pointer-events-none">
                  <Shield className="w-64 h-64" style={{ color: 'var(--accent-indigo)' }} />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-br from-slate-700 to-slate-900 text-white transition-all duration-300">
                      <Shield className="w-8 h-8" />
                    </div>
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">Full Access</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Admin Access</h3>
                  <p className="text-lg leading-relaxed mb-10 flex-1" style={{ color: 'var(--text-secondary)' }}>
                    Score predictions, flag errors, configure evaluation metrics, and manage the entire dataset workflow.
                  </p>

                  {!showAdminInput ? (
                    <button
                      onClick={() => setShowAdminInput(true)}
                      className="inline-flex items-center justify-between w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-slate-500" />
                        <span className="font-bold text-slate-700">Authenticate</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <ArrowRight className="w-5 h-5 text-slate-500 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-4 animate-fade-in p-5 rounded-3xl" style={{ background: 'var(--bg-card-high)', border: '1px solid var(--border-subtle)' }}>
                      <div className="relative">
                        <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                        <input
                          type="password"
                          placeholder="Admin Password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(''); }}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          className="w-full pl-12 pr-4 py-4 rounded-2xl text-base font-medium outline-none transition-all dark-input shadow-inner"
                          style={{ background: 'var(--bg-surface)' }}
                        />
                      </div>
                      {error && (
                        <div className="flex items-center gap-2 text-sm font-medium px-2" style={{ color: 'var(--accent-rose)' }}>
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => { setShowAdminInput(false); setError(''); setPassword(''); }}
                          className="px-6 py-4 rounded-2xl text-sm font-bold transition-colors btn-ghost hover:bg-slate-200/50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAdminLogin}
                          disabled={isLoading}
                          className="flex-1 py-4 rounded-2xl text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl btn-indigo"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Access Dashboard'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-16 pb-8 text-center text-sm font-medium opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-faint)' }}>
            © {new Date().getFullYear()} Orbital Intelligence • Internal Evaluation Suite
          </div>

        </div>
      </div>
    </div>
  );
}
