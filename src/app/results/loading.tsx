import React from 'react';
import { ArrowLeft, BarChart3, TrendingUp, Layers } from 'lucide-react';
import Link from 'next/link';

export default function Loading() {
  const dummyMetrics = Array.from({ length: 10 });
  const dummyPrompts = Array.from({ length: 4 });

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-12" style={{ background: '#050a18', color: '#e2e8f0' }}>
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-pulse">
        
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold mb-4 text-slate-600">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </div>
            <div className="h-10 w-64 bg-slate-800 rounded-lg mb-4"></div>
            <div className="h-6 w-[300px] sm:w-[500px] bg-slate-800 rounded-lg"></div>
          </div>
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-slate-800"></div>
        </div>

        {/* Overall Results Skeleton */}
        <div className="p-5 sm:p-8 rounded-3xl relative border border-slate-800" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 relative">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            <div className="h-8 w-64 bg-slate-800 rounded-lg"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {dummyMetrics.map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-800 h-36 flex flex-col justify-between" style={{ background: 'rgba(99, 102, 241, 0.02)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="h-4 w-8 bg-slate-800 rounded"></div>
                  <div className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-slate-800"></div>
                    <div className="w-4 h-4 rounded-full bg-slate-800"></div>
                  </div>
                </div>
                <div className="h-12 bg-slate-800/50 rounded w-full mb-4"></div>
                <div className="h-8 w-16 bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Results by Prompt Skeleton */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            <div className="h-8 w-64 bg-slate-800 rounded-lg"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {dummyPrompts.map((_, p) => (
              <div key={p} className="p-4 sm:p-6 rounded-2xl border border-slate-800" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="h-6 w-24 bg-slate-800 rounded"></div>
                  <div className="h-6 w-24 bg-slate-800 rounded-full"></div>
                </div>
                <div className="grid grid-cols-5 gap-y-4 gap-x-1 sm:gap-2">
                  {dummyMetrics.map((_, m) => (
                    <div key={m} className="flex flex-col items-center">
                      <div className="h-3 w-6 bg-slate-800 rounded mb-2"></div>
                      <div className="h-8 w-10 bg-slate-800 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
