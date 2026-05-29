import React from 'react';
import { Search, ChevronLeft, ChevronRight, CheckCircle, Circle, Flag, RefreshCw } from 'lucide-react';
import { RowData } from '../types';

interface SidebarProps {
  data: RowData[];
  filteredData: RowData[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterStatus: 'all' | 'evaluated' | 'pending';
  setFilterStatus: (s: 'all' | 'evaluated' | 'pending') => void;
  selectedModel: string;
  setSelectedModel: (s: string) => void;
  modelsList: string[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  paginatedData: RowData[];
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  selectedItem: RowData | null;
  onToggleFlag: (item: RowData, e?: React.MouseEvent) => void;
  role?: 'viewer' | 'admin';
}

export function Sidebar(props: SidebarProps) {
  const {
    data, filteredData, loading, searchTerm, setSearchTerm, filterStatus, setFilterStatus,
    selectedModel, setSelectedModel, modelsList, currentPage, setCurrentPage, totalPages,
    paginatedData, selectedIndex, setSelectedIndex, selectedItem, onToggleFlag, role = 'admin'
  } = props;

  const evaluatedCount = data.filter(d => d.evaluated).length;
  const totalCount = data.length;
  const completionPercentage = totalCount > 0 ? Math.round((evaluatedCount / totalCount) * 100) : 0;

  const isViewer = role === 'viewer';
  const highlightColor = 'var(--accent-blue)';
  const progressFillColor = 'var(--accent-teal)';
  const checkmarkColor = 'var(--accent-teal-light)';

  return (
    <div className="w-[85vw] sm:w-[320px] lg:w-[320px] flex flex-col h-full shrink-0"
      style={{ background: 'var(--bg-base)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="p-5 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          Dataset Items
        </h2>

        {/* Progress */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            <span>Progress</span>
            <span style={{ color: completionPercentage === 100 ? 'var(--accent-emerald-light)' : 'var(--text-secondary)' }}>
              {evaluatedCount} / {totalCount} ({completionPercentage}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card-highest)' }}>
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${completionPercentage}%`,
                background: progressFillColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 space-y-3 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm dark-input"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e: any) => setFilterStatus(e.target.value)}
            className="flex-1 text-xs font-medium rounded-lg px-2.5 py-2 cursor-pointer dark-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="evaluated">Evaluated</option>
          </select>

          <select
            value={selectedModel}
            onChange={(e: any) => setSelectedModel(e.target.value)}
            className="flex-1 text-xs font-medium rounded-lg px-2.5 py-2 cursor-pointer dark-select"
          >
            <option value="all">All Models</option>
            {modelsList.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm flex flex-col items-center gap-3" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="h-5 w-5 animate-spin" style={{ color: highlightColor }} />
            <span className="font-medium">Loading dataset...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            No matching items found.
          </div>
        ) : (
          paginatedData.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const origIndex = data.findIndex(d => d.id === item.id);

            return (
              <button
                key={item.id}
                onClick={() => setSelectedIndex(origIndex)}
                className="w-full text-left p-4 flex items-start justify-between gap-3 transition-all duration-200"
                style={{
                  background: isSelected ? 'rgba(55, 138, 221, 0.1)' : 'transparent',
                  borderLeft: isSelected ? `3px solid ${highlightColor}` : '3px solid transparent',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                      style={{ color: 'var(--text-muted)', background: 'var(--bg-card-highest)' }}
                    >
                      #{item.index + 1}
                    </span>
                    <span className="font-semibold text-sm truncate"
                      style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {item.image_a_name.replace('_A', '')}
                    </span>
                    {item.flagged && <Flag className="h-3.5 w-3.5 shrink-0 fill-current" style={{ color: 'var(--accent-rose)' }} />}
                  </div>
                  <div className="text-[11px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                    Model: <span style={{ color: 'var(--text-secondary)' }}>{item.model}</span>
                  </div>
                </div>
                <div className="shrink-0 mt-0.5">
                  {item.evaluated ? (
                    <CheckCircle className="h-5 w-5" style={{ color: checkmarkColor }} />
                  ) : (
                    <Circle className="h-5 w-5" style={{ color: 'var(--text-faint)' }} />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredData.length > 0 && (
        <div className="p-3 flex items-center justify-between shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
        >
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md disabled:opacity-30 transition-colors btn-ghost"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md disabled:opacity-30 transition-colors btn-ghost"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
