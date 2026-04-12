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
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/60 pt-24 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm nhanh"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white/40 shadow-glass backdrop-blur-3xl overflow-hidden animate-in zoom-in-95 duration-500 relative">
        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        {/* Search input */}
        <div className="flex items-center gap-4 px-8 py-6 relative">
          <span className="text-2xl drop-shadow-lg scale-110">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, documents, or settings..."
            className="flex-1 bg-transparent text-xl font-bold text-slate-900 placeholder-slate-400 outline-none tracking-tight"
          />
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/5 rounded-xl border border-black/5 shadow-inner">
            <kbd className="text-[10px] font-black text-slate-500 tracking-tighter">ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div className="border-t border-white/20 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {results.length > 0 ? (
            <ul ref={listRef} className="py-4 px-4 space-y-1">
              {results.map((task, index) => {
                const statusStyle = STATUS_LABELS[task.status] ?? STATUS_LABELS['todo']!;
                const isSelected = index === selectedIndex;
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => onSelectTask(task.id)}
                      className={`group relative flex w-full items-center gap-5 px-6 py-4 text-left transition-all duration-300 rounded-[1.5rem] transform ${
                        isSelected
                          ? 'bg-slate-900 shadow-2xl scale-[1.02] z-10'
                          : 'hover:bg-white/40'
                      }`}
                    >
                      {/* Status Indicator with Glow */}
                      <div className="relative flex-shrink-0">
                        {isSelected && (
                          <div
                            className={`absolute inset-0 blur-md opacity-60 scale-150 rounded-full ${statusStyle.bg}`}
                          />
                        )}
                        <span
                          className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black shadow-lg transition-transform group-hover:scale-110 ${
                            isSelected
                              ? 'bg-white text-slate-900'
                              : `${statusStyle.bg} ${statusStyle.text}`
                          }`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-black tracking-tight ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest ${
                              isSelected ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {task.number != null ? `#${task.number}` : ''}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest ${
                              isSelected ? 'text-brand-400' : 'text-brand-600'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1.5 animate-in slide-in-from-right-2 duration-300">
                          <kbd className="px-2.5 py-1 bg-white/20 text-[10px] font-black text-white rounded-lg border border-white/10 backdrop-blur-md">
                            ENTER
                          </kbd>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-8 py-20 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl opacity-50">
                👻
              </div>
              <p className="font-black text-slate-400 uppercase tracking-widest text-xs">
                No matches found
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/20 px-8 py-5 bg-white/20 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {results.length} results found
            </span>
          </div>
          <div className="flex items-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded-md border border-black/5 shadow-sm text-slate-600">
                ↑↓
              </kbd>
              <span>Navigation</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded-md border border-black/5 shadow-sm text-slate-600">
                ↵
              </kbd>
              <span>Select</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
