import React, { useState, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { RowData } from '../types';
import { DeepZoomModal } from './DeepZoomModal';

interface VisualizerProps {
  selectedItem: RowData | null;
  viewMode: 'side-by-side' | 'swipe';
  isModalContext?: boolean;
}

export function Visualizer({ selectedItem, viewMode, isModalContext = false }: VisualizerProps) {
  // Visualizer Internal State
  const [thirdColMode, setThirdColMode] = useState<'overlay' | 'raw-mask' | 'difference'>('overlay');
  const [maskOpacity, setMaskOpacity] = useState(50);
  const [maskColor, setMaskColor] = useState<'red' | 'green' | 'blue' | 'yellow' | 'white'>('red');
  
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  const [swipeOrientation, setSwipeOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [swipePosition, setSwipePosition] = useState(50);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSwipe, setIsDraggingSwipe] = useState(false);

  const [deepZoomImage, setDeepZoomImage] = useState<{ url: string; title: string } | null>(null);

  if (!selectedItem) return null;

  const handleImagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoveredPos({ x, y, width: rect.width, height: rect.height });
  };
  
  const handleImagePointerLeave = () => {
    setHoveredPos(null);
  };

  const handleSwipeMove = (clientX: number, clientY: number) => {
    if (!swipeContainerRef.current) return;
    const rect = swipeContainerRef.current.getBoundingClientRect();
    if (swipeOrientation === 'vertical') {
      const x = clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSwipePosition(position);
    } else {
      const y = clientY - rect.top;
      const position = Math.max(0, Math.min(100, (y / rect.height) * 100));
      setSwipePosition(position);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDraggingSwipe(true);
    handleSwipeMove(e.clientX, e.clientY);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSwipe) return;
    handleSwipeMove(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDraggingSwipe(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const renderMagnifier = (imageType: 'A' | 'B' | 'label' | 'composite' | 'difference') => {
    if (!hoveredPos) return null;
    const S = 2;
    const MAGNIFIER_SIZE = 240;
    
    const zoomedWidth = hoveredPos.width * S;
    const zoomedHeight = hoveredPos.height * S;
    
    const leftOffset = MAGNIFIER_SIZE / 2 - (hoveredPos.x / 100) * zoomedWidth;
    const topOffset = MAGNIFIER_SIZE / 2 - (hoveredPos.y / 100) * zoomedHeight;

    return (
      <div 
        className="absolute rounded-2xl overflow-hidden pointer-events-none z-20"
        style={{
          width: `${MAGNIFIER_SIZE}px`,
          height: `${MAGNIFIER_SIZE}px`,
          left: `${hoveredPos.x}%`,
          top: `${hoveredPos.y}%`,
          transform: 'translate(-50%, -50%)',
          border: '2px solid var(--accent-indigo)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          background: 'var(--bg-deep)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center z-30 opacity-40 pointer-events-none mix-blend-difference">
          <div className="w-4 h-[1px] bg-white"></div>
          <div className="w-[1px] h-4 bg-white absolute"></div>
        </div>

        <div 
          className="absolute pointer-events-none"
          style={{
            width: `${zoomedWidth}px`,
            height: `${zoomedHeight}px`,
            left: `${leftOffset}px`,
            top: `${topOffset}px`,
          }}
        >
          {imageType === 'A' && (
            <img src={`/api/image?type=A&name=${selectedItem?.image_a_name}`} className="w-full h-full object-cover" />
          )}
          {imageType === 'B' && (
            <img src={`/api/image?type=B&name=${selectedItem?.image_b_name}`} className="w-full h-full object-cover" />
          )}
          {imageType === 'label' && (
            <img src={`/api/image?type=label&name=${selectedItem?.image_a_name}`} className="w-full h-full object-cover invert" />
          )}
          {imageType === 'composite' && (
            <div className="relative w-full h-full">
              <img src={`/api/image?type=B&name=${selectedItem?.image_b_name}`} className="w-full h-full object-cover" />
              <img
                src={`/api/image?type=label&name=${selectedItem?.image_a_name}`}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{
                  filter: `url(#mask-color-${maskColor})`,
                  opacity: maskOpacity / 100,
                }}
              />
            </div>
          )}
          {imageType === 'difference' && (
            <div className="relative w-full h-full">
              <img src={`/api/image?type=A&name=${selectedItem?.image_a_name}`} className="absolute inset-0 w-full h-full object-cover" />
              <img src={`/api/image?type=B&name=${selectedItem?.image_b_name}`} className="absolute inset-0 w-full h-full object-cover mix-blend-difference" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const containerClass = isModalContext 
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto" 
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full";
  const aspectClass = "relative aspect-square rounded-xl overflow-hidden cursor-zoom-in w-full";

  return (
    <div className="space-y-4 w-full flex flex-col h-full">
      {viewMode === 'side-by-side' && (
        <div className="space-y-4 w-full flex-1">
          <div className={containerClass}>
            {/* Image A */}
            <div className="flex flex-col gap-2">
              <span className="text-label" style={{ color: 'var(--text-muted)' }}>IMAGE 1: BEFORE (Click to Deep Zoom)</span>
              <div 
                className={aspectClass}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                onPointerMove={handleImagePointerMove}
                onPointerLeave={handleImagePointerLeave}
                onClick={() => setDeepZoomImage({ url: `/api/image?type=A&name=${selectedItem.image_a_name}`, title: 'IMAGE 1: BEFORE' })}
              >
                <img
                  src={`/api/image?type=A&name=${selectedItem.image_a_name}`}
                  alt="Before"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  loading="lazy"
                />
                {renderMagnifier('A')}
              </div>
            </div>

            {/* Image B */}
            <div className="flex flex-col gap-2">
              <span className="text-label" style={{ color: 'var(--text-muted)' }}>IMAGE 2: AFTER (Click to Deep Zoom)</span>
              <div 
                className={aspectClass}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                onPointerMove={handleImagePointerMove}
                onPointerLeave={handleImagePointerLeave}
                onClick={() => setDeepZoomImage({ url: `/api/image?type=B&name=${selectedItem.image_b_name}`, title: 'IMAGE 2: AFTER' })}
              >
                <img
                  src={`/api/image?type=B&name=${selectedItem.image_b_name}`}
                  alt="After"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  loading="lazy"
                />
                {renderMagnifier('B')}
              </div>
            </div>

            {/* Toggleable 3rd Column */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center h-[18px]">
                <span className="text-label" style={{ color: 'var(--text-muted)' }}>3rd View Mode</span>
                <select 
                  value={thirdColMode} 
                  onChange={(e: any) => setThirdColMode(e.target.value)}
                  className="text-[10px] uppercase font-bold rounded-md px-1.5 py-0.5 cursor-pointer dark-select"
                  style={{ fontSize: '10px', color: 'var(--accent-indigo-light)' }}
                >
                  <option value="overlay">After + Mask</option>
                  <option value="difference">Difference Map</option>
                  <option value="raw-mask">Raw Mask</option>
                </select>
              </div>

              <div 
                className={aspectClass}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                onPointerMove={handleImagePointerMove}
                onPointerLeave={handleImagePointerLeave}
              >
                {thirdColMode === 'raw-mask' && (
                  <>
                    <img
                      src={`/api/image?type=label&name=${selectedItem.image_a_name}`}
                      alt="Raw Mask"
                      className="w-full h-full object-cover invert pointer-events-none select-none"
                      loading="lazy"
                    />
                    {renderMagnifier('label')}
                  </>
                )}

                {thirdColMode === 'overlay' && (
                  <>
                    <img
                      src={`/api/image?type=B&name=${selectedItem.image_b_name}`}
                      alt="After"
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                    <img
                      src={`/api/image?type=label&name=${selectedItem.image_a_name}`}
                      alt="Ground Truth Label"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                      style={{
                        filter: `url(#mask-color-${maskColor})`,
                        opacity: maskOpacity / 100,
                      }}
                    />
                    {renderMagnifier('composite')}
                  </>
                )}

                {thirdColMode === 'difference' && (
                  <>
                    <img
                      src={`/api/image?type=A&name=${selectedItem.image_a_name}`}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                      alt="Difference Base"
                    />
                    <img
                      src={`/api/image?type=B&name=${selectedItem.image_b_name}`}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-difference pointer-events-none select-none"
                      alt="Difference Blend"
                    />
                    {renderMagnifier('difference')}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-6 p-4 rounded-xl glass-card mt-6 shrink-0">
            <div className="flex items-center gap-2 pr-6"
              style={{ borderRight: '1px solid var(--border-subtle)' }}
            >
              <SlidersHorizontal className="h-5 w-5" style={{ color: 'var(--accent-indigo)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Advanced Controls</span>
            </div>
            
            {/* Opacity */}
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <span className="text-sm font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>
                Opacity ({thirdColMode === 'raw-mask' ? 'N/A' : `${maskOpacity}%`})
              </span>
              <input
                type="range"
                min="0"
                max="100"
                disabled={thirdColMode === 'raw-mask'}
                value={maskOpacity}
                onChange={(e) => setMaskOpacity(Number(e.target.value))}
                className="w-full disabled:opacity-30"
              />
            </div>

            {/* Color */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Color:</span>
              <div className="flex gap-2">
                {(['red', 'green', 'blue', 'yellow', 'white'] as const).map(color => (
                  <button
                    key={color}
                    disabled={thirdColMode !== 'overlay'}
                    onClick={() => setMaskColor(color)}
                    className="w-6 h-6 rounded-full transition-all disabled:opacity-30"
                    style={{
                      backgroundColor: color === 'white' ? '#fff' : (
                        color === 'red' ? '#ef4444' : (
                          color === 'green' ? '#22c55e' : (
                            color === 'blue' ? '#3b82f6' : '#eab308'
                          )
                        )
                      ),
                      border: maskColor === color && thirdColMode === 'overlay'
                        ? '2px solid var(--text-primary)'
                        : '2px solid var(--border-default)',
                      boxShadow: maskColor === color && thirdColMode === 'overlay'
                        ? '0 0 8px rgba(99, 102, 241, 0.3)'
                        : 'none',
                      transform: maskColor === color && thirdColMode === 'overlay' ? 'scale(1.15)' : 'scale(1)',
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'swipe' && (
        <div className="flex flex-col gap-2 items-center w-full flex-1">
          <div className="flex justify-between items-center w-full max-w-[500px] md:max-w-[600px] mb-2 px-4 py-2 rounded-lg glass-card">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Swipe ({swipeOrientation === 'vertical' ? 'Vertical' : 'Horizontal'})
              </span>
              <button
                onClick={() => setSwipeOrientation(prev => prev === 'vertical' ? 'horizontal' : 'vertical')}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors btn-ghost"
              >
                Flip
              </button>
            </div>
            <span className="text-sm font-mono font-semibold" style={{ color: 'var(--accent-indigo-light)' }}>
              {Math.round(swipePosition)}% Before / {Math.round(100 - swipePosition)}% After
            </span>
          </div>

          <div
            ref={swipeContainerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerOut={handlePointerUp}
            className="relative w-full max-w-[500px] md:max-w-[600px] aspect-square rounded-xl overflow-hidden cursor-crosshair touch-none select-none"
            style={{ border: '3px solid var(--bg-card-highest)', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-card)' }}
          >
            <img
              src={`/api/image?type=B&name=${selectedItem.image_b_name}`}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              alt="After"
            />

            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={
                swipeOrientation === 'vertical'
                  ? { width: `${swipePosition}%` }
                  : { height: `${swipePosition}%` }
              }
            >
              <img
                src={`/api/image?type=A&name=${selectedItem.image_a_name}`}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={
                  swipeOrientation === 'vertical'
                    ? { width: `${swipeContainerRef.current?.clientWidth || 0}px`, maxWidth: 'none' }
                    : { height: `${swipeContainerRef.current?.clientHeight || 0}px`, maxHeight: 'none' }
                }
                alt="Before"
              />
            </div>

            <div
              className="absolute pointer-events-none z-10"
              style={{
                background: 'rgba(255,255,255,0.8)',
                ...(swipeOrientation === 'vertical' ? {
                  left: `${swipePosition}%`,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  transform: 'translateX(-50%)',
                } : {
                  top: `${swipePosition}%`,
                  left: 0,
                  right: 0,
                  height: '3px',
                  transform: 'translateY(-50%)',
                })
              }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-base)', border: '2px solid var(--accent-indigo)', boxShadow: 'var(--shadow-md)' }}
              >
                <div className="flex gap-0.5">
                  <div className={`${swipeOrientation === 'vertical' ? 'w-[2px] h-3' : 'w-3 h-[2px]'}`} style={{ background: 'var(--text-muted)' }}></div>
                  <div className={`${swipeOrientation === 'vertical' ? 'w-[2px] h-3' : 'w-3 h-[2px]'}`} style={{ background: 'var(--text-muted)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deepZoomImage && (
        <DeepZoomModal image={deepZoomImage} onClose={() => setDeepZoomImage(null)} />
      )}

      {/* SVG Filters for Colorizing Black & White Mask */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="mask-color-red">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
              1 0 0 0 0
            " />
          </filter>
          <filter id="mask-color-green">
            <feColorMatrix type="matrix" values="
              0 0 0 0 0
              0 1 0 0 0
              0 0 0 0 0
              1 0 0 0 0
            " />
          </filter>
          <filter id="mask-color-blue">
            <feColorMatrix type="matrix" values="
              0 0 0 0 0
              0 0 0 0 0
              0 0 1 0 0
              1 0 0 0 0
            " />
          </filter>
          <filter id="mask-color-yellow">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              1 0 0 0 0
              0 0 0 0 0
              1 0 0 0 0
            " />
          </filter>
          <filter id="mask-color-white">
            <feColorMatrix type="matrix" values="
              1 0 0 0 0
              1 0 0 0 0
              1 0 0 0 0
              1 0 0 0 0
            " />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
