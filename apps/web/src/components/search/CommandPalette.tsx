'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Command,
  CheckCircle2,
  Settings,
  UserPlus,
  Plus,
  ArrowRight,
  TrendingUp,
  Layout,
} from 'lucide-react';
import { useSearch } from '@/features/search/hooks/use-search';
import { ProjectItemDTO, ProjectTaskItemDTO } from '@superboard/shared';

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

  const actions: CommandItem[] = [
    {
      id: 'action-create-task',
      type: 'action',
      title: 'Tạo công việc mới',
      subtitle: 'Tạo nhanh một thẻ công việc trong dự án hiện tại',
      icon: <Plus size={16} />,
      handler: () => {
        router.push('/jira?create=true');
        onClose();
      },
      category: 'Hành động nhanh',
    },
    {
      id: 'action-invite',
      type: 'action',
      title: 'Mời thành viên',
      subtitle: 'Mời đồng nghiệp vào Workspace của bạn',
      icon: <UserPlus size={16} />,
      handler: () => {
        router.push('/settings?tab=workspace&invite=true');
        onClose();
      },
      category: 'Hành động nhanh',
    },
    {
      id: 'action-settings',
      type: 'action',
      title: 'Cài đặt hệ thống',
      subtitle: 'Quản lý hồ sơ, thông báo và workspace',
      icon: <Settings size={16} />,
      handler: () => {
        router.push('/settings');
        onClose();
      },
      category: 'Hệ thống',
    },
  ];

  const results = useMemo(() => {
    const list: CommandItem[] = [];

    // 1. Actions matching query (basic matching)
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

    // 2. Projects
    projects.forEach((p: ProjectItemDTO) => {
      list.push({
        id: `project-${p.id}`,
        type: 'project',
        title: p.name || 'Dự án không tên',
        subtitle: `Project key: ${p.key}`,
        icon: <Layout size={16} className="text-blue-500" />,
        handler: () => {
          router.push(`/projects/${p.id}`);
          onClose();
        },
        category: 'Dự án',
      });
    });

    // 3. Tasks
    tasks.forEach((t: ProjectTaskItemDTO) => {
      list.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: `#${t.number} · ${t.status}`,
        icon: <CheckCircle2 size={16} className="text-emerald-500" />,
        handler: () => {
          router.push(`/projects/${t.projectId}?task=${t.id}`);
          onClose();
        },
        category: 'Công việc',
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

  // Grouped results for rendering
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
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-300"
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl glass-panel p-1 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300">
        <div className="bg-white rounded-[1.4rem] overflow-hidden flex flex-col max-h-[70vh]">
          {/* Search Header */}
          <div className="p-5 border-b border-slate-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
              <Search size={20} />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Gõ lệnh hoặc tìm kiếm công việc..."
              className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-900 placeholder:text-slate-300"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd className="hidden sm:flex h-8 px-2 items-center justify-center bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
              ESC
            </kbd>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {results.length > 0 ? (
              Object.entries(categories).map(([category, items]) => (
                <div key={category} className="space-y-1">
                  <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {category}
                  </h3>
                  {items.map((item) => {
                    const globalIndex = results.indexOf(item);
                    const isSelected = selectedIndex === globalIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={item.handler}
                        className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all text-left group ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-white/10'
                              : 'bg-slate-50 border border-slate-100 group-hover:bg-white'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}
                          >
                            {item.title}
                          </p>
                          <p
                            className={`text-[11px] font-medium truncate ${isSelected ? 'text-white/50' : 'text-slate-400'}`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2 pr-2 animate-in slide-in-from-right-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                              Chọn
                            </span>
                            <ArrowRight size={14} className="text-white/60" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mx-auto transition-transform hover:scale-110">
                  <Command size={32} />
                </div>
                <div>
                  <p className="font-black text-slate-900 uppercase tracking-tight">
                    Không tìm thấy kết quả
                  </p>
                  <p className="text-sm text-slate-400 font-medium">
                    Thử nhập từ khóa khác hoặc duyệt danh mục bên dưới.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 grayscale opacity-50">
                <div className="w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded shadow-xs">
                  <TrendingUp size={10} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Đề xuất</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-xs text-slate-500">
                  ↑↓
                </kbd>
                <span>Di chuyển</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-xs text-slate-500">
                  ↵
                </kbd>
                <span>Chọn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
