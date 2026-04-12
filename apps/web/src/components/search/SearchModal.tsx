'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/features/search/hooks/use-search';
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-sm pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-slate-100 px-4 py-3">
          <span className="text-slate-400 mr-3">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Tìm kiếm dự án, công việc (CMD+K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          )}
          <kbd className="ml-3 hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto py-2">
          {query.length < 2 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-slate-500">Nhập tối thiểu 2 ký tự để tìm kiếm</p>
            </div>
          ) : totalResults > 0 ? (
            <>
              {projects.length > 0 && (
                <div className="px-3 pb-2 pt-1">
                  <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Dự án
                  </h3>
                  <div className="mt-1 space-y-0.5">
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
                <div className="px-3 pb-2 pt-1 border-t border-slate-50 mt-1">
                  <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Công việc
                  </h3>
                  <div className="mt-1 space-y-0.5">
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
            </>
          ) : (
            !isLoading && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-slate-500">
                  Không tìm thấy kết quả nào cho &quot;{query}&quot;
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
