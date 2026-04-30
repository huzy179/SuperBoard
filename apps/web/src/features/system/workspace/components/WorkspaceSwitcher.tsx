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

  if (isLoading) return <div className="h-10 w-full bg-black/[0.06] rounded-md" />;

  return (
    <div
      className={`relative ${showLabel ? 'px-3 py-4 border-b border-surface-border' : 'flex justify-center'}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-3 rounded-md transition-colors hover:bg-black/[0.03] bg-transparent border border-transparent ${showLabel ? 'w-full p-1.5' : 'p-1'}`}
      >
        <div className="w-8 h-8 bg-brand-600 rounded-sm flex items-center justify-center text-white font-black text-xs shadow-inner shrink-0">
          {currentWorkspace?.name?.charAt(0) || 'S'}
        </div>
        {showLabel && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-[12px] font-semibold text-[color:var(--color-ink)] truncate leading-tight">
              {currentWorkspace?.name || 'SuperBoard'}
            </p>
            <p className="text-[11px] text-[color:var(--color-muted)] leading-none mt-1">
              Workspace
            </p>
          </div>
        )}
        {showLabel && (
          <ChevronDown
            size={14}
            className={`text-[color:var(--color-faint)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-1 top-14 right-1 z-50 border border-surface-border bg-surface-card p-1 rounded-lg shadow-luxe">
            <div className="rounded-md overflow-hidden py-2">
              <p className="px-4 py-2 text-xs font-medium text-[color:var(--color-muted)]">
                Workspaces
              </p>

              {workspaces?.map((ws) => {
                const isActive = ws.id === currentWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors rounded-md ${isActive ? 'bg-black/[0.03]' : 'hover:bg-black/[0.02]'}`}
                  >
                    <div className="w-7 h-7 bg-black/[0.03] text-[color:var(--color-muted)] rounded-md flex items-center justify-center font-semibold text-[11px] border border-surface-border">
                      {ws.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[color:var(--color-ink)] truncate">
                        {ws.name}
                      </p>
                      <p className="text-xs text-[color:var(--color-muted)] truncate">
                        {ws.memberCount || 1} thành viên
                      </p>
                    </div>
                    {isActive && <Check size={12} className="text-brand-500" />}
                  </button>
                );
              })}

              <div className="mt-2 pt-2 border-t border-surface-border space-y-0.5">
                <Link
                  href="/settings?tab=workspace"
                  className="flex items-center gap-3 px-4 py-2.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.02] text-sm font-medium transition-colors rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings size={12} />
                  <span>Cài đặt workspace</span>
                </Link>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-brand-700 hover:bg-brand-50 text-sm font-medium transition-colors rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  <Plus size={12} />
                  <span>Thêm workspace</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
