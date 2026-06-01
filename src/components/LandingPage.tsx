'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Eye, Shield, ArrowRight, Lock, AlertCircle, Scan, Cpu, BrainCircuit, Activity, Sparkles, Satellite, Globe, Zap, BarChart3, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

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
        className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl group select-none cursor-ew-resize"
        style={{ border: '2px solid rgba(99, 102, 241, 0.15)' }}
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
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
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
          className="absolute top-0 bottom-0 w-1 z-10 pointer-events-none"
          style={{ 
            left: `${position}%`, 
            transform: 'translateX(-50%)',
            background: 'linear-gradient(to bottom, #6366f1, #06b6d4, #6366f1)',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-xl flex items-center justify-center gap-0.5"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', border: '2px solid rgba(255,255,255,0.9)' }}
          >
            <div className="w-4 h-4 text-white flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-full h-full">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
            <div className="w-4 h-4 text-white flex items-center justify-center rotate-180">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-full h-full">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Labels */}
        <div className="absolute top-4 left-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider z-10 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.85), rgba(6, 182, 212, 0.85))', color: '#fff', backdropFilter: 'blur(8px)' }}
        >T1: Before</div>
        <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider z-10 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.85), rgba(16, 185, 129, 0.85))', color: '#fff', backdropFilter: 'blur(8px)' }}
        >T2: After</div>
      </div>

      {/* Mask Toggle Button */}
      {mask && (
        <button 
          onClick={() => setShowMask(!showMask)}
          className="mt-6 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
          style={{ 
            background: showMask ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'rgba(255,255,255,0.9)', 
            color: showMask ? '#fff' : '#334155',
            border: showMask ? '1px solid transparent' : '1px solid rgba(99,102,241,0.2)',
            boxShadow: showMask ? '0 8px 32px rgba(99, 102, 241, 0.4)' : '0 4px 16px rgba(0,0,0,0.08)'
          }}
        >
          <Scan className="w-4 h-4" />
          {showMask ? 'Hide Detection Mask' : 'Show Detection Mask'}
        </button>
      )}
    </div>
  );
};

