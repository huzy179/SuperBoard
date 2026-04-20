'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  Hash,
  FileText,
  Box,
  ArrowRight,
  Sparkles,
  Loader2,
  Zap,
} from 'lucide-react';
import { useSearch } from '@/features/search/hooks/use-search';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { data: results, isLoading } = useSearch(query);
  const router = useRouter();

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = useCallback(
    (type: 'task' | 'project' | 'doc' | 'channel', id: string) => {
      setIsOpen(false);
      setQuery('');

      if (type === 'project') router.push(`/jira/projects/${id}`);
      else if (type === 'doc') router.push(`/docs/${id}`);
      else if (type === 'task') {
        // Assuming we go to project detail and open task
        // For simplicity, we navigate to the doc/project
        router.push(`/jira/projects`); // Fallback
      }
    },
    [router],
  );

  // Combine results for listing
  const items = [
    ...(results?.projects?.map((p) => ({ ...p, type: 'project' as const })) || []),
    ...(results?.docs?.map((d) => ({ ...d, type: 'doc' as const })) || []),
    ...(results?.tasks?.map((t) => ({ ...t, type: 'task' as const })) || []),
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter' && items[selectedIndex]) {
        e.preventDefault();
        const item = items[selectedIndex];
        handleNavigate(item.type, item.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, handleNavigate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-[2.5rem] shadow-luxe z-[201] overflow-hidden"
          >
            <div className="flex items-center px-8 py-6 border-b border-white/5 bg-white/[0.01]">
              <Search size={22} className="text-brand-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search Projects, Docs, or Commands..."
                className="flex-1 bg-transparent border-none outline-none px-6 text-lg text-white placeholder:text-white/10 font-black uppercase tracking-tight"
              />
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                <Command size={14} className="text-white/20" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  K
                </span>
              </div>
            </div>

            <div className="max-h-[32rem] overflow-y-auto elite-scrollbar p-3">
              {!query && (
                <div className="p-4 space-y-6">
                  <div className="px-4">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                      SƠ ĐỒ TRUY CẬP NHANH
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <QuickAction
                      icon={<Box size={18} />}
                      title="New Jira Task"
                      desc="Tạo công việc mới"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/jira/projects');
                      }}
                    />
                    <QuickAction
                      icon={<FileText size={18} />}
                      title="New Document"
                      desc="Tạo tư liệu mới"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/docs');
                      }}
                    />
                    <QuickAction
                      icon={<Hash size={18} />}
                      title="Neural Chat"
                      desc="Trao đổi nội bộ"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/chat');
                      }}
                    />
                    <QuickAction
                      icon={<Sparkles size={18} />}
                      title="AI Command"
                      desc="Thực thi lệnh AI"
                      onClick={() => {}}
                    />
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 size={32} className="text-brand-500 animate-spin" />
                  <span className="text-[10px] font-black text-brand-400 uppercase tracking-[0.5em] animate-pulse">
                    Synchronizing Nodes...
                  </span>
                </div>
              )}

              {query && items.length > 0 && (
                <div className="space-y-1 p-2">
                  {items.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.type, item.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group text-left border ${index === selectedIndex ? 'bg-brand-500/10 border-brand-500/30' : 'border-transparent hover:bg-white/[0.03]'}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                          item.type === 'project'
                            ? 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                            : item.type === 'doc'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}
                      >
                        {item.type === 'project' && <Box size={20} />}
                        {item.type === 'doc' && <FileText size={20} />}
                        {item.type === 'task' && <Zap size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-white uppercase tracking-tight truncate">
                          {'name' in item ? item.name : 'title' in item ? item.title : 'N/A'}
                        </div>
                        <div className="text-[10px] text-white/20 uppercase tracking-widest mt-1">
                          {item.type} • NODE_{item.id.substring(0, 8)}
                        </div>
                      </div>
                      <ArrowRight
                        size={16}
                        className={`text-white/10 group-hover:text-white transition-all ${index === selectedIndex ? 'translate-x-0' : '-translate-x-4 opacity-0'}`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {query && !isLoading && items.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="text-white/10 flex justify-center">
                    <Search size={48} />
                  </div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    No operational nodes found
                  </p>
                </div>
              )}
            </div>

            <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Indicator label="Move" keys={['↑', '↓']} />
                <Indicator label="Select" keys={['↵']} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em]">
                  Neural Search Active
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function QuickAction({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-[1.5rem] hover:bg-brand-500/10 hover:border-brand-500/30 transition-all group text-left"
    >
      <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 group-hover:bg-brand-500 group-hover:text-slate-950 group-hover:border-brand-500 transition-all shadow-inner">
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-black text-white uppercase tracking-wider mb-1">
          {title}
        </div>
        <div className="text-[9px] text-white/20 uppercase tracking-widest font-medium">{desc}</div>
      </div>
    </button>
  );
}

function Indicator({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{label}</span>
      <div className="flex gap-1">
        {keys.map((k) => (
          <div
            key={k}
            className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 font-black"
          >
            {k}
          </div>
        ))}
      </div>
    </div>
  );
}
