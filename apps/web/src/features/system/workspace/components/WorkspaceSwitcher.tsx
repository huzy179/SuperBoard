'use client';

import { useState } from 'react';
import { ChevronDown, Check, Plus, Settings } from 'lucide-react';
import { useWorkspaces, useWorkspace } from '@/features/system/workspace/hooks';
import Link from 'next/link';

export function WorkspaceSwitcher({ showLabel = true }: { showLabel?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: workspaces, isLoading } = useWorkspaces();
  const currentWorkspaceId = workspaces?.[0]?.id; // Simplification for demo
  const { data: currentWorkspace } = useWorkspace(currentWorkspaceId);

  if (isLoading) return <div className="h-10 w-full bg-white/5 animate-pulse rounded-sm" />;

  return (
    <div
      className={`relative ${showLabel ? 'px-3 py-4 border-b border-white/5' : 'flex justify-center'}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-3 rounded-sm transition-all hover:bg-white/5 bg-transparent border border-transparent hover:border-white/10 ${showLabel ? 'w-full p-1.5' : 'p-1'}`}
      >
        <div className="w-8 h-8 bg-brand-600 rounded-sm flex items-center justify-center text-white font-black text-xs shadow-inner shrink-0">
          {currentWorkspace?.name?.charAt(0) || 'S'}
        </div>
        {showLabel && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-[12px] font-black text-white/90 truncate leading-tight uppercase tracking-tight">
              {currentWorkspace?.name || 'SuperBoard'}
            </p>
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mt-1">
              PRO_PROTOCOL
            </p>
          </div>
        )}
        {showLabel && (
          <ChevronDown
            size={14}
            className={`text-white/20 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-1 top-14 right-1 z-50 bg-slate-950 border border-white/10 p-1 rounded-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 backdrop-blur-3xl">
            <div className="bg-slate-950 rounded-sm overflow-hidden py-2">
              <p className="px-4 py-2 text-[8px] font-bold uppercase tracking-widest text-white/20">
                ACTIVE_WORKSPACES
              </p>

              {workspaces?.map((ws) => {
                const isActive = ws.id === currentWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${isActive ? 'bg-white/5 shadow-inner' : 'hover:bg-white/[0.03]'}`}
                  >
                    <div className="w-7 h-7 bg-white/5 text-white/20 rounded-sm flex items-center justify-center font-black text-[10px] border border-white/5">
                      {ws.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white uppercase tracking-tight truncate">
                        {ws.name}
                      </p>
                      <p className="text-[8px] text-white/20 uppercase tracking-widest truncate font-bold">
                        {ws.memberCount || 1}_OPERATIVES
                      </p>
                    </div>
                    {isActive && <Check size={12} className="text-brand-500" />}
                  </button>
                );
              })}

              <div className="mt-2 pt-2 border-t border-white/5 space-y-0.5">
                <Link
                  href="/settings?tab=workspace"
                  className="flex items-center gap-3 px-4 py-2.5 text-white/20 hover:text-white hover:bg-white/[0.03] text-[10px] font-bold uppercase tracking-widest transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings size={12} />
                  <span>WORKSPACE_SETTINGS</span>
                </Link>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-brand-400 hover:text-brand-300 hover:bg-brand-500/5 text-[10px] font-black uppercase tracking-widest transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <Plus size={12} />
                  <span>ADD_WORKSPACE</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
