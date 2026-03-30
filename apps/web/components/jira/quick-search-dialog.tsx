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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm nhanh"
    >
      <div className="w-full max-w-lg rounded-xl border border-surface-border bg-surface-card shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
          <span className="text-slate-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm task trong dự án..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
          />
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul ref={listRef} className="max-h-80 overflow-y-auto py-2">
            {results.map((task, index) => {
              const statusStyle = STATUS_LABELS[task.status] ?? STATUS_LABELS['todo']!;
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onSelectTask(task.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                      index === selectedIndex ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 min-w-6 items-center justify-center rounded px-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {statusStyle.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-400">
                        {task.number != null ? `#${task.number} · ` : ''}
                        {task.type} · {task.priority}
                      </p>
                    </div>
                    {index === selectedIndex && (
                      <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                        ↵
                      </kbd>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Không tìm thấy task nào phù hợp
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-border px-4 py-2 text-xs text-slate-400">
          <span>{results.length} kết quả</span>
          <div className="flex items-center gap-3">
            <span>↑↓ di chuyển</span>
            <span>↵ mở task</span>
            <span>ESC đóng</span>
          </div>
        </div>
      </div>
    </div>
  );
}
