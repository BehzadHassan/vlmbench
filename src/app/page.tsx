'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Search, 
  CheckCircle, 
  Circle, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Sliders, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw,
  Eye,
  Settings2,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  Flag,
  Brush,
  Eraser,
  Undo
} from 'lucide-react';

interface Metric {
  id: string;
  name: string;
  type: 'scale' | 'text';
  min?: number;
  max?: number;
  defaultValue: number | string;
  description?: string;
}

interface EvaluationSettings {
  metrics: Metric[];
}

interface RowData {
  id: string;
  index: number;
  timestamp: string;
  model: string;
  image_a_name: string;
  image_b_name: string;
  prompt: string;
  response: string;
  evaluated: boolean;
  scores: Record<string, number>;
  notes: string;
  evaluatedAt: string | null;
  flagged?: boolean;
}

export default function Dashboard() {
  const [data, setData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection & Navigation
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  
  // Settings
  const [settings, setSettings] = useState<EvaluationSettings>({ metrics: [] });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingMetrics, setEditingMetrics] = useState<Metric[]>([]);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'evaluated' | 'pending'>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  
  // Dynamic form state for selected item
  const [formScores, setFormScores] = useState<Record<string, number>>({});
  const [formNotes, setFormNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Image Viewer View Modes
  // 'side-by-side' | 'swipe' | 'edit-mask'
  const [viewMode, setViewMode] = useState<'side-by-side' | 'swipe' | 'edit-mask'>('side-by-side');
  
  // Swipe Slider State
  const [swipePosition, setSwipePosition] = useState(50);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSwipe, setIsDraggingSwipe] = useState(false);

  // Overlay state
  const [maskOpacity, setMaskOpacity] = useState(50);
  const [maskColor, setMaskColor] = useState<'red' | 'green' | 'blue' | 'yellow' | 'white'>('red');

  // Analyst Evaluation Tools State
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [swipeOrientation, setSwipeOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [thirdColMode, setThirdColMode] = useState<'overlay' | 'raw-mask' | 'difference'>('overlay');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Mask Editor State
  const [brushSize, setBrushSize] = useState(10);
  const [brushMode, setBrushMode] = useState<'draw' | 'erase'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSavingMask, setIsSavingMask] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [maskCacheBuster, setMaskCacheBuster] = useState<number>(Date.now());

  // Load Data & Settings
  const loadDataAndSettings = async () => {
    setLoading(true);
    try {
      // Fetch settings first
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      setSettings(settingsData);
      setEditingMetrics(settingsData.metrics);

      // Fetch data
      const dataRes = await fetch('/api/data');
      const dataJson = await dataRes.json();
      if (dataJson.error) {
        throw new Error(dataJson.error);
      }
      setData(dataJson.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataAndSettings();
  }, []);

  const selectedItem = data[selectedIndex];

  // Initialize form state when selection changes
  useEffect(() => {
    if (selectedItem) {
      const initialScores: Record<string, number> = {};
      settings.metrics.forEach(m => {
        if (m.type === 'scale') {
          initialScores[m.id] = selectedItem.scores?.[m.id] !== undefined 
            ? selectedItem.scores[m.id] 
            : Number(m.defaultValue);
        }
      });
      setFormScores(initialScores);
      setFormNotes(selectedItem.notes || '');
    }
  }, [selectedIndex, selectedItem, settings]);

  // Canvas Editor Effect
  useEffect(() => {
    if (viewMode === 'edit-mask' && selectedItem && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      
      ctxRef.current = ctx;

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      };
      img.src = `/api/image?type=label&name=${selectedItem.image_a_name}&t=${maskCacheBuster}`;
    }
  }, [viewMode, selectedItem?.id, maskCacheBuster]);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ctxRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setIsDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctxRef.current.lineWidth = brushSize;
    ctxRef.current.strokeStyle = brushMode === 'draw' ? 'white' : 'black';
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ctxRef.current) return;
    ctxRef.current.closePath();
    setIsDrawing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const saveUpdatedMask = async () => {
    if (!canvasRef.current || !selectedItem) return;
    setIsSavingMask(true);
    
    try {
      const base64Image = canvasRef.current.toDataURL('image/png');
      const response = await fetch('/api/mask/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedItem.image_a_name,
          base64Image
        })
      });
      
      if (!response.ok) throw new Error('Failed to save mask');
      
      // Update cache buster to force reload new mask image
      setMaskCacheBuster(Date.now());
      setViewMode('side-by-side');
      
    } catch (e: any) {
      alert(e.message || 'Error saving mask');
    } finally {
      setIsSavingMask(false);
    }
  };

  // Handle Hover Magnifier Coordinates
  const handleImagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoveredPos({ x, y, width: rect.width, height: rect.height });
  };
  
  const handleImagePointerLeave = () => {
    setHoveredPos(null);
  };

  // Handle Swipe interaction
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

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prev: Alt + ArrowLeft
      if (e.altKey && e.key === 'ArrowLeft') {
        navigatePrev();
      }
      // Next: Alt + ArrowRight
      if (e.altKey && e.key === 'ArrowRight') {
        navigateNext();
      }
      // Save: Ctrl + Enter inside form
      if (e.ctrlKey && e.key === 'Enter') {
        handleSaveEvaluation();
      }
      // Close full screen: Escape
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formScores, formNotes, selectedIndex, data, settings]);

  // Filters
  const modelsList = Array.from(new Set(data.map(d => d.model))).filter(Boolean);

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.image_a_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.image_b_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.response.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'evaluated' ? item.evaluated : !item.evaluated;
      
    const matchesModel = 
      selectedModel === 'all' ? true : item.model === selectedModel;

    return matchesSearch && matchesStatus && matchesModel;
  });

  const evaluatedCount = data.filter(d => d.evaluated).length;
  const totalCount = data.length;
  const completionPercentage = totalCount > 0 ? Math.round((evaluatedCount / totalCount) * 100) : 0;

  const handleToggleFlag = async (item: RowData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const newFlaggedState = !item.flagged;
    
    // Optimistic UI update
    setData(prevData => prevData.map(d => 
      d.id === item.id ? { ...d, flagged: newFlaggedState } : d
    ));

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          flagged: newFlaggedState,
        }),
      });
      if (!response.ok) throw new Error('Failed to update flag');
    } catch (err: any) {
      alert(err.message || 'Error updating flag');
      // Revert on error
      setData(prevData => prevData.map(d => 
        d.id === item.id ? { ...d, flagged: !newFlaggedState } : d
      ));
    }
  };

  const navigateNext = () => {
    if (filteredData.length === 0) return;
    const currentFilteredIndex = filteredData.findIndex(item => item.id === selectedItem?.id);
    if (currentFilteredIndex !== -1 && currentFilteredIndex < filteredData.length - 1) {
      const nextItem = filteredData[currentFilteredIndex + 1];
      const nextIndex = data.findIndex(item => item.id === nextItem.id);
      setSelectedIndex(nextIndex);
    }
  };

  const navigatePrev = () => {
    if (filteredData.length === 0) return;
    const currentFilteredIndex = filteredData.findIndex(item => item.id === selectedItem?.id);
    if (currentFilteredIndex > 0) {
      const prevItem = filteredData[currentFilteredIndex - 1];
      const prevIndex = data.findIndex(item => item.id === prevItem.id);
      setSelectedIndex(prevIndex);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedItem.id,
          scores: formScores,
          notes: formNotes,
          evaluated: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save evaluation');
      }

      // Update local state
      setData(prevData => {
        const newData = [...prevData];
        newData[selectedIndex] = {
          ...newData[selectedIndex],
          evaluated: true,
          scores: formScores,
          notes: formNotes,
          evaluatedAt: new Date().toISOString(),
        };
        return newData;
      });

      // Auto advance to next item
      navigateNext();
    } catch (err: any) {
      alert(err.message || 'Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  // Add a new metric in edit settings mode
  const handleAddMetric = () => {
    const newMetric: Metric = {
      id: `metric_${Date.now()}`,
      name: 'New Metric',
      type: 'scale',
      min: 1,
      max: 5,
      defaultValue: 3,
      description: ''
    };
    setEditingMetrics([...editingMetrics, newMetric]);
  };

  // Remove a metric in settings
  const handleRemoveMetric = (id: string) => {
    setEditingMetrics(editingMetrics.filter(m => m.id !== id));
  };

  // Update specific metric field
  const handleUpdateMetricField = (index: number, key: keyof Metric, value: any) => {
    const updated = [...editingMetrics];
    updated[index] = { ...updated[index], [key]: value };
    setEditingMetrics(updated);
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics: editingMetrics }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSettings({ metrics: editingMetrics });
      setShowSettingsModal(false);
      
      // Reload everything to align forms
      loadDataAndSettings();
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    }
  };

  // Render magnifier bubble
  const renderMagnifier = (imageType: 'A' | 'B' | 'label' | 'composite' | 'difference') => {
    if (!hoveredPos) return null;
    const S = 2; // Reduced zoom factor from 3 to 2 to see more context
    const MAGNIFIER_SIZE = 240; // Increased size to see borders better
    
    const zoomedWidth = hoveredPos.width * S;
    const zoomedHeight = hoveredPos.height * S;
    
    const leftOffset = MAGNIFIER_SIZE / 2 - (hoveredPos.x / 100) * zoomedWidth;
    const topOffset = MAGNIFIER_SIZE / 2 - (hoveredPos.y / 100) * zoomedHeight;

    return (
      <div 
        className="absolute border-2 border-indigo-500 rounded-2xl overflow-hidden pointer-events-none shadow-2xl z-20 bg-slate-900"
        style={{
          width: `${MAGNIFIER_SIZE}px`,
          height: `${MAGNIFIER_SIZE}px`,
          left: `${hoveredPos.x}%`,
          top: `${hoveredPos.y}%`,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 20px 40px -10px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Crosshair indicator */}
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
            <img
              src={`/api/image?type=A&name=${selectedItem?.image_a_name}`}
              alt="Zoomed"
              className="w-full h-full object-cover"
            />
          )}
          {imageType === 'B' && (
            <img
              src={`/api/image?type=B&name=${selectedItem?.image_b_name}`}
              alt="Zoomed"
              className="w-full h-full object-cover"
            />
          )}
          {imageType === 'label' && (
            <img
              src={`/api/image?type=label&name=${selectedItem?.image_a_name}`}
              alt="Zoomed"
              className="w-full h-full object-cover invert"
            />
          )}
          {imageType === 'composite' && (
            <div className="relative w-full h-full">
              <img
                src={`/api/image?type=B&name=${selectedItem?.image_b_name}`}
                alt="Zoomed Base"
                className="w-full h-full object-cover"
              />
              <img
                src={`/api/image?type=label&name=${selectedItem?.image_a_name}`}
                alt="Zoomed Mask"
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
              <img
                src={`/api/image?type=A&name=${selectedItem?.image_a_name}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <img
                src={`/api/image?type=B&name=${selectedItem?.image_b_name}`}
                className="absolute inset-0 w-full h-full object-cover mix-blend-difference"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Visualizer Panel (usable in both Inline and Modal views)
  const renderVisualizerPanel = (isModalContext: boolean = false) => {
    if (!selectedItem) return null;
    const containerClass = isModalContext 
      ? "grid grid-cols-3 gap-6 w-full max-w-6xl mx-auto" 
      : "grid grid-cols-3 gap-4 w-full";
    const aspectClass = "relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 cursor-zoom-in";

    return (
      <div className="space-y-4 w-full">
        {viewMode === 'side-by-side' && (
          <div className="space-y-4 w-full">
            <div className={containerClass}>
              {/* Image A */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400">IMAGE 1: BEFORE</span>
                <div 
                  className={aspectClass}
                  onPointerMove={handleImagePointerMove}
                  onPointerLeave={handleImagePointerLeave}
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
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400">IMAGE 2: AFTER</span>
                <div 
                  className={aspectClass}
                  onPointerMove={handleImagePointerMove}
                  onPointerLeave={handleImagePointerLeave}
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
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 h-[18px]">
                  <span className="uppercase text-slate-400">3rd View Mode</span>
                  <select 
                    value={thirdColMode} 
                    onChange={(e: any) => setThirdColMode(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-[10px] uppercase font-bold rounded px-1.5 py-0.5 text-indigo-400 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="overlay">After + Mask</option>
                    <option value="difference">Difference Map</option>
                    <option value="raw-mask">Raw Mask</option>
                  </select>
                </div>

                <div 
                  className={aspectClass}
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
            <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">Visualizer Controls</span>
              </div>
              
              {/* Opacity */}
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <span className="text-xs text-slate-400 shrink-0">
                  Mask Opacity ({thirdColMode === 'raw-mask' ? 'N/A' : `${maskOpacity}%`})
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={thirdColMode === 'raw-mask'}
                  value={maskOpacity}
                  onChange={(e) => setMaskOpacity(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
                />
              </div>

              {/* Color */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Color:</span>
                <div className="flex gap-2">
                  {(['red', 'green', 'blue', 'yellow', 'white'] as const).map(color => (
                    <button
                      key={color}
                      disabled={thirdColMode !== 'overlay'}
                      onClick={() => setMaskColor(color)}
                      className={`w-5 h-5 rounded-full border transition-all disabled:opacity-30 ${
                        maskColor === color && thirdColMode === 'overlay' 
                          ? 'border-white scale-115 ring-2 ring-indigo-500/20' 
                          : 'border-slate-800'
                      }`}
                      style={{
                        backgroundColor: color === 'white' ? '#fff' : (
                          color === 'red' ? '#ef4444' : (
                            color === 'green' ? '#22c55e' : (
                              color === 'blue' ? '#3b82f6' : '#eab308'
                            )
                          )
                        )
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
          <div className="flex flex-col gap-1.5 items-center w-full">
            <div className="flex justify-between items-center w-full max-w-[500px] md:max-w-[600px] mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">
                  Swipe comparison ({swipeOrientation === 'vertical' ? 'Vertical' : 'Horizontal'})
                </span>
                <button
                  onClick={() => setSwipeOrientation(prev => prev === 'vertical' ? 'horizontal' : 'vertical')}
                  className="px-2 py-0.5 rounded bg-slate-855 hover:bg-slate-800 text-[10px] text-slate-300 font-bold border border-slate-700 transition-colors"
                >
                  Flip to {swipeOrientation === 'vertical' ? 'Horizontal' : 'Vertical'}
                </button>
              </div>
              <span className="text-xs font-mono text-indigo-400">
                {Math.round(swipePosition)}% Before / {Math.round(100 - swipePosition)}% After
              </span>
            </div>
            
            <div 
              ref={swipeContainerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full max-w-[500px] md:max-w-[600px] aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 select-none"
              style={{ cursor: swipeOrientation === 'vertical' ? 'ew-resize' : 'ns-resize' }}
            >
              <img
                src={`/api/image?type=A&name=${selectedItem.image_a_name}`}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
              
              <img
                src={`/api/image?type=B&name=${selectedItem.image_b_name}`}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ 
                  clipPath: swipeOrientation === 'vertical'
                    ? `polygon(${swipePosition}% 0, 100% 0, 100% 100%, ${swipePosition}% 100%)`
                    : `polygon(0 ${swipePosition}%, 100% ${swipePosition}%, 100% 100%, 0 100%)`
                }}
              />
              
              {swipeOrientation === 'vertical' ? (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 pointer-events-none"
                  style={{ left: `${swipePosition}%` }}
                >
                  <div className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">
                    ↔
                  </div>
                </div>
              ) : (
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-indigo-500 pointer-events-none"
                  style={{ top: `${swipePosition}%` }}
                >
                  <div className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">
                    ↕
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'edit-mask' && (
          <div className="flex flex-col gap-4 w-full items-center">
            {/* Editor Tools */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/30 border border-indigo-500/30 w-full max-w-3xl">
              <div className="flex items-center gap-3">
                <Brush className="h-5 w-5 text-indigo-400" />
                <span className="text-sm font-bold text-indigo-100">Mask Editor Tools</span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Brush Mode Toggle */}
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                  <button
                    onClick={() => setBrushMode('draw')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      brushMode === 'draw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Brush className="h-4 w-4" /> Draw (Add Change)
                  </button>
                  <button
                    onClick={() => setBrushMode('erase')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      brushMode === 'erase' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Eraser className="h-4 w-4" /> Erase (Remove)
                  </button>
                </div>

                {/* Brush Size Slider */}
                <div className="flex items-center gap-2 min-w-[120px]">
                  <span className="text-xs text-slate-400">Size: {brushSize}px</span>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={saveUpdatedMask}
                disabled={isSavingMask}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
              >
                {isSavingMask ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Mask
              </button>
            </div>

            {/* Canvas Area */}
            <div className="relative w-full max-w-3xl aspect-square bg-slate-900 rounded-xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl">
              {/* Reference Image (After) */}
              <img
                src={`/api/image?type=B&name=${selectedItem.image_b_name}`}
                alt="Reference (After)"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              />
              
              {/* Interactive Canvas (mix-blend-screen makes black transparent and white visible) */}
              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerOut={stopDrawing}
                className="absolute inset-0 w-full h-full object-cover cursor-crosshair touch-none mix-blend-screen opacity-70"
              />
              

            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-80 flex flex-col border-r border-slate-800 bg-slate-900/60 shrink-0">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              LEVIR CD Evaluation
            </span>
          </div>
          <button 
            onClick={() => {
              setEditingMetrics(settings.metrics);
              setShowSettingsModal(true);
            }}
            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-100"
            title="Configure metrics scale"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Evaluation Progress */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/30">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Evaluated Progress</span>
            <span className="font-semibold text-slate-200">{evaluatedCount} / {totalCount} ({completionPercentage}%)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search images or responses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-800/80 border border-slate-700 focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Status Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e: any) => setFilterStatus(e.target.value)}
                className="w-full text-xs rounded-lg bg-slate-800 border border-slate-700 py-1.5 px-2 focus:outline-none focus:border-indigo-500 text-slate-300"
              >
                <option value="all">All</option>
                <option value="evaluated">Evaluated</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Model Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full text-xs rounded-lg bg-slate-800 border border-slate-700 py-1.5 px-2 focus:outline-none focus:border-indigo-500 text-slate-300"
              >
                <option value="all">All Models</option>
                {modelsList.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Result List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
              <span>Loading results...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No matching items found.
            </div>
          ) : (
            filteredData.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              // Find the index in original array
              const origIndex = data.findIndex(d => d.id === item.id);
              
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedIndex(origIndex)}
                  className={`w-full text-left p-3.5 flex items-start justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-indigo-950/40 border-l-2 border-indigo-500' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-slate-500">#{item.index + 1}</span>
                      <span className="font-semibold text-sm truncate text-slate-200">
                        {item.image_a_name.replace('_A', '')}
                      </span>
                      {item.flagged && <Flag className="h-3 w-3 text-red-500 fill-red-500 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Model: <span className="font-mono text-slate-300">{item.model}</span>
                    </div>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {item.evaluated ? (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-500 fill-emerald-950/30" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-slate-700" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN VIEW */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {selectedItem ? (
          <>
            {/* Main Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/20">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>Change Detection Evaluation</span>
                    <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                      ID: {selectedItem.image_a_name.replace('_A', '')}
                    </span>
                    <button 
                      onClick={() => handleToggleFlag(selectedItem)}
                      className={`p-1 rounded-md transition-colors ${selectedItem.flagged ? 'text-red-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                      title={selectedItem.flagged ? "Remove Flag" : "Flag this result"}
                    >
                      <Flag className={`h-4.5 w-4.5 ${selectedItem.flagged ? 'fill-red-500' : ''}`} />
                    </button>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Model: <span className="font-mono text-slate-300">{selectedItem.model}</span> • File: <span className="font-mono">{selectedItem.image_a_name}</span> / <span className="font-mono">{selectedItem.image_b_name}</span>
                  </p>
                </div>
              </div>

              {/* Navigation and View Modes */}
              <div className="flex items-center gap-4">
                {/* View Selector */}
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setViewMode('side-by-side')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'side-by-side' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setViewMode('swipe')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'swipe' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Swipe (Compare)
                  </button>
                  <button
                    onClick={() => setViewMode('edit-mask')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'edit-mask' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Update Mask
                  </button>
                </div>                 {/* Maximize/Fullscreen & Arrow Navs */}
                 <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => setIsFullScreen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-855 text-xs font-semibold text-slate-300 hover:text-slate-100 transition-colors"
                    title="Open Full Screen Visualizer"
                  >
                    <Eye className="h-4 w-4 text-indigo-400" />
                    <span>Full Screen</span>
                  </button>

                  <button
                    onClick={navigatePrev}
                    className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-855 text-slate-300 hover:text-slate-100 disabled:opacity-40"
                    title="Previous Item (Alt + Left)"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={navigateNext}
                    className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-855 text-slate-300 hover:text-slate-100 disabled:opacity-40"
                    title="Next Item (Alt + Right)"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* Left/Middle Content: Images & Response */}
              <div className="flex-1 flex flex-col p-6 overflow-y-auto gap-6">
                
                {/* 1. IMAGE DISPLAY SECTION */}
                <div>
                  <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">
                    Images Visualizer
                  </h2>
                  
                  {renderVisualizerPanel(false)}
                </div>

                {/* 2. PROMPT & RESPONSE VIEW SECTION */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Model Response Card */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                        Model Output Response
                      </span>
                      <span className="text-[10px] bg-indigo-950/50 text-indigo-400 px-2 py-0.5 rounded font-semibold">
                        RAW RESPONSE
                      </span>
                    </div>
                    <div className="p-5 font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap select-text selection:bg-indigo-900/50">
                      {selectedItem.response || (
                        <span className="italic text-slate-600">No response returned.</span>
                      )}
                    </div>
                  </div>

                  {/* Accordion Prompt Card */}
                  <details className="group rounded-xl border border-slate-800 bg-slate-900/10 overflow-hidden">
                    <summary className="px-4 py-3 bg-slate-900/30 hover:bg-slate-900/50 cursor-pointer select-none flex items-center justify-between transition-colors">
                      <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                        View Input Prompt
                      </span>
                      <span className="text-xs text-indigo-400 group-open:hidden">Expand</span>
                      <span className="text-xs text-indigo-400 hidden group-open:inline">Collapse</span>
                    </summary>
                    <div className="p-4 border-t border-slate-800 bg-slate-900/5 text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed select-text">
                      {selectedItem.prompt}
                    </div>
                  </details>
                </div>

              </div>

              {/* Right Panel: Evaluation Scoring Form */}
              <div className="w-80 border-l border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                      Evaluation Sheet
                    </h2>
                    <p className="text-xs text-slate-400">
                      Provide a score and notes based on the model response compared with images.
                    </p>
                  </div>

                  {/* Saved Status Banner */}
                  {selectedItem.evaluated && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/60 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                      <div>
                        <span className="font-semibold block">Evaluated Record</span>
                        <span className="text-[10px] text-emerald-500 font-mono">
                          Saved: {selectedItem.evaluatedAt ? new Date(selectedItem.evaluatedAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Metrics Form */}
                  <div className="space-y-5">
                    {settings.metrics.length === 0 ? (
                      <div className="text-slate-500 text-xs italic">
                        No evaluation metrics defined. Click the settings gear above to add metrics.
                      </div>
                    ) : (
                      settings.metrics.map(metric => {
                        if (metric.type === 'scale') {
                          const currentVal = formScores[metric.id] ?? Number(metric.defaultValue);
                          const min = metric.min || 1;
                          const max = metric.max || 5;
                          
                          // Generate scale options
                          const options = [];
                          for (let i = min; i <= max; i++) {
                            options.push(i);
                          }

                          return (
                            <div key={metric.id} className="space-y-2">
                              <div className="flex justify-between items-baseline">
                                <label className="text-xs font-semibold text-slate-300 block">
                                  {metric.name}
                                </label>
                                <span className="text-indigo-400 font-mono text-sm font-bold">
                                  {currentVal}
                                </span>
                              </div>
                              
                              {metric.description && (
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  {metric.description}
                                </p>
                              )}

                              {/* Pill Button Scoring Row */}
                              <div className="flex flex-wrap gap-1">
                                {options.map(val => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => setFormScores(prev => ({ ...prev, [metric.id]: val }))}
                                    className={`flex-1 min-w-[32px] h-8 text-xs font-bold rounded border transition-colors ${
                                      currentVal === val
                                        ? 'bg-indigo-650 border-indigo-500 text-white'
                                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                                    }`}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })
                    )}

                    {/* Notes Text Area */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Feedback / Notes
                      </label>
                      <textarea
                        rows={6}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Explain manual score, what error occurred, etc."
                        className="w-full text-xs rounded-lg bg-slate-800 border border-slate-700 p-2.5 focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-600 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="space-y-2 pt-4 border-t border-slate-800 mt-6">
                  <button
                    onClick={handleSaveEvaluation}
                    disabled={isSaving}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Evaluation (Ctrl+Enter)
                  </button>
                  <p className="text-[10px] text-slate-500 text-center">
                    Auto-advances to the next item upon saving.
                  </p>
                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Please select an item from the sidebar to review.
          </div>
        )}
      </div>

      {/* FULL SCREEN VISUALIZER WORKSPACE */}
      {isFullScreen && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/98 z-40 flex flex-col p-6 overflow-hidden select-none">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Visualizer Workspace (Full Screen)</span>
                <span className="text-xs font-mono bg-slate-850 px-2 py-0.5 rounded text-slate-400">
                  ID: {selectedItem.image_a_name.replace('_A', '')}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Model: <span className="font-mono text-slate-300">{selectedItem.model}</span> • Hover over images to zoom synchronously
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* View Selector */}
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'side-by-side' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setViewMode('swipe')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'swipe' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Swipe (Compare)
                </button>
              </div>

              {/* Prev/Next arrows in modal */}
              <div className="flex gap-1.5">
                <button
                  onClick={navigatePrev}
                  className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-slate-100"
                  title="Previous Item"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={navigateNext}
                  className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-855 text-slate-300 hover:text-slate-100"
                  title="Next Item"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Exit Button */}
              <button
                onClick={() => setIsFullScreen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/50 border border-rose-900/40 text-xs text-rose-300 font-bold transition-all"
              >
                <X className="h-4.5 w-4.5" />
                <span>Exit Full Screen (Esc)</span>
              </button>
            </div>
          </div>

          {/* Large View Body */}
          <div className="flex-1 flex flex-col justify-center overflow-y-auto max-w-[85vw] mx-auto w-full py-4">
            {renderVisualizerPanel(true)}
          </div>
        </div>
      )}

      {/* METRICS SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-indigo-400" />
                Evaluation Metric Configuration
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-100 p-1 hover:bg-slate-850 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs text-slate-400">
                Define the metrics you want to evaluate for each model response. Each metric will render as a dynamic grading form on the sidebar sheet. Evaluated metrics are saved in the output JSON dataset.
              </p>

              <div className="space-y-3">
                {editingMetrics.map((metric, index) => (
                  <div 
                    key={metric.id} 
                    className="p-4 border border-slate-800 bg-slate-950/40 rounded-lg flex flex-col gap-3 relative group"
                  >
                    {/* Delete Metric Button */}
                    <button
                      onClick={() => handleRemoveMetric(metric.id)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-800/80 rounded transition-colors"
                      title="Remove Metric"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Metric Name */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Metric Name</label>
                        <input
                          type="text"
                          value={metric.name}
                          onChange={(e) => handleUpdateMetricField(index, 'name', e.target.value)}
                          className="w-full text-xs rounded-lg bg-slate-800 border border-slate-700 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 text-slate-200"
                        />
                      </div>

                      {/* Scale Min Limit */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Min Value</label>
                        <input
                          type="number"
                          value={metric.min || 1}
                          onChange={(e) => handleUpdateMetricField(index, 'min', Number(e.target.value))}
                          className="w-full text-xs rounded-lg bg-slate-800 border border-slate-700 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 text-slate-200"
                        />
                      </div>

                      {/* Scale Max Limit */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Max Value</label>
                        <input
                          type="number"
                          value={metric.max || 5}
                          onChange={(e) => handleUpdateMetricField(index, 'max', Number(e.target.value))}
                          className="w-full text-xs rounded-lg bg-slate-800 border border-slate-700 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Metric Default Value */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Default Score</label>
                        <input
                          type="number"
                          value={metric.defaultValue}
                          onChange={(e) => handleUpdateMetricField(index, 'defaultValue', Number(e.target.value))}
                          className="w-full text-xs rounded-lg bg-slate-800 border border-slate-700 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 text-slate-200"
                        />
                      </div>

                      {/* Metric Description */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Description (Tooltip)</label>
                        <input
                          type="text"
                          value={metric.description || ''}
                          onChange={(e) => handleUpdateMetricField(index, 'description', e.target.value)}
                          placeholder="e.g., Accuracy, clarity of coordinates"
                          className="w-full text-xs rounded-lg bg-slate-800 border border-slate-700 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-650"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Metric Button */}
              <button
                onClick={handleAddMetric}
                className="w-full border border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/10 text-slate-400 hover:text-indigo-400 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add New Score Metric
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-900/60">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-lg bg-indigo-650 hover:bg-indigo-500 text-xs text-white font-bold transition-colors"
              >
                Save Settings
              </button>
            </div>

          </div>
        </div>
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
