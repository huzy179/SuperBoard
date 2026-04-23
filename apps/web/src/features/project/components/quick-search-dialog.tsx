'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, CornerDownLeft, X } from 'lucide-react';
import type { ProjectTaskItemDTO } from '@superboard/shared';

interface QuickSearchDialogProps {
  tasks: ProjectTaskItemDTO[];
  projectId: string;
  onClose: () => void;
  onSelectTask: (taskId: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  todo: { label: '○', bg: 'bg-slate-100', text: 'text-slate-600' },
  in_progress: { label: '→', bg: 'bg-blue-100', text: 'text-blue-700' },
  review: { label: '👁', bg: 'bg-purple-100', text: 'text-purple-700' },
  done: { label: '✓', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

export function QuickSearchDialog({ tasks, onClose, onSelectTask }: QuickSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? tasks.filter((task) => {
        const code = task.number != null ? String(task.number) : '';
        return (
          task.title.toLowerCase().includes(normalizedQuery) ||
          code.includes(normalizedQuery) ||
          (task.description ?? '').toLowerCase().includes(normalizedQuery)
        );
      })
    : tasks.slice(0, 10);

  useEffect(() => {
    setSelectedIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  function handleKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (results[selectedIndex]) {
          onSelectTask(results[selectedIndex]!.id);
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/80 pt-32 backdrop-blur-sm animate-fade-in overflow-hidden"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Quick Search"
    >
      {/* Search Pulse Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] bg-brand-500/[0.03] rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <div className="w-full max-w-2xl rounded-xl border border-white/5 bg-surface-card shadow-glass overflow-hidden animate-slide-up relative group">
        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Search input hub */}
        <div className="flex items-center gap-4 px-6 py-5 relative border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-brand-500/10 border border-brand-500/20">
            <Search size={18} className="text-brand-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, IDs, or signals..."
            className="flex-1 bg-transparent text-xl font-bold text-white placeholder-white/5 outline-none tracking-tight"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-md border border-white/5">
            <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">
              ESC
            </span>
          </div>
        </div>

        {/* Results Stream */}
        <div className="max-h-[55vh] overflow-y-auto elite-scrollbar relative bg-black/10">
          {results.length > 0 ? (
            <ul ref={listRef} className="py-4 px-4 space-y-1.5">
              {results.map((task, index) => {
                const statusStyle = STATUS_LABELS[task.status] ?? STATUS_LABELS['todo']!;
                const isSelected = index === selectedIndex;
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => onSelectTask(task.id)}
                      className={`group relative flex w-full items-center gap-4 px-5 py-4 text-left transition-all duration-200 rounded-lg border overflow-hidden ${
                        isSelected
                          ? 'bg-white border-white scale-[1.02] z-10 shadow-luxe'
                          : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'
                      }`}
                    >
                      {/* Status Indicator node */}
                      <div className="relative flex-shrink-0">
                        <span
                          className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[10px] font-bold transition-all duration-200 ${
                            isSelected
                              ? 'bg-slate-950 text-white'
                              : 'bg-white/5 text-white/20 border border-white/5'
                          }`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 relative z-10">
                        <div className="flex items-center justify-between mb-0.5">
                          <p
                            className={`truncate text-sm font-bold tracking-tight ${
                              isSelected ? 'text-slate-950' : 'text-white/80'
                            }`}
                          >
                            {task.title}
                          </p>
                          {isSelected && (
                            <span className="text-[8px] font-bold text-brand-600 uppercase tracking-widest animate-fade-in">
                              ACTIVE_NODE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-mono text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm ${
                              isSelected
                                ? 'bg-slate-900/10 text-slate-950/50'
                                : 'bg-white/5 text-white/30'
                            }`}
                          >
                            U_{task.number ?? '000'}
                          </span>
                          <span
                            className={`h-1 w-1 rounded-full ${isSelected ? 'bg-slate-950/20' : 'bg-white/10'}`}
                          />
                          <span
                            className={`text-[9px] font-bold uppercase tracking-widest ${
                              isSelected ? 'text-brand-700' : 'text-brand-500/50'
                            }`}
                          >
                            P_{task.priority}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-3 animate-fade-in relative z-10">
                          <div className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-950 text-white shadow-glow-brand/10">
                            <CornerDownLeft size={14} />
                          </div>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-10 py-24 text-center flex flex-col items-center gap-4 relative">
              <div className="h-16 w-16 bg-white/5 rounded-lg flex items-center justify-center border border-white/5">
                <X size={24} className="text-white/10" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-white/20 uppercase tracking-[0.2em] text-xs">
                  No signals found
                </p>
                <p className="text-[9px] font-medium text-white/5 uppercase tracking-widest">
                  Try a different frequency or search term
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tactical Footer */}
        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4 bg-white/[0.01] backdrop-blur-xl relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
              {results.length} nodes indexed
            </span>
          </div>
          <div className="flex items-center gap-6 text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5">↵</kbd>
              <span>Select</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
