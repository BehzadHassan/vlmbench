'use client';

import React from 'react';
import { CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { RowData, EvaluationSettings } from '../types';

interface EvaluationDisplayProps {
  selectedItem: RowData | null;
  settings: EvaluationSettings;
}

export function EvaluationDisplay({ selectedItem, settings }: EvaluationDisplayProps) {
  if (!selectedItem) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        <span className="font-medium text-sm">Select an item to view</span>
      </div>
    );
  }

  const isEvaluated = selectedItem.evaluated;

  return (
    <div className="w-full h-full flex flex-col shrink-0">
      {/* Header */}
      <div className="p-5 flex justify-between items-center shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Evaluation Results
        </h2>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${isEvaluated ? '' : ''}`}
          style={{
            background: isEvaluated ? 'rgba(29, 158, 117, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: isEvaluated ? 'var(--accent-teal-light)' : 'var(--accent-amber)',
            border: `1px solid ${isEvaluated ? 'rgba(29, 158, 117, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
          }}
        >
          {isEvaluated ? (
            <><CheckCircle className="w-3.5 h-3.5" /> Evaluated</>
          ) : (
            <><Clock className="w-3.5 h-3.5" /> Pending</>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {!isEvaluated ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center"
              style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
            >
              <Clock className="w-6 h-6" style={{ color: 'var(--accent-amber)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Not yet evaluated
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              This item is awaiting admin evaluation.
            </p>
          </div>
        ) : (
          <>
            {/* Scores */}
            {settings.metrics.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-label" style={{ color: 'var(--text-muted)' }}>Scores</h3>
                {settings.metrics.map(metric => {
                  const score = selectedItem.scores?.[metric.id];
                  const min = metric.min || 1;
                  const max = metric.max || 5;
                  const percentage = score !== undefined ? ((score - min) / (max - min)) * 100 : 0;

                  return (
                    <div key={metric.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {metric.name}
                        </span>
                        <span className="text-sm font-bold tabular-nums px-2.5 py-0.5 rounded-md"
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--accent-indigo-light)',
                          }}
                        >
                          {score !== undefined ? score : '—'} / {max}
                        </span>
                      </div>
                      {metric.description && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{metric.description}</p>
                      )}
                      {/* Score bar */}
                      <div className="w-full h-2 rounded-full overflow-hidden"
                        style={{ background: 'var(--bg-card-highest)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: score !== undefined ? `${percentage}%` : '0%',
                            background: percentage >= 70
                              ? 'var(--accent-emerald)'
                              : percentage >= 40
                                ? 'var(--accent-indigo)'
                                : 'var(--accent-rose)',
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold" style={{ color: 'var(--text-faint)' }}>
                        <span>{min}</span>
                        <span>{max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes */}
            <div className="divider" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <h3 className="text-label" style={{ color: 'var(--text-muted)' }}>Feedback Notes</h3>
              </div>
              <div className="p-3 rounded-lg text-sm" 
                style={{ 
                  background: 'rgba(2, 6, 23, 0.3)', 
                  border: '1px solid var(--border-subtle)',
                  color: selectedItem.notes ? 'var(--text-secondary)' : 'var(--text-faint)',
                }}
              >
                {selectedItem.notes || 'No notes provided.'}
              </div>
            </div>

            {/* Evaluated timestamp */}
            {selectedItem.evaluatedAt && (
              <div className="pt-2">
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                  Evaluated: {new Date(selectedItem.evaluatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </>
        )}

        {/* Item flagged badge */}
        {selectedItem.flagged && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              color: 'var(--accent-rose)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
            }}
          >
            ⚑ This item has been flagged for review
          </div>
        )}
      </div>
    </div>
  );
}