// --- Animated Counter ---
const AnimatedCounter = ({ end, suffix = '' }: { end: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1500;
    const steps = 40;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, end]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// --- Timeline Pipeline ---
const TimelinePipeline = () => {
  const steps = [
    { icon: <Scan className="w-6 h-6" />, title: "Data Ingestion", desc: "Bi-temporal satellite image pairs loaded for batch processing.", gradient: 'linear-gradient(135deg, #6366f1, #818cf8)', glow: 'rgba(99, 102, 241, 0.2)', num: '01' },
    { icon: <Cpu className="w-6 h-6" />, title: "Multi-Prompt Inference", desc: "Qwen2-VL-2B generates reports under four prompt strategies.", gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)', glow: 'rgba(6, 182, 212, 0.2)', num: '02' },
    { icon: <Activity className="w-6 h-6" />, title: "Human Evaluation", desc: "Analysts review visual evidence, scoring accuracy and consistency.", gradient: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16, 185, 129, 0.2)', num: '03' },
    { icon: <BarChart3 className="w-6 h-6" />, title: "Cross-Prompt Analysis", desc: "Aggregated scores reveal prompt engineering impact.", gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245, 158, 11, 0.2)', num: '04' },
    { icon: <LayoutDashboard className="w-6 h-6" />, title: "Evaluation Dashboard", desc: "Custom Next.js interface for structured analyst review.", gradient: 'linear-gradient(135deg, #a855f7, #c084fc)', glow: 'rgba(168, 85, 247, 0.2)', num: '05' }
  ];

  return (
    <div className="w-full mb-32 relative">
      <div className="flex flex-col items-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.2)' }}
        >
          <Zap className="w-3.5 h-3.5" /> How It Works
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-center" style={{ color: '#e2e8f0' }}>The Evaluation Pipeline</h2>
      </div>

      <div className="max-w-4xl mx-auto relative px-4">
        {/* Vertical Center Line */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px -translate-x-1/2" 
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.3), rgba(6,182,212,0.3), rgba(16,185,129,0.3), rgba(245,158,11,0.3), rgba(168,85,247,0.3), transparent)' }}
        />

        <div className="space-y-16 md:space-y-24">
          {steps.map((step, idx) => (
            <TimelineItem key={idx} step={step} idx={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TimelineItem = ({ step, idx }: { step: any, idx: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const isEven = idx % 2 === 0;

  return (
    <div ref={ref} className="w-full relative">
      <div className={`relative flex items-center w-full transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}
        ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}
      `}>
        {/* Spacer for alternating layout on desktop */}
        <div className="hidden md:block w-1/2" />
        
        {/* Center Node */}
        <div className="absolute left-8 md:left-1/2 w-8 h-8 rounded-full -translate-x-1/2 flex items-center justify-center z-20 transition-all duration-500 delay-200"
          style={{ 
            background: '#050a18',
            border: `2px solid ${isVisible ? '#fff' : 'rgba(255,255,255,0.2)'}`,
            boxShadow: isVisible ? `0 0 20px ${step.glow}` : 'none'
          }}
        >
          <div className="w-3 h-3 rounded-full transition-all duration-500" style={{ background: isVisible ? step.gradient : 'transparent' }} />
        </div>

        {/* Card Content */}
        <div className={`w-full pl-20 md:pl-0 md:w-1/2 ${isEven ? 'md:pr-12 lg:pr-16' : 'md:pl-12 lg:pl-16'}`}>
          <div className="group relative z-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left p-6 rounded-2xl transition-all duration-500 hover:-translate-y-2"
            style={{ 
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 12px 40px ${step.glow}`; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            <div className="absolute top-4 right-5 text-sm font-black opacity-20" style={{ color: '#fff' }}>{step.num}</div>
            
            <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center mb-4 md:mb-0 md:mr-5 transition-transform duration-300 group-hover:scale-110"
              style={{ background: step.gradient, boxShadow: `0 8px 24px ${step.glow}`, color: '#fff' }}
            >
              {step.icon}
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#e2e8f0' }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{step.desc}</p>
            </div>
          </div>
        </div>
      </div>
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
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#050a18' }}>
      
      {/* === ANIMATED BACKGROUND === */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mesh gradient base */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)' }} />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        {/* Animated floating orbs */}
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'rgba(99, 102, 241, 0.15)', animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute top-[60%] right-[10%] w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(6, 182, 212, 0.12)', animation: 'float 10s ease-in-out infinite 2s' }} />
        <div className="absolute bottom-[10%] left-[40%] w-[350px] h-[350px] rounded-full blur-[100px]" style={{ background: 'rgba(16, 185, 129, 0.1)', animation: 'float 12s ease-in-out infinite 4s' }} />
        <div className="absolute top-[30%] right-[30%] w-[250px] h-[250px] rounded-full blur-[80px]" style={{ background: 'rgba(168, 85, 247, 0.08)', animation: 'float 9s ease-in-out infinite 1s' }} />

        {/* Subtle star-like dots */}
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            background: 'rgba(255, 255, 255, 0.3)',
            animation: `glow-pulse ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 3}s`
          }} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center p-6 lg:p-12 z-10 w-full">
        <div className={`max-w-6xl w-full flex flex-col items-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* === HERO SECTION === */}
          <div className="text-center space-y-8 mb-28 mt-16 w-full">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold tracking-wide mx-auto"
              style={{ 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.1))',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#a5b4fc',
                animation: 'float 6s ease-in-out infinite'
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#818cf8' }} />
              VLMBench · Change Detection Evaluation
            </div>
            
            {/* Logo Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center relative overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)',
                    boxShadow: '0 0 60px rgba(99, 102, 241, 0.4), 0 0 120px rgba(6, 182, 212, 0.2)'
                  }}
                >
                  <Satellite className="w-10 h-10 text-white relative z-10" />
                </div>
                {/* Orbiting ring effect */}
                <div className="absolute inset-[-8px] rounded-[28px]" style={{ border: '1px solid rgba(99, 102, 241, 0.2)', animation: 'glow-pulse 3s ease-in-out infinite' }} />
              </div>
            </div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]" style={{ color: '#e2e8f0' }}>
                Decode the Earth's <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #06b6d4, #34d399, #818cf8)', backgroundSize: '200% auto', animation: 'gradient-shift 4s linear infinite' }}>
                  Changing Surface
                </span>
              </h1>
              <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
                A sophisticated evaluation platform for reviewing Vision-Language Model outputs on the <span style={{ color: '#06b6d4', fontWeight: 600 }}>LEVIR-CD</span> remote sensing dataset. Score, compare, and refine change detection accuracy.
              </p>
              
              <div className="flex justify-center gap-4 pt-6">
                <button 
                  onClick={() => document.getElementById('access-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-white transition-all overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                    boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.4)'; }}
                >
                  <span className="relative z-10 text-lg">Enter Workspace</span>
                  <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)' }} 
                  />
                </button>

                <Link 
                  href="/results"
                  className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-white transition-all overflow-hidden border"
                  style={{ 
                    background: 'transparent',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.2)'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <span className="relative z-10 text-lg text-indigo-400 group-hover:text-white transition-colors">View Results</span>
                  <BarChart3 className="w-5 h-5 relative z-10 text-indigo-400 group-hover:text-white transition-colors" />
                </Link>
              </div>
            </div>

            {/* === STATS CARDS === */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto">
              {[
                { value: 'Qwen2-VL', sub: '2B-Instruct', label: 'Model Evaluated', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', glow: 'rgba(99, 102, 241, 0.3)' },
                { value: '4', label: 'Different Prompts', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)', glow: 'rgba(6, 182, 212, 0.3)', isNumber: true },
                { value: '64', label: 'Total Image Sets', gradient: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16, 185, 129, 0.3)', isNumber: true },
                { value: 'LEVIR-CD', label: 'Source Dataset', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245, 158, 11, 0.3)' },
              ].map((stat, idx) => (
                <div key={idx} 
                  className="group p-5 rounded-2xl flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-2 cursor-default relative overflow-hidden"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(12px)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 40px ${stat.glow}`; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center, ${stat.glow}, transparent 70%)` }} />
                  <div className="relative z-10">
                    {stat.sub ? (
                      <div>
                        <div className="text-xl font-black mb-0" style={{ backgroundImage: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</div>
                        <div className="text-sm font-bold" style={{ backgroundImage: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.sub}</div>
                      </div>
                    ) : stat.isNumber ? (
                      <div className="text-3xl font-black" style={{ backgroundImage: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        <AnimatedCounter end={Number(stat.value)} />
                      </div>
                    ) : (
                      <div className="text-xl font-black" style={{ backgroundImage: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</div>
                    )}
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] mt-2" style={{ color: '#64748b' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* === INTERACTIVE SAMPLE SECTION === */}
          <div className="w-full max-w-5xl mb-32">
            <div className="flex flex-col items-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.2)' }}
              >
                <Globe className="w-3.5 h-3.5" /> Live Demo
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#e2e8f0' }}>See It In Action</h2>
              <p className="text-center max-w-2xl" style={{ color: '#94a3b8' }}>
                Drag the slider to instantly reveal urban development and surface changes between two satellite captures.
              </p>
            </div>
            
            <div className="p-3 rounded-3xl relative"
              style={{ 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.05))',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                boxShadow: '0 20px 80px rgba(99, 102, 241, 0.15), 0 0 1px rgba(99, 102, 241, 0.3)'
              }}
            >
              {/* Uses real val_9 LEVIR-CD data */}
              <ImageCompare before="/images/val_9_A.png" after="/images/val_9_B.png" mask="/images/val_9_label.png" />
            </div>
          </div>

          {/* === HOW IT WORKS / PIPELINE === */}
          <TimelinePipeline />

          {/* Divider */}
          <div className="w-full max-w-xl h-px mb-28 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), rgba(6,182,212,0.3), transparent)' }} />

          {/* === ACCESS ROLES SECTION === */}
          <div id="access-section" className="w-full max-w-5xl mb-16 scroll-mt-24">
            <div className="flex flex-col items-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}
              >
                <Shield className="w-3.5 h-3.5" /> Access
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-center" style={{ color: '#e2e8f0' }}>Enter the Workspace</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Viewer Card */}
              <button
                onClick={loginAsViewer}
                className="group text-left p-8 md:p-10 rounded-2xl transition-all duration-500 cursor-pointer relative overflow-hidden"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(12px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(99, 102, 241, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99, 102, 241, 0.08), transparent 70%)' }}
                />

                <div className="absolute top-0 right-0 p-6 opacity-[0.03] transition-all duration-700 group-hover:scale-125 group-hover:-rotate-12 pointer-events-none">
                  <Eye className="w-56 h-56" style={{ color: '#6366f1' }} />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-all duration-300"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)' }}
                    >
                      <Eye className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                    >Read Only</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ color: '#e2e8f0' }}>Viewer Access</h3>
                  <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: '#94a3b8' }}>
                    Explore evaluation results, browse dataset samples, and analyze model predictions. Perfect for guests and reviewers.
                  </p>
                  <div className="inline-flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300"
                    style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.1)' }}
                  >
                    <span className="font-bold text-sm" style={{ color: '#a5b4fc' }}>Continue as Viewer</span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all group-hover:translate-x-1"
                      style={{ background: 'rgba(99, 102, 241, 0.2)' }}
                    >
                      <ArrowRight className="w-4 h-4" style={{ color: '#a5b4fc' }} />
                    </div>
                  </div>
                </div>
              </button>

              {/* Admin Card */}
              <div
                className="group text-left p-8 md:p-10 rounded-2xl transition-all duration-500 relative overflow-hidden"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(12px)'
                }}
                onMouseEnter={(e) => {
                  if (!showAdminInput) {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(6, 182, 212, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showAdminInput) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(6, 182, 212, 0.06), transparent 70%)' }}
                />
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 pointer-events-none">
                  <Shield className="w-56 h-56" style={{ color: '#06b6d4' }} />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-300"
                      style={{ background: 'linear-gradient(135deg, #06b6d4, #22d3ee)', boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)' }}
                    >
                      <Shield className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.2)' }}
                    >Full Access</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ color: '#e2e8f0' }}>Admin Access</h3>
                  <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: '#94a3b8' }}>
                    Score predictions, flag errors, configure evaluation metrics, and manage the entire dataset workflow.
                  </p>

                  {!showAdminInput ? (
                    <button
                      onClick={() => setShowAdminInput(true)}
                      className="inline-flex items-center justify-between w-full p-4 rounded-xl transition-all duration-300 cursor-pointer group/btn"
                      style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.1)' }}
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4" style={{ color: '#22d3ee' }} />
                        <span className="font-bold text-sm" style={{ color: '#22d3ee' }}>Authenticate</span>
                      </div>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all group-hover/btn:translate-x-1"
                        style={{ background: 'rgba(6, 182, 212, 0.2)' }}
                      >
                        <ArrowRight className="w-4 h-4" style={{ color: '#22d3ee' }} />
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-3 animate-fade-in p-5 rounded-xl" 
                      style={{ background: 'rgba(6, 182, 212, 0.04)', border: '1px solid rgba(6, 182, 212, 0.15)' }}
                    >
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-4 h-4" style={{ color: '#64748b' }} />
                        <input
                          type="password"
                          placeholder="Admin Password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(''); }}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                          style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e2e8f0'
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                      {error && (
                        <div className="flex items-center gap-2 text-sm font-medium px-1" style={{ color: '#f87171' }}>
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => { setShowAdminInput(false); setError(''); setPassword(''); }}
                          className="px-5 py-3 rounded-xl text-sm font-bold transition-colors"
                          style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAdminLogin}
                          disabled={isLoading}
                          className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          style={{ 
                            background: 'linear-gradient(135deg, #06b6d4, #22d3ee)', 
                            color: '#fff',
                            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)'
                          }}
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="mt-16 pb-8 text-center text-sm font-medium flex flex-col items-center gap-2" style={{ color: '#475569' }}>
            <div>© {new Date().getFullYear()} VLMBench · Change Detection Evaluation • Powered by <span style={{ color: '#818cf8' }}>Qwen2-VL-2B-Instruct</span></div>
            <div className="text-xs px-4 py-1.5 rounded-full mt-2 transition-all duration-300 hover:-translate-y-0.5" 
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#64748b' }}
            >
              Developed by{' '}
              <a 
                href="https://behzadhassan-dev.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold tracking-wide transition-colors duration-300"
                style={{ color: '#38bdf8' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#38bdf8'}
              >
                Behzad Hassan
              </a>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
