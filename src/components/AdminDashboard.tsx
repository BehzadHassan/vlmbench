'use client';

import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Eye, SlidersHorizontal, FileSpreadsheet, Plus, Trash2, Menu, LogOut, Shield, X, Copy } from 'lucide-react';
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
  const [settings, setSettings] = useState<EvaluationSettings>({ metricsByPrompt: {} });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingMetrics, setEditingMetrics] = useState<Record<string, Metric[]>>({});
  const [activeSettingsPrompt, setActiveSettingsPrompt] = useState<string>('P1');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'evaluated' | 'pending'>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [promptFilter, setPromptFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [mainTab, setMainTab] = useState<'visualizer' | 'prompt' | 'response'>('visualizer');

  // Form State
  const [formScores, setFormScores] = useState<Record<string, number>>({});
  const [formNotes, setFormNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // View Modes
  const [viewMode, setViewMode] = useState<'side-by-side' | 'swipe'>('side-by-side');

  // Mobile & Desktop State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Notifications & Modals
  const [toastMessage, setToastMessage] = useState<{ title: string, message: string, type: 'success' | 'error' } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const showToast = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

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
      setEditingMetrics(settingsData.metricsByPrompt || {});

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
      const currentMetrics = settings.metricsByPrompt?.[selectedItem.promptId] || [];
      currentMetrics.forEach(m => {
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
  }, [searchTerm, filterStatus, selectedModel, promptFilter]);

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
    const matchesPrompt =
      promptFilter === 'all' ? true : item.promptId === promptFilter;
    return matchesSearch && matchesStatus && matchesModel && matchesPrompt;
  });

  const itemsPerPage = 50;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const currentFilteredIndex = selectedItem ? filteredData.findIndex(item => item.id === selectedItem.id) : -1;
  const nextItem = currentFilteredIndex !== -1 && currentFilteredIndex < filteredData.length - 1 
    ? filteredData[currentFilteredIndex + 1] 
    : null;

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
      showToast('Error', err.message || 'Error updating flag', 'error');
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
      showToast('Saved', 'Evaluation saved successfully.', 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Error saving', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearEvaluation = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id: selectedItem.id,
          scores: {},
          notes: '',
          evaluated: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to clear evaluation');

      setData(prevData => {
        const newData = [...prevData];
        newData[selectedIndex] = {
          ...newData[selectedIndex],
          evaluated: false,
          scores: {},
          notes: '',
        };
        return newData;
      });
      showToast('Cleared', 'Evaluation has been reset.', 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Error clearing', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllEvaluations = () => {
    setShowClearConfirm(true);
  };

  const executeClearAll = async () => {
    setIsClearingAll(true);
    try {
      const response = await fetch('/api/evaluate?clearAll=true', {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error('Failed to clear all evaluations');
      
      setData(prevData => prevData.map(item => ({
        ...item,
        evaluated: false,
        scores: {},
        notes: ''
      })));
      setShowSettingsModal(false);
      setShowClearConfirm(false);
      showToast('Evaluations Cleared', 'All records have been reset successfully.', 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Error clearing evaluations', 'error');
      setShowClearConfirm(false);
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ metricsByPrompt: editingMetrics }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      setSettings({ metricsByPrompt: editingMetrics });
      setShowSettingsModal(false);
      loadDataAndSettings();
      showToast('Settings Saved', 'Configuration updated successfully.', 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Error saving settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div className="glass-panel-solid p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}
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
          style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
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
          promptFilter={promptFilter}
          setPromptFilter={setPromptFilter}
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

      {/* Preloader for next item */}
      {nextItem && (
        <div style={{ display: 'none' }}>
          <img src={`/val/A/${nextItem.image_a_name.replace('_A', '')}.png`} />
          <img src={`/val/B/${nextItem.image_b_name.replace('_B', '')}.png`} />
          <img src={`/val/label/${nextItem.image_a_name.replace('_A', '')}.png`} />
        </div>
      )}

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
                  <FileSpreadsheet className="h-5 w-5 hidden sm:block" style={{ color: 'var(--accent-indigo)' }} />
                  <h1 className="text-base lg:text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    <span className="hidden sm:inline">LEVIR-CD </span>Evaluation
                  </h1>
                </div>

                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedItem.image_a_name.replace('_A', '')}
                  </span>
                  <span className="w-1 h-1 rounded-full" style={{ background: 'var(--border-strong)' }}></span>
                  <span className="text-sm font-bold" style={{ color: 'var(--accent-indigo)' }}>
                    {selectedItem.promptId}
                  </span>
                </div>

                <span className="badge-admin">ADMIN</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="Evaluation Settings"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium btn-ghost"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
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
                        style={{ color: 'var(--text-secondary)', background: 'var(--bg-card-highest)' }}
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
                  onClear={handleClearEvaluation}
                  onToggleFlag={handleToggleFlag}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="h-8 w-8 animate-spin mb-4" style={{ color: 'var(--accent-indigo)' }} />
            <p className="font-medium">Loading evaluation workspace...</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
        >
          <div className="glass-panel-solid rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-scale"
            style={{ boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
          >
            <div className="p-5 flex justify-between items-center shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Settings className="h-5 w-5" style={{ color: 'var(--accent-indigo)' }} />
                Evaluation Settings
              </h2>
            </div>
            
            <div className="flex px-6 pt-3 gap-6 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              {['P1', 'P2', 'P3', 'P4'].map(promptId => (
                <button
                  key={promptId}
                  onClick={() => setActiveSettingsPrompt(promptId)}
                  className="pb-3 text-sm font-semibold transition-colors"
                  style={{
                    color: activeSettingsPrompt === promptId ? 'var(--accent-blue)' : 'var(--text-muted)',
                    borderBottom: activeSettingsPrompt === promptId ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  }}
                >
                  Prompt {promptId}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6"
              style={{ background: 'var(--bg-deep)' }}
            >
              <div className="space-y-4">
                {(editingMetrics[activeSettingsPrompt] || []).map((metric, index) => (
                  <div key={metric.id} className="p-5 rounded-xl space-y-4 relative glass-card">
                    <button
                      onClick={() => {
                        const updated = { ...editingMetrics };
                        updated[activeSettingsPrompt] = updated[activeSettingsPrompt].filter(m => m.id !== metric.id);
                        setEditingMetrics(updated);
                      }}
                      className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-rose)'; e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-label mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Metric Name</label>
                          <input
                            type="text"
                            value={metric.name}
                            onChange={(e) => {
                              const updated = { ...editingMetrics };
                              updated[activeSettingsPrompt] = [...(updated[activeSettingsPrompt] || [])];
                              updated[activeSettingsPrompt][index] = { ...updated[activeSettingsPrompt][index], name: e.target.value };
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
                              const updated = { ...editingMetrics };
                              updated[activeSettingsPrompt] = [...(updated[activeSettingsPrompt] || [])];
                              updated[activeSettingsPrompt][index] = { ...updated[activeSettingsPrompt][index], description: e.target.value };
                              setEditingMetrics(updated);
                            }}
                            placeholder="e.g., Accuracy, clarity..."
                            className="w-full text-sm rounded-lg py-2 px-3 dark-input"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-label mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                          Scoring Explainer <span className="text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">Optional</span>
                        </label>
                        <input
                          type="text"
                          value={metric.rangeExplainer || ''}
                          onChange={(e) => {
                            const updated = { ...editingMetrics };
                            updated[activeSettingsPrompt] = [...(updated[activeSettingsPrompt] || [])];
                            updated[activeSettingsPrompt][index] = { ...updated[activeSettingsPrompt][index], rangeExplainer: e.target.value };
                            setEditingMetrics(updated);
                          }}
                          placeholder="e.g., 5=Excellent, 1=Poor"
                          className="w-full text-sm rounded-lg py-2 px-3 dark-input"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-label mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Min Value</label>
                          <input
                            type="number"
                            value={metric.min ?? ''}
                            onChange={(e) => {
                              const updated = { ...editingMetrics };
                              updated[activeSettingsPrompt] = [...(updated[activeSettingsPrompt] || [])];
                              const val = e.target.value;
                              updated[activeSettingsPrompt][index] = { ...updated[activeSettingsPrompt][index], min: val === '' ? undefined : Number(val) };
                              setEditingMetrics(updated);
                            }}
                            className="w-full text-sm rounded-lg py-2 px-3 dark-input"
                          />
                        </div>
                        <div>
                          <label className="text-label mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Max Value</label>
                          <input
                            type="number"
                            value={metric.max ?? ''}
                            onChange={(e) => {
                              const updated = { ...editingMetrics };
                              updated[activeSettingsPrompt] = [...(updated[activeSettingsPrompt] || [])];
                              const val = e.target.value;
                              updated[activeSettingsPrompt][index] = { ...updated[activeSettingsPrompt][index], max: val === '' ? undefined : Number(val) };
                              setEditingMetrics(updated);
                            }}
                            className="w-full text-sm rounded-lg py-2 px-3 dark-input"
                          />
                        </div>
                        <div>
                          <label className="text-label mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Default Value</label>
                          <input
                            type="number"
                            value={metric.defaultValue ?? ''}
                            onChange={(e) => {
                              const updated = { ...editingMetrics };
                              updated[activeSettingsPrompt] = [...(updated[activeSettingsPrompt] || [])];
                              const val = e.target.value;
                              updated[activeSettingsPrompt][index] = { ...updated[activeSettingsPrompt][index], defaultValue: val === '' ? '' : Number(val) };
                              setEditingMetrics(updated);
                            }}
                            className="w-full text-sm rounded-lg py-2 px-3 dark-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const updated = { ...editingMetrics };
                  updated[activeSettingsPrompt] = [
                    ...(updated[activeSettingsPrompt] || []),
                    {
                      id: `metric_${Date.now()}`,
                      name: 'New Metric',
                      type: 'scale',
                      min: 0, max: 5, defaultValue: 3, description: ''
                    }
                  ];
                  setEditingMetrics(updated);
                }}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  border: '2px dashed var(--border-default)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-indigo)';
                  e.currentTarget.style.color = 'var(--accent-indigo-light)';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Plus className="h-4 w-4" /> Add Score Metric
              </button>

              <button
                onClick={() => {
                  const currentMetrics = [...(editingMetrics[activeSettingsPrompt] || [])];
                  const updated = { ...editingMetrics };
                  ['P1', 'P2', 'P3', 'P4'].forEach(prompt => {
                    if (prompt !== activeSettingsPrompt) {
                      updated[prompt] = JSON.parse(JSON.stringify(currentMetrics));
                    }
                  });
                  setEditingMetrics(updated);
                  showToast('Copied', `Metrics from ${activeSettingsPrompt} applied to all prompts.`, 'success');
                }}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 mt-2"
                style={{
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-indigo)';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }}
              >
                <Copy className="h-4 w-4" /> Apply these metrics to all prompts
              </button>
            </div>

            <div className="p-5 flex justify-between shrink-0 items-center"
              style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}
            >
              <button
                onClick={handleClearAllEvaluations}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ color: 'var(--accent-rose)', border: '1px solid var(--accent-rose)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Clear All Evaluations
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold btn-indigo disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
                >
                  {isSavingSettings ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    'Save Configuration'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
        >
          <div className="glass-panel-solid rounded-2xl max-w-sm w-full p-6 text-center animate-fade-in-scale shadow-2xl"
            style={{ border: '1px solid rgba(244, 63, 94, 0.2)' }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)' }}
            >
              <Trash2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Clear All Evaluations?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              This action cannot be undone. All evaluation scores, notes, and progress will be permanently erased.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={executeClearAll}
                disabled={isClearingAll}
                className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[130px]"
                style={{ background: 'var(--accent-rose)', color: 'white' }}
              >
                {isClearingAll ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Clearing...</>
                ) : (
                  'Yes, Clear All'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[70] animate-fade-in-down flex items-start gap-3 p-4 rounded-xl shadow-2xl min-w-[300px]"
          style={{
            background: 'var(--bg-elevated)',
            border: `1px solid ${toastMessage.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-emerald)'}`,
            color: 'var(--text-primary)'
          }}
        >
          <div className="w-2 h-10 rounded-full shrink-0" style={{ background: toastMessage.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}></div>
          <div className="flex-1 pr-6">
            <h4 className="text-sm font-bold">{toastMessage.title}</h4>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{toastMessage.message}</p>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="absolute top-4 right-4 p-1 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
