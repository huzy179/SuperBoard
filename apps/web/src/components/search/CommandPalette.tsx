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
import { useSearch } from '@/features/search/hooks/use-search';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const tasks = data?.tasks ?? [];
  const projects = data?.projects ?? [];
  const docs = data?.docs ?? [];

  const actions: CommandItem[] = [
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
  ];

  const results = useMemo(() => {
    const list: CommandItem[] = [];

    if (!query) {
      list.push(...actions);
    } else {
      const matchedActions = actions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.subtitle?.toLowerCase().includes(query.toLowerCase()),
      );
      list.push(...matchedActions);
    }

    projects.forEach((p: ProjectItemDTO) => {
      list.push({
        id: `project-${p.id}`,
        type: 'project',
        title: p.name || 'UNNAMED_NODE',
        subtitle: `PRIMARY_KEY: ${p.key}`,
        icon: <LayoutGrid size={16} className="text-brand-400" />,
        handler: () => {
          router.push(`/projects/${p.id}`);
          onClose();
        },
        category: 'Mission Nodes',
      });
    });

    tasks.forEach((t: ProjectTaskItemDTO) => {
      list.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: `VECTOR #${t.number} · STATUS: ${t.status.toUpperCase()}`,
        icon: <CheckCircle2 size={16} className="text-cyan-400" />,
        handler: () => {
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
          router.push(`/docs/${d.id}`);
          onClose();
        },
        category: 'Information Matrix',
      });
    });

    return list;
  }, [query, tasks, projects]);

  useEffect(() => {
    setSelectedIndex(0);
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
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [results]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4 animate-in fade-in duration-500 font-sans"
      onKeyDown={handleKeyDown}
    >
      {/* Neural Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={onClose} />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/60 shadow-glass animate-in zoom-in-95 duration-500">
        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

        <div className="flex flex-col max-h-[75vh]">
          {/* Neural Search Header */}
          <div className="p-8 border-b border-white/5 flex items-center gap-6 relative group">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-700 ${
                query
                  ? 'bg-brand-500/20 border-brand-500/40 text-brand-400 shadow-glow-brand'
                  : 'bg-white/5 border-white/5 text-white/20'
              }`}
            >
              {query ? <Zap size={24} className="animate-pulse" /> : <Terminal size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                  Core Intelligence
                </span>
                {query && (
                  <div className="h-1 w-1 rounded-full bg-brand-500 shadow-glow-brand animate-ping" />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="TRANSMIT_COMMAND_OR_QUERY_VECTORS..."
                className="w-full bg-transparent border-none outline-none text-xl font-black text-white placeholder:text-white/5 uppercase tracking-tighter"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <kbd className="hidden sm:flex h-10 px-3 items-center justify-center bg-slate-950 text-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 group-hover:text-brand-400 transition-colors">
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
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
                    <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
                      {category}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const globalIndex = results.indexOf(item);
                      const isSelected = selectedIndex === globalIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={item.handler}
                          className={`w-full flex items-center gap-6 px-4 py-4 rounded-[1.5rem] transition-all duration-500 text-left relative group ${
                            isSelected
                              ? 'bg-white/[0.05] text-white'
                              : 'hover:bg-white/[0.02] text-white/40'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute inset-y-2 left-0 w-1 bg-brand-500 rounded-full shadow-glow-brand animate-pulse" />
                          )}
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                              isSelected
                                ? 'bg-brand-500/20 border-brand-500/30 text-brand-400 shadow-glow-brand'
                                : 'bg-white/5 border-white/5 group-hover:bg-white/10'
                            }`}
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-black text-xs uppercase tracking-widest transition-colors ${isSelected ? 'text-white' : 'group-hover:text-white/70'}`}
                            >
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p
                                className={`text-[10px] font-bold uppercase tracking-tight truncate mt-1 ${isSelected ? 'text-white/40' : 'text-white/10 italic'}`}
                              >
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-3 pr-2 animate-in slide-in-from-right-4 duration-500">
                              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                                Execute
                              </span>
                              <div className="p-2 bg-brand-500 rounded-lg text-slate-950 shadow-glow-brand">
                                <ArrowRight size={14} />
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
                <div className="w-20 h-20 bg-slate-950 text-white/5 rounded-[2rem] flex items-center justify-center mx-auto border border-white/5 shadow-inner transition-transform hover:scale-110 duration-700">
                  <Cpu size={40} />
                </div>
                <div className="space-y-2 px-12">
                  <p className="font-black text-white/40 uppercase tracking-[0.3em]">
                    Vector Not Resolved
                  </p>
                  <p className="text-[10px] font-medium text-white/10 uppercase tracking-widest leading-relaxed">
                    No matching protocols found in the current subspace. Try transmitting an
                    alternative command sequence.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Control Footer */}
          <div className="p-6 border-t border-white/5 bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-brand-400 shadow-glow-brand">
                  <ShieldCheck size={14} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                  Secure Node
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-900 border border-white/10 rounded-lg text-white/40 group-hover:text-brand-400 transition-colors">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-900 border border-white/10 rounded-lg text-white/40">
                  ↵
                </kbd>
                <span>Initialize</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
