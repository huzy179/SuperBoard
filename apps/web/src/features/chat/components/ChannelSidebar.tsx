'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Hash, Lock, Plus } from 'lucide-react';
import { useChannels } from '../hooks/use-chat';
import { useWorkspaces } from '@/features/workspace/hooks/use-workspaces';
import { AppBrand } from '@/components/layout/app-brand';

export function ChannelSidebar() {
  const params = useParams<{ channelId: string }>();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.[0]; // Default to first for now
  const { data: channels, isLoading } = useChannels(activeWorkspace?.id);

  return (
    <aside className="flex flex-col h-full w-64 bg-sidebar-bg text-white/70">
      <div className="p-4 border-b border-white/10 shrink-0">
        <AppBrand subtitle="Chat" variant="dark" />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4">
        <div className="flex items-center justify-between px-2 mb-2 group">
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/30 group-hover:text-white/50 transition-colors">
            Kênh thảo luận
          </span>
          <button className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white transition-colors">
            <Plus size={14} />
          </button>
        </div>

        <nav className="space-y-0.5">
          {isLoading ? (
            <div className="px-3 py-2 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-3 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            channels?.map((channel) => {
              const isActive = params.channelId === channel.id;
              return (
                <Link
                  key={channel.id}
                  href={`/chat/${channel.id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span
                    className={`${isActive ? 'text-white' : 'text-white/30 group-hover:text-white/50'}`}
                  >
                    {channel.type === 'PUBLIC' ? <Hash size={16} /> : <Lock size={16} />}
                  </span>
                  <span className="truncate">{channel.name}</span>
                </Link>
              );
            })
          )}
        </nav>

        <div className="mt-8 flex items-center justify-between px-2 mb-2 group">
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/30 group-hover:text-white/50 transition-colors">
            Tin nhắn trực tiếp
          </span>
          <button className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <p className="px-3 py-2 text-[11px] text-white/20 italic">Sắp ra mắt...</p>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
            {activeWorkspace?.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{activeWorkspace?.name}</p>
            <p className="text-[10px] text-white/40 truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
