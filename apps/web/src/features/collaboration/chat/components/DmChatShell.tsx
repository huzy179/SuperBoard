'use client';

import { useState } from 'react';
import { Hash, MoreVertical, Phone, Search, Users } from 'lucide-react';
import { useFindDm, useGetOrCreateDm } from '@/features/collaboration/chat/hooks/use-chat';
import { ChatSearchOverlay } from './ChatSearchOverlay';
import { ChatMembersOverlay } from './ChatMembersOverlay';
import { ChatMoreOverlay } from './ChatMoreOverlay';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/features/collaboration/chat/api/chat-service';
import { ChatContainer } from './ChatContainer';

export function DmChatShell({
  workspaceId,
  otherUserId,
  otherUserName,
}: {
  workspaceId: string;
  otherUserId: string;
  otherUserName: string;
}) {
  const router = useRouter();
  const { data: existingChannel, isLoading } = useFindDm(workspaceId, otherUserId);
  const createDmMutation = useGetOrCreateDm(workspaceId);

  const [showSearch, setShowSearch] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const channelId = existingChannel?.id;

  const handleFirstSend = (content: string) => {
    if (createDmMutation.isPending) return;

    createDmMutation.mutate(otherUserId, {
      onSuccess: (channel) => {
        void sendMessage(channel.id, content)
          .catch(() => {})
          .finally(() => {
            router.push(`/chat/${channel.id}`);
          });
      },
    });
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-bg">
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-surface-border bg-white/80 backdrop-blur-md">
          <ChatContainer className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-surface-border bg-surface-bg text-[color:var(--color-muted)]">
                <Hash size={14} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold tracking-tight text-[color:var(--color-ink)]">
                  {otherUserName}
                </div>
                <div className="truncate text-xs font-medium text-[color:var(--color-muted)] opacity-80">
                  Tin nhắn trực tiếp
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <IconBtn onClick={() => {}} label="Call" disabled>
                <Phone size={14} />
              </IconBtn>
              <IconBtn onClick={() => setShowSearch(true)} label="Search" disabled={!channelId}>
                <Search size={14} />
              </IconBtn>
              <IconBtn onClick={() => setShowMembers(true)} label="Members">
                <Users size={14} />
              </IconBtn>
              <IconBtn onClick={() => setShowMore(true)} label="More" disabled={!channelId}>
                <MoreVertical size={14} />
              </IconBtn>
            </div>
          </ChatContainer>
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatContainer className="flex min-h-0 flex-1 flex-col">
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-[color:var(--color-muted)]">
                  Đang tải…
                </div>
              ) : channelId ? (
                <MessageList channelId={channelId} />
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <div className="max-w-md rounded-sm border border-surface-border bg-white p-5 text-center">
                    <div className="text-sm font-semibold text-[color:var(--color-ink)]">
                      Bắt đầu cuộc trò chuyện với {otherUserName}
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--color-muted)]">
                      Cuộc trò chuyện sẽ được tạo và lưu khi bạn gửi tin nhắn đầu tiên.
                    </div>
                  </div>
                </div>
              )}
            </ChatContainer>

            <div className="bg-surface-bg">
              <ChatContainer className="pb-4 pt-3">
                <MessageInput
                  channelId={channelId || '__dm_draft__'}
                  {...(!channelId ? { onSendDraft: handleFirstSend } : {})}
                />
              </ChatContainer>
            </div>
          </div>
        </div>

        {channelId ? (
          <ChatSearchOverlay
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            channelId={channelId}
          />
        ) : null}
        <ChatMembersOverlay
          isOpen={showMembers}
          onClose={() => setShowMembers(false)}
          workspaceId={workspaceId}
          {...(channelId ? { channelId } : {})}
        />
        {channelId && showMore ? (
          <ChatMoreOverlay
            isOpen={showMore}
            onClose={() => setShowMore(false)}
            channelId={channelId}
            workspaceId={workspaceId}
            channelName={existingChannel?.name || 'dm:'}
          />
        ) : null}
      </main>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-40 disabled:hover:bg-surface-bg disabled:hover:text-[color:var(--color-muted)]"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
