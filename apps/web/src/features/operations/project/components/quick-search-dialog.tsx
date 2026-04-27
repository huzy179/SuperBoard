'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Search,
  CornerDownLeft,
  X,
  Circle,
  ArrowRight,
  Eye,
  CheckCircle2,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjectTaskItemDTO } from '@superboard/shared';

interface QuickSearchDialogProps {
  tasks: ProjectTaskItemDTO[];
  projectId: string;
  onClose: () => void;
  onSelectTask: (taskId: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  todo: { label: 'TODO', icon: Circle, color: 'oklch(0.7 0.01 260)' },
  in_progress: { label: 'IN_PROGRESS', icon: ArrowRight, color: 'oklch(0.7 0.1 220)' },
  review: { label: 'REVIEW', icon: Eye, color: 'oklch(0.7 0.1 280)' },
  done: { label: 'DONE', icon: CheckCircle2, color: 'oklch(0.7 0.1 160)' },
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/90 pt-32 backdrop-blur-sm overflow-hidden"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-label="Quick Search"
      >
        {/* Search Pulse Aura */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.05, 0.03] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] bg-brand-500 rounded-full blur-[120px] pointer-events-none"
        />

        <motion.div
          initial={{ scale: 0.98, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.98, y: 10, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl rounded-lg border border-white/5 bg-surface-card shadow-glass overflow-hidden relative group"
        >
          {/* Rim Light */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

          {/* Search input hub */}
          <div className="flex items-center gap-[var(--space-4)] px-[var(--space-6)] py-[var(--space-5)] relative border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-brand-500/10 border border-brand-500/20 shadow-[0_0_20px_rgba(var(--color-brand-500),0.1)]">
              <Search size={18} className="text-brand-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tasks, IDs, or signals..."
              className="flex-1 bg-transparent text-xl font-bold text-white placeholder-white/5 outline-none tracking-tight font-display"
            />
            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-xs border border-white/5">
              <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase">
                ESC
              </span>
            </div>
          </div>

          {/* Results Stream */}
          <div className="max-h-[55vh] overflow-y-auto elite-scrollbar relative bg-black/5">
            {results.length > 0 ? (
              <ul ref={listRef} className="py-[var(--space-3)] px-[var(--space-3)] space-y-1">
                {results.map((task, index) => {
                  const statusConfig = STATUS_LABELS[task.status] ?? STATUS_LABELS['todo']!;
                  const isSelected = index === selectedIndex;
                  return (
                    <motion.li
                      key={task.id}
                      layout
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectTask(task.id)}
                        className={`group relative flex w-full items-center gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-3)] text-left transition-all duration-200 rounded-sm border overflow-hidden ${
                          isSelected
                            ? 'bg-brand-500/5 border-brand-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                            : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Selection Beam */}
                        {isSelected && (
                          <motion.div
                            layoutId="beam"
                            className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-brand-500 shadow-[0_0_8px_var(--color-brand-500)]"
                          />
                        )}

                        {/* Status Icon */}
                        <div className="relative flex-shrink-0">
                          <span
                            className={`relative inline-flex h-8 w-8 items-center justify-center rounded-xs text-[10px] transition-all duration-200 ${
                              isSelected
                                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                                : 'bg-white/5 text-white/40 border border-white/5'
                            }`}
                          >
                            <statusConfig.icon size={14} strokeWidth={isSelected ? 2.5 : 2} />
                          </span>
                        </div>

                        <div className="min-w-0 flex-1 relative z-10">
                          <div className="flex items-center justify-between mb-0.5">
                            <p
                              className={`truncate text-sm font-bold tracking-tight transition-colors ${
                                isSelected ? 'text-white' : 'text-white/60'
                              }`}
                            >
                              {task.title}
                            </p>
                            {isSelected && (
                              <motion.span
                                initial={{ opacity: 0, x: 5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-[8px] font-black text-brand-500 uppercase tracking-[0.2em]"
                              >
                                Active
                              </motion.span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-mono text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-xs transition-colors ${
                                isSelected
                                  ? 'bg-brand-500/10 text-brand-400'
                                  : 'bg-white/5 text-white/30'
                              }`}
                            >
                              #{task.number ?? '000'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-bold uppercase tracking-[0.15em] transition-colors ${
                                  isSelected ? 'text-brand-500' : 'text-white/20'
                                }`}
                              >
                                {statusConfig.label}
                              </span>
                            </div>

                            {task.assigneeId && (
                              <div className="flex items-center gap-1.5 ml-auto">
                                <div
                                  className={`h-4 w-4 rounded-full flex items-center justify-center border transition-colors ${
                                    isSelected
                                      ? 'bg-brand-500/10 border-brand-500/20'
                                      : 'bg-white/5 border-white/5'
                                  }`}
                                >
                                  <User
                                    size={10}
                                    className={isSelected ? 'text-brand-400' : 'text-white/20'}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <motion.div
                            layoutId="enter-indicator"
                            className="flex items-center gap-3 relative z-10"
                          >
                            <div className="w-7 h-7 flex items-center justify-center rounded-xs bg-brand-500 text-slate-950 shadow-[0_0_15px_rgba(var(--color-brand-500),0.3)]">
                              <CornerDownLeft size={12} strokeWidth={3} />
                            </div>
                          </motion.div>
                        )}
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-10 py-24 text-center flex flex-col items-center gap-4 relative"
              >
                <div className="h-16 w-16 bg-white/[0.02] rounded-sm flex items-center justify-center border border-white/5">
                  <X size={24} className="text-white/10" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white/20 uppercase tracking-[0.2em] text-[10px]">
                    No signals found
                  </p>
                  <p className="text-[9px] font-medium text-white/5 uppercase tracking-widest">
                    Try a different frequency
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Tactical Footer */}
          <div className="flex items-center justify-between border-t border-white/5 px-[var(--space-6)] py-[var(--space-4)] bg-white/[0.01] backdrop-blur-xl relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-1 w-1 rounded-full bg-brand-500 shadow-[0_0_8px_var(--color-brand-500)] animate-pulse" />
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
                {results.length} nodes indexed
              </span>
            </div>
            <div className="flex items-center gap-6 text-[9px] font-bold text-white/10 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded-xs border border-white/5 font-sans text-white/30">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded-xs border border-white/5 font-sans text-white/30">
                  ↵
                </kbd>
                <span>Select</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
