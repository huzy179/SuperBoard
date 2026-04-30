'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  CornerDownLeft,
  Eye,
  Search,
  User,
  X,
  Clock,
} from 'lucide-react';
import type { ProjectTaskItemDTO } from '@superboard/shared';

interface QuickSearchDialogProps {
  tasks: ProjectTaskItemDTO[];
  projectId: string;
  onClose: () => void;
  onSelectTask: (taskId: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; icon: React.ElementType; tone: string }> = {
  todo: {
    label: 'Todo',
    icon: Circle,
    tone: 'border-surface-border bg-black/[0.02] text-[color:var(--color-muted)]',
  },
  in_progress: {
    label: 'In progress',
    icon: ArrowRight,
    tone: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  review: { label: 'Review', icon: Eye, tone: 'border-violet-200 bg-violet-50 text-violet-800' },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
};

const STATUS_CONFIG = STATUS_LABELS;

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
    Promise.resolve().then(() => setSelectedIndex(0));
  }, [normalizedQuery]);
  useEffect(() => inputRef.current?.focus(), []);

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
        if (results[selectedIndex]) onSelectTask(results[selectedIndex]!.id);
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Quick Search"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-black/20" aria-hidden />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-luxe">
        <div className="flex items-center gap-3 border-b border-surface-border px-6 py-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)]">
            <Search size={18} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm task theo tiêu đề, mã #…"
            className="flex-1 bg-transparent border-none outline-none text-base font-medium text-[color:var(--color-ink)] placeholder:text-[color:var(--color-faint)]"
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <ul ref={listRef} className="py-2">
              {results.map((task, idx) => {
                const isSelected = idx === selectedIndex;
                const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
                const StatusIcon = statusConfig?.icon || Clock;

                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => onSelectTask(task.id)}
                      className={`w-full px-6 py-3 text-left transition-colors ${
                        isSelected ? 'bg-black/[0.03]' : 'hover:bg-black/[0.02]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                              {task.title}
                            </span>
                            <span className="rounded-full border border-surface-border bg-black/[0.02] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-muted)]">
                              #{task.number ?? '—'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusConfig?.tone || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                            >
                              <StatusIcon size={10} />
                              {statusConfig?.label || task.status}
                            </span>
                            {task.assigneeId ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-black/[0.02] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-muted)]">
                                <User size={12} />
                                Assigned
                              </span>
                            ) : null}
                          </div>
                          {task.description ? (
                            <div className="line-clamp-1 text-sm text-[color:var(--color-muted)]">
                              {task.description}
                            </div>
                          ) : null}
                        </div>

                        {isSelected ? (
                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-white shrink-0">
                            <CornerDownLeft size={14} />
                          </div>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)]">
                <X size={18} />
              </div>
              <div className="mt-4 text-sm font-semibold text-[color:var(--color-ink)]">
                Không có kết quả
              </div>
              <div className="mt-1 text-sm text-[color:var(--color-muted)]">Thử từ khóa khác.</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-surface-border px-6 py-3 text-xs text-[color:var(--color-muted)]">
          <span>{results.length} kết quả</span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <kbd className="rounded-md border border-surface-border bg-surface-bg px-2 py-0.5 text-[11px]">
                ↑↓
              </kbd>
              di chuyển
            </span>
            <span className="inline-flex items-center gap-2">
              <kbd className="rounded-md border border-surface-border bg-surface-bg px-2 py-0.5 text-[11px]">
                ↵
              </kbd>
              chọn
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
