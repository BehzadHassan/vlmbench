import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in-scale" style={{ background: '#050a18' }}>
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative z-10 glass-panel">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-bold text-slate-200 tracking-wide">Loading Analysis</h3>
      <p className="text-sm text-slate-500 mt-2 font-mono">Fetching latest evaluation metrics...</p>
    </div>
  );
}
