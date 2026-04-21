'use client';

import { useEffect, useRef, useState } from 'react';
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
      className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/80 pt-32 backdrop-blur-[60px] animate-in fade-in duration-500 overflow-hidden"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Signal Finder"
    >
      {/* Search Pulse Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] bg-brand-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse" />

      <div className="w-full max-w-2xl rounded-[3rem] border border-white/10 bg-white/[0.01] shadow-luxe backdrop-blur-3xl overflow-hidden animate-in zoom-in-95 duration-700 relative group">
        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Search input hub */}
        <div className="flex items-center gap-6 px-10 py-8 relative border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 shadow-glow-brand/10">
            <span className="text-xl">🔍</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ACCESS MISSION SIGNAL..."
            className="flex-1 bg-transparent text-2xl font-black text-white placeholder-white/5 outline-none tracking-tighter uppercase italic"
          />
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 shadow-inner">
            <span className="text-[10px] font-black text-white/20 tracking-widest uppercase">
              ESC_CLOSE
            </span>
          </div>
        </div>

        {/* Results Stream */}
        <div className="max-h-[55vh] overflow-y-auto elite-scrollbar relative bg-slate-950/20">
          {results.length > 0 ? (
            <ul ref={listRef} className="py-6 px-6 space-y-3">
              {results.map((task, index) => {
                const statusStyle = STATUS_LABELS[task.status] ?? STATUS_LABELS['todo']!;
                const isSelected = index === selectedIndex;
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => onSelectTask(task.id)}
                      className={`group relative flex w-full items-center gap-6 px-8 py-5 text-left transition-all duration-500 rounded-[2.25rem] border overflow-hidden ${
                        isSelected
                          ? 'bg-white border-white scale-105 z-10 shadow-luxe'
                          : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10'
                      }`}
                    >
                      {/* Internal Highlight for Selection */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-brand-500/5 animate-pulse" />
                      )}

                      {/* Status Indicator node */}
                      <div className="relative flex-shrink-0">
                        {isSelected && (
                          <div
                            className={`absolute inset-0 blur-lg opacity-40 scale-150 rounded-full bg-brand-500`}
                          />
                        )}
                        <span
                          className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[10px] font-black shadow-inner transition-all duration-500 ${
                            isSelected
                              ? 'bg-slate-950 text-white shadow-glow-brand/20'
                              : 'bg-white/5 text-white/20 border border-white/5'
                          }`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 relative z-10">
                        <div className="flex items-center justify-between mb-1.5">
                          <p
                            className={`truncate text-base font-black tracking-tight uppercase italic ${
                              isSelected ? 'text-slate-950' : 'text-white/80'
                            }`}
                          >
                            {task.title}
                          </p>
                          {isSelected && (
                            <span className="text-[8px] font-black text-brand-500 uppercase tracking-widest animate-in slide-in-from-right-2">
                              MATCH_FOUND
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`font-mono text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-slate-900/10 text-slate-950/40'
                                : 'bg-white/5 text-white/20'
                            }`}
                          >
                            {task.number != null ? `U_${task.number}` : 'UNIT_ID_NULL'}
                          </span>
                          <span
                            className={`h-1 w-1 rounded-full ${isSelected ? 'bg-slate-950/20' : 'bg-white/10'}`}
                          />
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest ${
                              isSelected ? 'text-brand-600' : 'text-brand-400 opacity-60'
                            }`}
                          >
                            PRIO_{task.priority}
                          </span>
                          <span
                            className={`h-1 w-1 rounded-full ${isSelected ? 'bg-slate-950/20' : 'bg-white/10'}`}
                          />
                          <span
                            className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-slate-950/40' : 'text-white/10'}`}
                          >
                            SEQ_{index.toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-500 relative z-10">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-950 text-white shadow-glow-brand/20">
                            <span className="text-[9px] font-black">↵</span>
                          </div>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-10 py-32 text-center flex flex-col items-center gap-6 relative">
              <div className="absolute inset-0 bg-red-500/[0.02] animate-pulse pointer-events-none" />
              <div className="h-20 w-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/5 shadow-inner">
                <span className="text-3xl grayscale opacity-40">∅</span>
              </div>
              <div className="space-y-2">
                <p className="font-black text-white/20 uppercase tracking-[0.5em] text-xs">
                  No Signal Matches
                </p>
                <p className="text-[9px] font-bold text-white/5 uppercase tracking-widest">
                  Adjust frequency or mission parameters
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tactical Footer */}
        <div className="flex items-center justify-between border-t border-white/5 px-10 py-6 bg-white/[0.02] backdrop-blur-xl relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-glow-emerald animate-pulse" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] block leading-none">
                {results.length} NODES_INDEXED
              </span>
              <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em] block">
                STABLE_VOID_LINK
              </span>
            </div>
          </div>
          <div className="flex items-center gap-8 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
            <div className="flex items-center gap-3 group/nav">
              <div className="flex gap-1 group-hover:gap-2 transition-all">
                <kbd className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-white/40">
                  ↑
                </kbd>
                <kbd className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-white/40">
                  ↓
                </kbd>
              </div>
              <span className="group-hover:text-white/40 transition-colors">Navigate</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-white/40">
                ↵
              </kbd>
              <span>Initiate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
