'use client';

import { useState } from 'react';
import { ChevronDown, Check, Plus, Settings } from 'lucide-react';
import { useWorkspaces, useWorkspace } from '@/features/workspace/hooks';
import Link from 'next/link';

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: workspaces, isLoading } = useWorkspaces();
  const currentWorkspaceId = workspaces?.[0]?.id; // Simplification for demo
  const { data: currentWorkspace } = useWorkspace(currentWorkspaceId);

  if (isLoading) return <div className="h-10 w-full bg-white/5 animate-pulse rounded-xl" />;

  return (
    <div className="relative px-3 py-4 border-b border-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white/5 bg-transparent border border-transparent hover:border-white/10"
      >
        <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg shadow-brand-600/20">
          {currentWorkspace?.name?.charAt(0) || 'S'}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[13px] font-black text-white/90 truncate leading-tight uppercase tracking-tight">
            {currentWorkspace?.name || 'SuperBoard'}
          </p>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none mt-1">
            Pro Plan
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`text-white/20 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-3 top-20 right-3 z-50 glass-panel p-1 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 rounded-xl overflow-hidden py-2">
              <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                Your Workspaces
              </p>

              {workspaces?.map((ws) => {
                const isActive = ws.id === currentWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-white/5' : 'hover:bg-white/10'}`}
                  >
                    <div className="w-8 h-8 bg-slate-800 text-white/80 rounded-lg flex items-center justify-center font-bold text-xs">
                      {ws.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white/90 truncate">{ws.name}</p>
                      <p className="text-[10px] text-white/40 truncate">
                        {ws.membersCount || 1} members
                      </p>
                    </div>
                    {isActive && <Check size={14} className="text-brand-500" />}
                  </button>
                );
              })}

              <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                <Link
                  href="/settings?tab=workspace"
                  className="flex items-center gap-3 px-4 py-3 text-white/55 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings size={14} />
                  <span>Workspace Settings</span>
                </Link>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-brand-400 hover:text-brand-300 hover:bg-brand-500/5 text-sm font-bold transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <Plus size={14} />
                  <span>Add Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
