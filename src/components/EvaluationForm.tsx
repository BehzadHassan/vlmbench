import React from 'react';
import { Save } from 'lucide-react';
import { RowData, EvaluationSettings, Metric } from '../types';

interface EvaluationFormProps {
  selectedItem: RowData | null;
  settings: EvaluationSettings;
  formScores: Record<string, number>;
  setFormScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  formNotes: string;
  setFormNotes: (notes: string) => void;
  isSaving: boolean;
  onSave: () => void;
  onToggleFlag: (item: RowData, e?: React.MouseEvent) => void;
}

export function EvaluationForm(props: EvaluationFormProps) {
  const {
    selectedItem, settings, formScores, setFormScores,
    formNotes, setFormNotes, isSaving, onSave, onToggleFlag
  } = props;

  if (!selectedItem) {
    return (
      <div className="w-full h-full flex items-center justify-center font-medium text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        Select an item to evaluate
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col shrink-0 relative">
      {/* Header */}
      <div className="p-5 flex justify-between items-center shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Score & Feedback</h2>
        <button
          onClick={(e) => onToggleFlag(selectedItem, e)}
          title={selectedItem.flagged ? "Unflag Item" : "Flag for review"}
          className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
          style={{
            background: 'var(--accent-coral)',
            border: '1px solid var(--accent-coral)',
            color: 'var(--accent-coral-text)',
            opacity: selectedItem.flagged ? 1 : 0.85,
            boxShadow: selectedItem.flagged ? '0 0 12px rgba(216, 90, 48, 0.4)' : 'none',
          }}
        >
          {selectedItem.flagged ? 'FLAGGED' : 'FLAG'}
        </button>
      </div>

      {/* Scores */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {settings.metrics.length === 0 ? (
          <div className="text-sm p-4 rounded-lg text-center font-medium"
            style={{ background: 'rgba(2, 6, 23, 0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            No metrics defined. Please add metrics in Settings.
          </div>
        ) : (
          settings.metrics.map(metric => {
            const currentValue = Number(formScores[metric.id] || metric.defaultValue);
            const min = metric.min || 1;
            const max = metric.max || 5;
            const percentage = ((currentValue - min) / (max - min)) * 100;
            const thumbColor = metric.id === 'correctness' ? 'var(--accent-purple)' : metric.id === 'completeness' ? 'var(--accent-amber-slider)' : 'var(--accent-indigo)';
            const trackColor = metric.id === 'correctness' ? 'var(--accent-purple-bg)' : metric.id === 'completeness' ? 'var(--accent-amber-bg)' : 'var(--bg-card-highest)';
            
            return (
              <div key={metric.id} className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {metric.name}
                  </label>
                  <span className="text-sm font-bold tabular-nums px-2 py-0.5 rounded"
                    style={{
                      background: metric.id === 'correctness' ? 'rgba(127, 119, 221, 0.15)' : metric.id === 'completeness' ? 'rgba(239, 159, 39, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: thumbColor
                    }}
                  >
                    {currentValue}
                  </span>
                </div>
                {metric.description && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{metric.description}</p>
                )}
                {metric.type === 'scale' && (
                  <div className="pt-2">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step="1"
                      value={currentValue}
                      onChange={(e) => setFormScores(prev => ({
                        ...prev,
                        [metric.id]: Number(e.target.value)
                      }))}
                      className="w-full"
                      style={{
                        background: `linear-gradient(to right, ${thumbColor} ${percentage}%, ${trackColor} ${percentage}%)`,
                        '--slider-thumb': thumbColor,
                      } as React.CSSProperties}
                    />
                    <div className="flex justify-between text-[11px] font-semibold mt-2 px-1" style={{ color: 'var(--text-faint)' }}>
                      <span>{min}</span>
                      <span>{max}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Notes */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Feedback Notes
          </label>
          <textarea
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            className="w-full h-32 rounded-xl p-3 text-sm resize-none dark-input"
            placeholder="Add detailed qualitative feedback here..."
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-2 btn-teal disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save & Next (Ctrl+Enter)'}
        </button>
      </div>
    </div>
  );
}
