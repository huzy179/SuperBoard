'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWorkspaces } from '@/features/system/workspace/hooks/use-workspaces';
import { useChannels } from '@/features/collaboration/chat/hooks/use-chat';
import { Hash, Lock, Plus, Settings } from 'lucide-react';
import { SectionSkeleton } from '@/components/ui/page-states';
import { CreateChannelOverlay } from '@/features/collaboration/chat/components/CreateChannelOverlay';
import { useWorkspaceMembers } from '@/features/system/workspace/hooks/use-workspace';
import { useAuthSession } from '@/features/system/auth/hooks/use-auth-session';
import { useRouter } from 'next/navigation';
import { DmPickerOverlay } from '@/features/collaboration/chat/components/DmPickerOverlay';

export default function ChatLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [createChannelType, setCreateChannelType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [createChannelPrefillName, setCreateChannelPrefillName] = useState<string | undefined>(
    undefined,
  );
  const [isDmPickerOpen, setIsDmPickerOpen] = useState(false);

  // Use first workspace as default if none specified (POC level)
  const activeWorkspace = workspaces?.[0];
  const { data: channels, isLoading: channelsLoading } = useChannels(activeWorkspace?.id);
  const { user } = useAuthSession();
  const { data: workspaceMembers } = useWorkspaceMembers(activeWorkspace?.id);

  if (workspacesLoading || channelsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <SectionSkeleton rows={10} />
      </div>
    );
  }

  const publicChannels = channels?.filter((c) => c.type === 'PUBLIC') || [];
  const privateChannels = channels?.filter((c) => c.type === 'PRIVATE') || [];

  const isDmChannel = (name: string) => name.startsWith('dm:');
  const privateNormalChannels = privateChannels.filter((c) => !isDmChannel(c.name));
  const dmChannels = privateChannels
    .filter((c) => isDmChannel(c.name))
    .filter((c) => !!c.lastMessageAt)
    .sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });

  const memberById = new Map((workspaceMembers || []).map((m) => [m.userId, m]));
  const dmDisplayName = (dmName: string) => {
    // dm:<id1>:<id2>
    const parts = dmName.split(':');
    if (parts.length !== 3) return dmName;
    if (!user?.id) return dmName;
    const otherId = parts[1] === user.id ? parts[2] : parts[2] === user.id ? parts[1] : null;
    if (!otherId) return dmName;
    return memberById.get(otherId)?.fullName || dmName;
  };

  const openCreateChannel = (type: 'PUBLIC' | 'PRIVATE', prefillName?: string) => {
    setCreateChannelType(type);
    setCreateChannelPrefillName(prefillName);
    setIsCreateChannelOpen(true);
  };

  const openDm = (otherUserId: string) => {
    router.push(`/chat/dm/${otherUserId}`);
  };

  return (
    <div className="flex h-full overflow-hidden bg-surface-card">
      {/* Secondary Sidebar: Channels */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-surface-border bg-white">
        <div className="flex h-14 items-center justify-between px-4 border-b border-surface-border">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-muted)]">
            Kênh thảo luận
          </h2>
          <button
            type="button"
            onClick={() => openCreateChannel('PUBLIC')}
            data-testid="chat-create-channel"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-surface-border text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Tạo kênh mới"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
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
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-500/[0.06] text-brand-600'
                        : 'text-[color:var(--color-muted)] hover:bg-black/[0.02] hover:text-[color:var(--color-ink)]'
                    }`}
                  >
                    <Hash
                      size={14}
                      className={isActive ? 'text-brand-500' : 'text-[color:var(--color-faint)]'}
                    />
                    <span className={`truncate ${isActive ? 'font-bold' : ''}`}>
                      {channel.name}
                    </span>
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
              {privateNormalChannels.map((channel) => {
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
              {privateNormalChannels.length === 0 && (
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
                onClick={() => setIsDmPickerOpen(true)}
                data-testid="chat-create-dm"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
                aria-label="Tạo cuộc trò chuyện"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-0.5">
              {dmChannels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/chat/${channel.id}`}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                    params.channelId === channel.id
                      ? 'bg-brand-500/[0.06] text-brand-600'
                      : 'text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
                  }`}
                >
                  <div className="h-4 w-4 rounded bg-black/[0.06] flex items-center justify-center text-[8px] text-[color:var(--color-muted)] font-bold uppercase">
                    {dmDisplayName(channel.name)?.[0] || 'U'}
                  </div>
                  <span className="truncate flex-1">{dmDisplayName(channel.name)}</span>
                </Link>
              ))}
              {dmChannels.length === 0 ? (
                <p className="px-2 text-[12px] text-[color:var(--color-muted)] italic">
                  Chưa có cuộc trò chuyện gần đây
                </p>
              ) : null}
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

      {isCreateChannelOpen ? (
        <CreateChannelOverlay
          isOpen={isCreateChannelOpen}
          onClose={() => setIsCreateChannelOpen(false)}
          workspaceId={activeWorkspace?.id}
          defaultType={createChannelType}
          {...(createChannelPrefillName ? { prefillName: createChannelPrefillName } : {})}
        />
      ) : null}

      <DmPickerOverlay
        isOpen={isDmPickerOpen}
        onClose={() => setIsDmPickerOpen(false)}
        members={(workspaceMembers || []).filter((m) => m.userId !== user?.id)}
        onPick={openDm}
      />
    </div>
  );
}
