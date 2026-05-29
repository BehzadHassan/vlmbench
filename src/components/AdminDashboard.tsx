'use client';

import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Eye, SlidersHorizontal, FileSpreadsheet, Plus, Trash2, Menu, LogOut, Shield } from 'lucide-react';
import { Metric, EvaluationSettings, RowData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { EvaluationForm } from '@/components/EvaluationForm';
import { Visualizer } from '@/components/Visualizer';

export function AdminDashboard() {
  const { logout, adminToken } = useAuth();
  const [data, setData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection & Settings
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [settings, setSettings] = useState<EvaluationSettings>({ metrics: [] });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingMetrics, setEditingMetrics] = useState<Metric[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'evaluated' | 'pending'>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [mainTab, setMainTab] = useState<'visualizer' | 'prompt' | 'response'>('visualizer');

  // Form State
  const [formScores, setFormScores] = useState<Record<string, number>>({});
  const [formNotes, setFormNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // View Modes
  const [viewMode, setViewMode] = useState<'side-by-side' | 'swipe'>('side-by-side');

  // Mobile & Desktop State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
    return headers;
  };

  const loadDataAndSettings = async () => {
    setLoading(true);
    try {
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      setSettings(settingsData);
      setEditingMetrics(settingsData.metrics);

      const dataRes = await fetch('/api/data');
      const dataJson = await dataRes.json();
      if (dataJson.error) throw new Error(dataJson.error);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, selectedModel]);

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

  const itemsPerPage = 50;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const navigateNext = () => {
    if (filteredData.length === 0) return;
    const currentFilteredIndex = filteredData.findIndex(item => item.id === selectedItem?.id);
    if (currentFilteredIndex !== -1 && currentFilteredIndex < filteredData.length - 1) {
      const nextItem = filteredData[currentFilteredIndex + 1];
      const nextIndex = data.findIndex(item => item.id === nextItem.id);
      setSelectedIndex(nextIndex);
      setMobileMenuOpen(false);
    }
  };

  const navigatePrev = () => {
    if (filteredData.length === 0) return;
    const currentFilteredIndex = filteredData.findIndex(item => item.id === selectedItem?.id);
    if (currentFilteredIndex > 0) {
      const prevItem = filteredData[currentFilteredIndex - 1];
      const prevIndex = data.findIndex(item => item.id === prevItem.id);
      setSelectedIndex(prevIndex);
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') navigatePrev();
      if (e.altKey && e.key === 'ArrowRight') navigateNext();
      if (e.ctrlKey && e.key === 'Enter') handleSaveEvaluation();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formScores, formNotes, selectedIndex, data, settings]);

  const handleToggleFlag = async (item: RowData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newFlaggedState = !item.flagged;
    setData(prevData => prevData.map(d => d.id === item.id ? { ...d, flagged: newFlaggedState } : d));
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id: item.id, flagged: newFlaggedState }),
      });
      if (!response.ok) throw new Error('Failed to update flag');
    } catch (err: any) {
      alert(err.message || 'Error updating flag');
      setData(prevData => prevData.map(d => d.id === item.id ? { ...d, flagged: !newFlaggedState } : d));
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id: selectedItem.id,
          scores: formScores,
          notes: formNotes,
          evaluated: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to save evaluation');

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
      navigateNext();
    } catch (err: any) {
      alert(err.message || 'Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ metrics: editingMetrics }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      setSettings({ metrics: editingMetrics });
      setShowSettingsModal(false);
      loadDataAndSettings();
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div className="glass-panel-solid p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}
          >
            <Settings className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Configuration Error</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden relative"
      style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)' }}
    >
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(2, 6, 23, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${desktopSidebarOpen ? 'lg:block' : 'lg:hidden'}`}>
        <Sidebar
          data={data}
          filteredData={filteredData}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          modelsList={modelsList}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          paginatedData={paginatedData}
          selectedIndex={selectedIndex}
          setSelectedIndex={(idx) => {
            setSelectedIndex(idx);
            setMobileMenuOpen(false);
          }}
          selectedItem={selectedItem}
          onToggleFlag={handleToggleFlag}
          role="admin"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden z-20">
        {selectedItem ? (
          <>
            {/* Header */}
            <header className="h-14 px-4 lg:px-6 flex items-center justify-between shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}
            >
              <div className="flex items-center gap-3 lg:gap-5">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 -ml-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
                  className="hidden lg:block p-2 -ml-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="h-5 w-5 hidden sm:block" style={{ color: 'var(--accent-emerald)' }} />
                  <h1 className="text-base lg:text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    <span className="hidden sm:inline">LEVIR-CD </span>Evaluation
                  </h1>
                </div>
                <span className="badge-admin">ADMIN</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="Evaluation Settings"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium btn-ghost"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Switch Role</span>
                </button>
              </div>
            </header>

            {/* Tabbed Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex px-6 lg:px-8 pt-3 gap-6 shrink-0"
                  style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}
                >
                  {(['visualizer', 'response', 'prompt'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setMainTab(tab)}
                      className="pb-3 text-sm font-semibold transition-colors"
                      style={{
                        color: mainTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
                        borderBottom: mainTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                      }}
                    >
                      {tab === 'visualizer' ? 'Images Workspace' : tab === 'response' ? 'Model Response' : 'Input Prompt'}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8"
                  style={{ background: 'var(--bg-deep)' }}
                >
                  {mainTab === 'visualizer' && (
                    <div className="flex flex-col max-w-7xl mx-auto w-full min-h-full">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Image Comparison</h3>
                        <div className="flex items-center p-1 rounded-lg"
                          style={{ background: 'var(--bg-card)' }}
                        >
                          <button
                            onClick={() => setViewMode('side-by-side')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                            style={{
                              background: viewMode === 'side-by-side' ? 'var(--bg-card-highest)' : 'transparent',
                              color: viewMode === 'side-by-side' ? 'var(--accent-indigo-light)' : 'var(--text-muted)',
                              border: viewMode === 'side-by-side' ? '1px solid var(--border-default)' : '1px solid transparent',
                            }}
                          >
                            <Eye className="h-4 w-4" /> Compare
                          </button>
                          <button
                            onClick={() => setViewMode('swipe')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                            style={{
                              background: viewMode === 'swipe' ? 'var(--bg-card-highest)' : 'transparent',
                              color: viewMode === 'swipe' ? 'var(--accent-indigo-light)' : 'var(--text-muted)',
                              border: viewMode === 'swipe' ? '1px solid var(--border-default)' : '1px solid transparent',
                            }}
                          >
                            <SlidersHorizontal className="h-4 w-4" /> Swipe
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col pb-8">
                        <Visualizer selectedItem={selectedItem} viewMode={viewMode} />
                      </div>
                    </div>
                  )}

                  {mainTab === 'response' && (
                    <div className="glass-panel rounded-xl overflow-hidden h-full flex flex-col max-w-4xl mx-auto w-full">
                      <div className="px-5 py-4 flex items-center shrink-0"
                        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
                      >
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Raw Model Output
                        </span>
                      </div>
                      <div className="p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap select-text overflow-y-auto flex-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {selectedItem.response || (
                          <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>No response returned.</span>
                        )}
                      </div>
                    </div>
                  )}

                  {mainTab === 'prompt' && (
                    <div className="glass-panel rounded-xl overflow-hidden h-full flex flex-col max-w-4xl mx-auto w-full">
                      <div className="px-5 py-4 flex items-center shrink-0"
                        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
                      >
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Input Prompt Text
                        </span>
                      </div>
                      <div className="p-6 text-sm font-mono whitespace-pre-wrap leading-relaxed select-text overflow-y-auto flex-1"
                        style={{ color: 'var(--text-secondary)', background: 'rgba(2, 6, 23, 0.3)' }}
                      >
                        {selectedItem.prompt}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Evaluation Form */}
              <div className="h-[40vh] lg:h-full shrink-0 w-full lg:w-[320px] flex flex-col"
                style={{ borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}
              >
                <EvaluationForm
                  selectedItem={selectedItem}
                  settings={settings}
                  formScores={formScores}
                  setFormScores={setFormScores}
                  formNotes={formNotes}
                  setFormNotes={setFormNotes}
                  isSaving={isSaving}
                  onSave={handleSaveEvaluation}
                  onToggleFlag={handleToggleFlag}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="h-8 w-8 animate-spin mb-4" style={{ color: 'var(--accent-emerald)' }} />
            <p className="font-medium">Loading evaluation workspace...</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)' }}
        >
          <div className="glass-panel-solid rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-scale"
            style={{ boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
          >
            <div className="p-5 flex justify-between items-center shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Settings className="h-5 w-5" style={{ color: 'var(--accent-emerald)' }} />
                Evaluation Settings
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6"
              style={{ background: 'var(--bg-deep)' }}
            >
              <div className="space-y-4">
                {editingMetrics.map((metric, index) => (
                  <div key={metric.id} className="p-5 rounded-xl space-y-4 relative glass-card">
                    <button
                      onClick={() => setEditingMetrics(editingMetrics.filter(m => m.id !== metric.id))}
                      className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-rose)'; e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-label mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Metric Name</label>
                        <input
                          type="text"
                          value={metric.name}
                          onChange={(e) => {
                            const updated = [...editingMetrics];
                            updated[index] = { ...updated[index], name: e.target.value };
                            setEditingMetrics(updated);
                          }}
                          className="w-full text-sm rounded-lg py-2 px-3 font-medium dark-input"
                        />
                      </div>
                      <div>
                        <label className="text-label mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Description</label>
                        <input
                          type="text"
                          value={metric.description || ''}
                          onChange={(e) => {
                            const updated = [...editingMetrics];
                            updated[index] = { ...updated[index], description: e.target.value };
                            setEditingMetrics(updated);
                          }}
                          placeholder="e.g., Accuracy, clarity..."
                          className="w-full text-sm rounded-lg py-2 px-3 dark-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setEditingMetrics([...editingMetrics, {
                    id: `metric_${Date.now()}`,
                    name: 'New Metric',
                    type: 'scale',
                    min: 1, max: 5, defaultValue: 3, description: ''
                  }]);
                }}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  border: '2px dashed var(--border-default)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-emerald)';
                  e.currentTarget.style.color = 'var(--accent-emerald-light)';
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Plus className="h-4 w-4" /> Add Score Metric
              </button>
            </div>

            <div className="p-5 flex justify-end gap-3 shrink-0"
              style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}
            >
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-xl text-sm font-bold btn-emerald"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
