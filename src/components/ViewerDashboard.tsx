'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, SlidersHorizontal, FileSpreadsheet, Menu, LogOut } from 'lucide-react';
import { Metric, EvaluationSettings, RowData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { EvaluationDisplay } from '@/components/EvaluationDisplay';
import { Visualizer } from '@/components/Visualizer';

import { LoginPage } from '@/components/LoginPage';

export function ViewerDashboard() {
  const { logout } = useAuth();
  const [data, setData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [settings, setSettings] = useState<EvaluationSettings>({ metricsByPrompt: {} });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'evaluated' | 'pending'>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [promptFilter, setPromptFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [mainTab, setMainTab] = useState<'visualizer' | 'prompt' | 'response'>('visualizer');

  const [viewMode, setViewMode] = useState<'side-by-side' | 'swipe'>('side-by-side');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, dataRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/data'),
      ]);
      const settingsData = await settingsRes.json();
      setSettings(settingsData);

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

  useEffect(() => { loadData(); }, []);

  const selectedItem = data[selectedIndex];

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, selectedModel, promptFilter]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        const idx = filteredData.findIndex(item => item.id === selectedItem?.id);
        if (idx > 0) {
          const prevItem = filteredData[idx - 1];
          setSelectedIndex(data.findIndex(d => d.id === prevItem.id));
        }
      }
      if (e.altKey && e.key === 'ArrowRight') {
        const idx = filteredData.findIndex(item => item.id === selectedItem?.id);
        if (idx !== -1 && idx < filteredData.length - 1) {
          const nextItem = filteredData[idx + 1];
          setSelectedIndex(data.findIndex(d => d.id === nextItem.id));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, data, filteredData, selectedItem]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div className="glass-panel-solid p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}
          >
            <FileSpreadsheet className="h-6 w-6" />
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
      {showLogin && <LoginPage onClose={() => setShowLogin(false)} />}
      
      {/* Mobile overlay */}
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
          onToggleFlag={() => {}} // no-op for viewer
          role="viewer"
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
                
                <span className="badge-viewer">VIEWER</span>
              </div>
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium btn-ghost"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Login as Admin</span>
              </button>
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

              {/* Right Panel — Read-Only Evaluation Display */}
              <div className="h-[40vh] lg:h-full shrink-0 w-full lg:w-[320px] flex flex-col"
                style={{ borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}
              >
                <EvaluationDisplay selectedItem={selectedItem} settings={settings} />
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
    </div>
  );
}
