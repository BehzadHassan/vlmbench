'use client';

import React, { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';

export default function PromptModal({ title, text }: { title: string; text: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="mt-3 text-[11px] uppercase tracking-wider font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 select-none w-max outline-none group cursor-pointer"
      >
        <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
          <FileText className="w-3 h-3" />
        </span>
        View Exact Prompt Model
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" 
          style={{ background: 'rgba(5, 10, 24, 0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl relative overflow-hidden"
            style={{ 
              background: '#0f172a',
              border: '1px solid rgba(34, 211, 238, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 211, 238, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800" style={{ background: 'rgba(34, 211, 238, 0.03)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-0.5">Prompt Source</h3>
                  <div className="text-lg font-black text-slate-100">{title}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto bg-slate-900/50 flex-1 custom-scrollbar">
              <pre className="text-[12px] sm:text-[13px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {text}
              </pre>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 rounded-lg text-sm font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
