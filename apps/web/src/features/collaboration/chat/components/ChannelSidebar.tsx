'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Hash, Lock, Plus, Radio } from 'lucide-react';
import { useChannels } from '../hooks/use-chat';
import { useWorkspaces } from '@/features/system/workspace/hooks/use-workspaces';
import { AppBrand } from '@/components/layout/app-brand';

export function ChannelSidebar() {
  const params = useParams<{ channelId: string }>();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.[0];
  const { data: channels, isLoading } = useChannels(activeWorkspace?.id);

  return (
    <aside className="flex h-full w-72 flex-col border-r border-surface-border bg-surface-card">
      <div className="p-5 border-b border-surface-border">
        <AppBrand subtitle="Chat" variant="light" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
            <Radio size={16} className="text-[color:var(--color-muted)]" />
            Kênh
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Create channel"
          >
            <Plus size={16} />
          </button>
        </div>

        <nav className="space-y-1">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-md bg-black/[0.06]" />
              ))}
            </div>
          ) : (
            channels?.map((channel) => {
              const isActive = params.channelId === channel.id;
              return (
                <Link
                  key={channel.id}
                  href={`/chat/${channel.id}`}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors border ${
                    isActive
                      ? 'bg-brand-50 border-brand-200 text-[color:var(--color-ink)]'
                      : 'bg-transparent border-transparent text-[color:var(--color-muted)] hover:bg-black/[0.02] hover:text-[color:var(--color-ink)] hover:border-surface-border'
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${
                      isActive
                        ? 'bg-white border-brand-200 text-brand-700'
                        : 'bg-surface-bg border-surface-border text-[color:var(--color-muted)]'
                    }`}
                    aria-hidden
                  >
                    {channel.type === 'PUBLIC' ? <Hash size={14} /> : <Lock size={14} />}
                  </span>
                  <span className="truncate flex-1">{channel.name}</span>
                </Link>
              );
            })
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-surface-border text-xs text-[color:var(--color-muted)]">
        Workspace: {activeWorkspace?.name || '—'}
      </div>
    </aside>
  );
}
