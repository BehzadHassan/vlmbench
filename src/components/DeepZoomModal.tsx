import React, { useState } from 'react';
import { X } from 'lucide-react';

interface DeepZoomModalProps {
  image: { url: string; title: string } | null;
  onClose: () => void;
}

export function DeepZoomModal({ image, onClose }: DeepZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  if (!image) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden select-none"
      style={{ background: 'rgba(2, 6, 23, 0.95)' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}
      >
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {image.title} <span style={{ color: 'var(--text-muted)' }}>(Deep Zoom)</span>
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Zoom: {Math.round(scale * 100)}%
            </span>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-32"
            />
          </div>
          <button
            onClick={() => {
              setScale(1);
              setPan({ x: 0, y: 0 });
            }}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors btn-ghost"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors btn-ghost"
          >
            <X className="h-4 w-4" /> Close
          </button>
        </div>
      </div>

      {/* Zoom Canvas */}
      <div
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing flex items-center justify-center"
        style={{ background: 'var(--bg-deep)' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
      >
        <img
          src={image.url}
          alt={image.title}
          draggable={false}
          className="max-w-full max-h-full object-contain pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            transformOrigin: 'center',
            filter: 'drop-shadow(0 4px 24px rgba(0, 0, 0, 0.5))',
          }}
        />
      </div>
    </div>
  );
}
