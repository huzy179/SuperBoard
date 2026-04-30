'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Settings,
  UserPlus,
  Plus,
  ArrowRight,
  LayoutGrid,
  Zap,
  Cpu,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useSearch } from '@/features/system/search/hooks/use-search';
import { useSearchStatus } from '@/features/system/search/hooks/use-search-status';
import { ProjectItemDTO, ProjectTaskItemDTO, DocItemDTO } from '@superboard/shared';
import { FileText } from 'lucide-react';

interface CommandPaletteProps {
  onClose: () => void;
}

type CommandItem = {
  id: string;
  type: 'action' | 'task' | 'project' | 'doc';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  handler: () => void;
  category: string;
};

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data } = useSearch(query);
  const { data: syncStatus } = useSearchStatus();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Load recent searches from localStorage
    const saved = localStorage.getItem('superboard_recent_searches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Promise.resolve().then(() => setRecentSearches(parsed));
      } catch (err) {
        console.error('Failed to parse recent searches', err);
      }
    }
  }, []);

  const saveToRecent = useCallback(
    (item: CommandItem) => {
      const updated = [item, ...recentSearches.filter((r) => r.id !== item.id)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('superboard_recent_searches', JSON.stringify(updated));
    },
    [recentSearches],
  );

  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks]);
  const projects = useMemo(() => data?.projects ?? [], [data?.projects]);
  const docs = useMemo(() => data?.docs ?? [], [data?.docs]);

  const actions: CommandItem[] = useMemo(
    () => [
      {
        id: 'action-create-task',
        type: 'action',
        title: 'Initialize New Mission',
        subtitle: 'Spawn a new task vector in the active workspace',
        icon: <Plus size={16} />,
        handler: () => {
          router.push('/jira?create=true');
          onClose();
        },
        category: 'System Protocols',
      },
      {
        id: 'action-invite',
        type: 'action',
        title: 'Authorize Operator',
        subtitle: 'Provision new access credentials for a team member',
        icon: <UserPlus size={16} />,
        handler: () => {
          router.push('/settings?tab=workspace&invite=true');
          onClose();
        },
        category: 'System Protocols',
      },
      {
        id: 'action-settings',
        type: 'action',
        title: 'Secure Control Center',
        subtitle: 'Access core platform configurations and security',
        icon: <Settings size={16} />,
        handler: () => {
          router.push('/settings');
          onClose();
        },
        category: 'Core Infrastructure',
      },
    ],
    [router, onClose],
  );

  const results = useMemo(() => {
    const list: CommandItem[] = [];

    if (!query) {
      if (recentSearches.length > 0) {
        list.push(
          ...recentSearches.map((r) => ({
            ...r,
            category: 'Recent Activity',
            // Re-wrap handler to satisfy saveToRecent
            handler: () => {
              r.handler();
              saveToRecent(r);
            },
          })),
        );
      }
      list.push(...actions);
    } else {
      const matchedActions = actions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.subtitle?.toLowerCase().includes(query.toLowerCase()),
      );
      list.push(...matchedActions);
    }

    const lowerQuery = query.toLowerCase();
    const filterAssigneeMe = lowerQuery.includes('assignee:me') || lowerQuery.includes('@me');

    projects.forEach((p: ProjectItemDTO) => {
      list.push({
        id: `project-${p.id}`,
        type: 'project',
        title: p.name || 'UNNAMED_NODE',
        subtitle: `PRIMARY_KEY: ${p.key}`,
        icon: <LayoutGrid size={16} className="text-brand-400" />,
        handler: () => {
          saveToRecent({
            id: `project-${p.id}`,
            type: 'project',
            title: p.name || 'UNNAMED_NODE',
            icon: <LayoutGrid size={16} />,
            handler: () => {}, // Placeholder for serialization
            category: 'Mission Nodes',
          });
          router.push(`/projects/${p.id}`);
          onClose();
        },
        category: 'Mission Nodes',
      });
    });

    tasks
      .filter((t) => (filterAssigneeMe ? t.assigneeName === 'Tôi' || t.assigneeId === 'me' : true)) // Simplified for demo
      .forEach((t: ProjectTaskItemDTO) => {
        list.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          subtitle: `VECTOR #${t.number} · STATUS: ${t.status.toUpperCase()}`,
          icon: (
            <div className="relative">
              <CheckCircle2 size={16} className="text-cyan-400" />
              {t.recentCollaborators && t.recentCollaborators.length > 0 && (
                <div className="absolute -top-1 -right-1 flex -space-x-1">
                  {t.recentCollaborators.slice(0, 2).map((c, i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-surface-border bg-brand-500"
                      title={`Collaborator: ${c}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ),
          handler: () => {
            saveToRecent({
              id: `task-${t.id}`,
              type: 'task',
              title: t.title,
              icon: <CheckCircle2 size={16} />,
              handler: () => {},
              category: 'Mission Vectors',
            });
            router.push(`/projects/${t.projectId}?task=${t.id}`);
            onClose();
          },
          category: 'Mission Vectors',
        });
      });

    docs.forEach((d: DocItemDTO) => {
      list.push({
        id: `doc-${d.id}`,
        type: 'doc',
        title: d.title,
        subtitle: `DOCUMENT_NODE · EDITED: ${new Date(d.updatedAt).toLocaleDateString()}`,
        icon: <FileText size={16} className="text-emerald-400" />,
        handler: () => {
          saveToRecent({
            id: `doc-${d.id}`,
            type: 'doc',
            title: d.title,
            icon: <FileText size={16} />,
            handler: () => {},
            category: 'Information Matrix',
          });
          router.push(`/docs/${d.id}`);
          onClose();
        },
        category: 'Information Matrix',
      });
    });

    return list;
  }, [query, tasks, projects, actions, docs, onClose, recentSearches, router, saveToRecent]);

  useEffect(() => {
    Promise.resolve().then(() => setSelectedIndex(0));
  }, [query, results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[selectedIndex]?.handler();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const categories = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    results.forEach((item) => {
      const category = item.category || 'Miscellaneous';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    return groups;
  }, [results]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4 font-sans"
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-luxe">
        <div className="flex flex-col max-h-[75vh]">
          <div className="px-6 py-4 border-b border-surface-border flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-md flex items-center justify-center border ${
                query
                  ? 'bg-brand-50 border-brand-200 text-brand-700'
                  : 'bg-surface-bg border-surface-border text-[color:var(--color-muted)]'
              }`}
            >
              {query ? <Zap size={18} /> : <Terminal size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                placeholder="Tìm nhanh hoặc gõ lệnh…"
                className="w-full bg-transparent border-none outline-none text-base font-medium text-[color:var(--color-ink)] placeholder:text-[color:var(--color-faint)]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <kbd className="hidden sm:flex h-8 px-2 items-center justify-center bg-surface-bg text-[color:var(--color-muted)] rounded-md text-[11px] font-medium border border-surface-border">
                ESC
              </kbd>
            </div>
          </div>

          {/* Neural Sync Results */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
            {results.length > 0 ? (
              Object.entries(categories).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-3 px-4">
                    <div className="h-px flex-1 bg-surface-border" />
                    <h3 className="text-xs font-semibold text-[color:var(--color-muted)]">
                      {category}
                    </h3>
                    <div className="h-px flex-1 bg-surface-border" />
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const globalIndex = results.indexOf(item);
                      const isSelected = selectedIndex === globalIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={item.handler}
                          className={`group relative w-full flex items-center gap-4 px-4 py-3 rounded-md transition-colors text-left ${
                            isSelected
                              ? 'bg-black/[0.04] text-[color:var(--color-ink)]'
                              : 'hover:bg-black/[0.02] text-[color:var(--color-ink)]'
                          }`}
                        >
                          {isSelected && (
                            <div
                              className="absolute inset-y-2 left-0 w-1 bg-brand-500 rounded-full"
                              aria-hidden
                            />
                          )}
                          <div
                            className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors border ${
                              isSelected
                                ? 'bg-brand-50 border-brand-200 text-brand-700'
                                : 'bg-black/[0.02] border-surface-border text-[color:var(--color-muted)] group-hover:bg-black/[0.04]'
                            }`}
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`truncate text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'text-[color:var(--color-ink)]'
                                  : 'text-[color:var(--color-ink)] group-hover:text-[color:var(--color-ink)]'
                              }`}
                            >
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p
                                className={`truncate mt-1 text-xs ${
                                  isSelected
                                    ? 'text-[color:var(--color-muted)]'
                                    : 'text-[color:var(--color-faint)]'
                                }`}
                              >
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-3 pr-2">
                              <span className="text-xs font-medium text-[color:var(--color-muted)]">
                                Enter
                              </span>
                              <div className="p-1.5 bg-brand-500 rounded-md text-white">
                                <ArrowRight size={12} />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center space-y-6">
                <div className="w-16 h-16 bg-black/[0.02] text-[color:var(--color-faint)] rounded-md flex items-center justify-center mx-auto border border-surface-border shadow-glass">
                  <Cpu size={32} />
                </div>
                <div className="space-y-2 px-12">
                  <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                    Không có kết quả
                  </p>
                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
                    Thử từ khóa khác hoặc gõ lệnh ngắn hơn.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Control Footer */}
          <div className="p-6 border-t border-surface-border bg-surface-bg flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-black/[0.02] border border-surface-border rounded-md text-brand-600 relative">
                  <ShieldCheck size={14} />
                  {!syncStatus?.isFullySynced && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-surface-bg" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[color:var(--color-ink)]">
                    Search index
                  </span>
                  {!syncStatus?.isFullySynced && (
                    <span className="text-xs text-[color:var(--color-muted)]">Đang đồng bộ…</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-[color:var(--color-muted)]">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-black/[0.02] border border-surface-border rounded-md text-[color:var(--color-muted)]">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-black/[0.02] border border-surface-border rounded-md text-[color:var(--color-muted)]">
                  ↵
                </kbd>
                <span>Open</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
