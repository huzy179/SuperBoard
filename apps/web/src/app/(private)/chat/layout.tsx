'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWorkspaces } from '@/features/system/workspace/hooks/use-workspaces';
import { useChannels } from '@/features/collaboration/chat/hooks/use-chat';
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
      <aside className="flex w-64 shrink-0 flex-col border-r border-surface-border bg-black/[0.02]">
        <div className="flex h-14 items-center justify-between px-4 border-b border-surface-border bg-surface-card">
          <h2 className="text-sm font-semibold text-[color:var(--color-ink)]">Kênh thảo luận</h2>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Tạo kênh mới"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {/* Public Channels */}
          <div>
            <div className="px-2 mb-1 flex items-center justify-between text-xs font-medium text-[color:var(--color-muted)] leading-none">
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
                        : 'text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
                    }`}
                  >
                    <Hash
                      size={14}
                      className={isActive ? 'text-white' : 'text-[color:var(--color-faint)]'}
                    />
                    <span className="truncate">{channel.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Private Channels */}
          <div>
            <div className="px-2 mb-1 flex items-center justify-between text-xs font-medium text-[color:var(--color-muted)] leading-none">
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
                        : 'text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Lock
                        size={14}
                        className={isActive ? 'text-white' : 'text-[color:var(--color-faint)]'}
                      />
                      <span className="truncate">{channel.name}</span>
                    </div>
                    {isUnread && !isActive && <div className="h-2 w-2 rounded-full bg-brand-500" />}
                  </Link>
                );
              })}
              {privateChannels.length === 0 && (
                <p className="px-2 text-[12px] text-[color:var(--color-muted)] italic">
                  Không có kênh riêng tư
                </p>
              )}
            </div>
          </div>

          {/* DM Section */}
          <div>
            <div className="px-2 mb-2 flex items-center justify-between text-xs font-medium text-[color:var(--color-muted)] leading-none">
              <span>Tin nhắn trực tiếp</span>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
                aria-label="Tạo cuộc trò chuyện"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-0.5">
              {[
                { name: 'Nguyễn Văn A', status: 'online' },
                { name: 'Trần Thị B', status: 'away' },
                { name: 'Lê Văn C', status: 'offline' },
              ].map((user, i) => (
                <button
                  type="button"
                  key={i}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]/35"
                >
                  <div className="relative">
                    <div className="h-4 w-4 rounded bg-black/[0.06] flex items-center justify-center text-[8px] text-[color:var(--color-muted)] font-bold uppercase">
                      {user.name[0]}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-surface-card ${
                        user.status === 'online'
                          ? 'bg-emerald-500'
                          : user.status === 'away'
                            ? 'bg-amber-500'
                            : 'bg-black/[0.18]'
                      }`}
                    />
                  </div>
                  <span className="truncate flex-1">{user.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-surface-border bg-surface-card">
          <div className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-[color:var(--color-muted)]">
            <Settings size={14} />
            <span>Cài đặt Chat</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface-bg">{children}</main>
    </div>
  );
}
