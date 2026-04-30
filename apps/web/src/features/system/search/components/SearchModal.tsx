'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/features/system/search/hooks/use-search';
import { getSearchAnswer } from '@/features/system/search/api/search-service';
import { ProjectItemDTO, ProjectTaskItemDTO } from '@superboard/shared';

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearch(query);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const tasks = data?.tasks ?? [];
  const projects = data?.projects ?? [];
  const totalResults = tasks.length + projects.length;

  function handleSelect(item: { type: 'task' | 'project'; id: string; projectId?: string }) {
    if (item.type === 'project') {
      router.push(`/projects/${item.id}`);
    } else if (item.projectId) {
      router.push(`/projects/${item.projectId}?task=${item.id}`);
    }
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalResults);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalResults) % totalResults);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const allResults = [
        ...projects.map((p: ProjectItemDTO) => ({ ...p, type: 'project' as const })),
        ...tasks.map((t: ProjectTaskItemDTO) => ({ ...t, type: 'task' as const })),
      ];
      const selected = allResults[selectedIndex];
      if (selected) {
        if (selected.type === 'project') {
          handleSelect({ type: 'project', id: (selected as ProjectItemDTO).id });
        } else {
          const task = selected as ProjectTaskItemDTO;
          handleSelect({
            type: 'task',
            id: task.id,
            projectId: task.projectId,
          });
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  const [answer, setAnswer] = useState<{
    answer: string;
    citations: { id: string; type: string; title: string }[];
  } | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => setSelectedIndex(0));
  }, [query]);

  const fetchAnswer = useCallback(async () => {
    setIsAnswering(true);
    try {
      setAnswer(await getSearchAnswer(query));
    } catch {
      // Silently fail for neural answers
    } finally {
      setIsAnswering(false);
    }
  }, [query]);

  useEffect(() => {
    if (query.length > 5) {
      const timer = setTimeout(() => fetchAnswer(), 1000);
      return () => clearTimeout(timer);
    } else {
      Promise.resolve().then(() => setAnswer(null));
    }
  }, [query, fetchAnswer]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-surface-card border border-surface-border shadow-luxe relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-8 py-6 relative">
          <span className="text-2xl drop-shadow-md mr-4">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-base font-medium text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-faint)] tracking-tight bg-transparent"
            placeholder="Tìm project, task…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {(isLoading || isAnswering) && (
            <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
          )}
        </div>

        <div className="max-h-[600px] overflow-y-auto py-2 scrollbar-hide">
          {/* Neural Answer Section */}
          {(isAnswering || answer) && (
            <div className="px-6 pb-6">
              <div className="p-6 rounded-xl border border-surface-border bg-[color:var(--color-surface-alt)]/35">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-md bg-brand-500 flex items-center justify-center text-white">
                    <span className="text-xs font-semibold">AI</span>
                  </div>
                  <span className="text-sm font-semibold text-[color:var(--color-ink)]">Gợi ý</span>
                </div>

                {isAnswering ? (
                  <div className="space-y-3">
                    <div className="h-3 w-3/4 bg-black/[0.06] rounded-full" />
                    <div className="h-3 w-1/2 bg-black/[0.06] rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-[14px] leading-relaxed text-slate-800 font-medium">
                      {answer?.answer}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {answer?.citations.map((citation) => (
                        <button
                          key={citation.id}
                          onClick={() =>
                            handleSelect({
                              type: citation.type as 'task' | 'project',
                              id: citation.id,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-white/60 border border-brand-500/10 text-[10px] font-bold text-brand-600 hover:bg-brand-500/10 transition-colors flex items-center gap-2"
                        >
                          <span className="opacity-60">{citation.type}</span>
                          {citation.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {query.length < 2 ? (
            <div className="px-4 py-20 text-center flex flex-col items-center gap-4">
              <div className="h-20 w-20 bg-black/[0.03] rounded-xl flex items-center justify-center text-4xl opacity-60 border border-surface-border">
                🔍
              </div>
              <p className="text-sm font-medium text-[color:var(--color-muted)]">
                Nhập từ khóa để tìm kiếm.
              </p>
            </div>
          ) : totalResults > 0 ? (
            <div className="space-y-6 px-4 pb-6">
              {projects.length > 0 && (
                <div>
                  <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">
                    Mission Nodes
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {projects.map((p: ProjectItemDTO, i: number) => (
                      <SearchResultItem
                        key={p.id}
                        title={p.name || ''}
                        subtitle={p.key || ''}
                        isSelected={selectedIndex === i}
                        onClick={() => handleSelect({ type: 'project', id: p.id })}
                        icon="📁"
                      />
                    ))}
                  </div>
                </div>
              )}
              {tasks.length > 0 && (
                <div className="border-t border-slate-50 pt-6">
                  <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">
                    Tactical Items
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {tasks.map((t: ProjectTaskItemDTO, i: number) => (
                      <SearchResultItem
                        key={t.id}
                        title={t.title || ''}
                        subtitle={`#${t.number ?? ''} · ${t.status}`}
                        isSelected={selectedIndex === projects.length + i}
                        onClick={() =>
                          handleSelect({
                            type: 'task',
                            id: t.id,
                            projectId: t.projectId,
                          })
                        }
                        icon="✓"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            !isLoading &&
            !isAnswering &&
            !answer && (
              <div className="px-4 py-20 text-center flex flex-col items-center gap-4">
                <div className="h-20 w-20 bg-slate-50 rounded-xl flex items-center justify-center text-4xl opacity-50 shadow-inner grayscale">
                  👻
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">
                  Null Reference
                </p>
              </div>
            )
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/50 px-4 py-2.5 text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>↑↓ di chuyển</span>
            <span>↵ chọn</span>
          </div>
          <span>SuperBoard Search</span>
        </div>
      </div>
    </div>
  );
}

function SearchResultItem({
  title,
  subtitle,
  isSelected,
  onClick,
  icon,
}: {
  title: string;
  subtitle: string;
  isSelected: boolean;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
        isSelected ? 'bg-brand-50 shadow-sm ring-1 ring-brand-100' : 'hover:bg-slate-50'
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-sm shadow-sm">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] font-semibold ${
            isSelected ? 'text-brand-700' : 'text-slate-900'
          }`}
        >
          {title}
        </p>
        <p className="truncate text-[11px] text-slate-500 font-medium">{subtitle}</p>
      </div>
      {isSelected && (
        <span className="text-brand-400 animate-in fade-in slide-in-from-right-1">↵</span>
      )}
    </button>
  );
}
