'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWorkspaces } from '@/hooks/workspace/use-workspaces';
import { useChannels } from '@/hooks/chat/use-chat';
import { Hash, Lock, Plus, Settings } from 'lucide-react';
import { SectionSkeleton } from '@/components/ui/page-states';

export default function ChatLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();

  // Use first workspace as default if none specified (POC level)
  const activeWorkspace = workspaces?.[0];
  const { data: channels, isLoading: channelsLoading } = useChannels(activeWorkspace?.id);

  if (workspacesLoading || channelsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <SectionSkeleton rows={10} />
      </div>
    );
  }

  const publicChannels = channels?.filter((c) => c.type === 'PUBLIC') || [];
  const privateChannels = channels?.filter((c) => c.type === 'PRIVATE') || [];

  return (
    <div className="flex h-full overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-sm">
      {/* Secondary Sidebar: Channels */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-surface-border bg-slate-50/50">
        <div className="flex h-14 items-center justify-between px-4 border-b border-surface-border bg-white/50">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Kênh thảo luận
          </h2>
          <button className="p-1 hover:bg-slate-200 rounded-md transition-colors">
            <Plus size={16} className="text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {/* Public Channels */}
          <div>
            <div className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              <span>Công khai</span>
            </div>
            <div className="space-y-0.5">
              {publicChannels.map((channel) => {
                const isActive = params.channelId === channel.id;
                return (
                  <Link
                    key={channel.id}
                    href={`/chat/${channel.id}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                    }`}
                  >
                    <Hash size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span className="truncate">{channel.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Private Channels */}
          <div>
            <div className="px-2 mb-1 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              <span>Riêng tư</span>
            </div>
            <div className="space-y-0.5">
              {privateChannels.map((channel) => {
                const isActive = params.channelId === channel.id;
                // Mock unread for demonstration
                const isUnread = channel.name.includes('S');

                return (
                  <Link
                    key={channel.id}
                    href={`/chat/${channel.id}`}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] transition-colors ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm font-bold'
                        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Lock size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span className="truncate">{channel.name}</span>
                    </div>
                    {isUnread && !isActive && <div className="h-2 w-2 rounded-full bg-brand-500" />}
                  </Link>
                );
              })}
              {privateChannels.length === 0 && (
                <p className="px-2 text-[12px] text-slate-400 italic">Không có kênh riêng tư</p>
              )}
            </div>
          </div>

          {/* DM Section */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              <span>Tin nhắn trực tiếp</span>
              <button className="hover:text-slate-900 transition-colors">
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-0.5">
              {[
                { name: 'Nguyễn Văn A', status: 'online' },
                { name: 'Trần Thị B', status: 'away' },
                { name: 'Lê Văn C', status: 'offline' },
              ].map((user, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 transition-colors cursor-pointer group"
                >
                  <div className="relative">
                    <div className="h-4 w-4 rounded bg-slate-200 flex items-center justify-center text-[8px] text-slate-500 font-bold uppercase">
                      {user.name[0]}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white ${
                        user.status === 'online'
                          ? 'bg-emerald-500'
                          : user.status === 'away'
                            ? 'bg-amber-500'
                            : 'bg-slate-300'
                      }`}
                    />
                  </div>
                  <span className="truncate flex-1">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-surface-border bg-white/30">
          <div className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-slate-500">
            <Settings size={14} />
            <span>Cài đặt Chat</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">{children}</main>
    </div>
  );
}
