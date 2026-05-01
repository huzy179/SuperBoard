'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useMessages } from '../hooks/use-chat';
import { AssigneeAvatar } from '@/features/operations/task/components/task-badges';
import { CheckSquare, Loader2, Reply, Smile } from 'lucide-react';
import type { Message } from '@superboard/shared';
import { MessageToTaskDialog } from './MessageToTaskDialog';
import { EmojiReactionPicker } from './EmojiReactionPicker';
import { useAuthSession } from '@/features/system/auth/hooks';

interface MessageListProps {
  channelId: string;
  onOpenThread?: (message: Message) => void;
}

export function MessageList({ channelId, onOpenThread }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [taskConversionMessage, setTaskConversionMessage] = useState<Message | null>(null);
  const [reactionMenuMessageId, setReactionMenuMessageId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string[]>>({});

  const handleAddReaction = (messageId: string, emoji: string) => {
    setReactions((prev) => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), emoji],
    }));
  };

  const { messages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMessages(channelId);
  const { user: currentUser } = useAuthSession();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted)]">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Đang tải tin nhắn…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-transparent">
      {hasNextPage ? (
        <div className="flex justify-center py-3">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="btn btn-secondary"
          >
            {isFetchingNextPage ? 'Đang tải…' : 'Xem tin nhắn cũ'}
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message, index) => {
          const isLastFromUser = index > 0 && messages[index - 1]?.authorId === message.authorId;
          const showHeader = !isLastFromUser;
          const isMe = message.authorId === currentUser?.id;
          const messageReactions = reactions[message.id] || [];

          return (
            <div
              key={message.id}
              className={`group relative flex gap-4 px-8 py-1.5 transition-colors hover:bg-black/[0.02] ${showHeader ? 'mt-3' : 'mt-0'}`}
            >
              {!isMe && (
                <div className="shrink-0 pt-1">
                  {showHeader ? (
                    <AssigneeAvatar
                      name={message.author?.fullName || 'Member'}
                      src={message.author?.avatarUrl}
                      size="sm"
                    />
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              )}

              <div className={`min-w-0 flex-1 ${isMe ? 'text-right' : ''}`}>
                {showHeader ? (
                  <div className={`mb-0.5 flex items-baseline gap-2 ${isMe ? 'justify-end' : ''}`}>
                    <span className="text-[13px] font-bold tracking-tight text-[color:var(--color-ink)]">
                      {message.author?.fullName || 'Member'}
                    </span>
                    <span className="text-[10px] font-medium text-[color:var(--color-faint)] uppercase tracking-wider">
                      {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                    </span>
                  </div>
                ) : null}

                <div
                  className={`relative text-[14px] leading-relaxed text-[color:var(--color-ink)]`}
                >
                  <span className="whitespace-pre-wrap">{message.content}</span>
                </div>

                {messageReactions.length > 0 ? (
                  <div className={`mt-2 flex flex-wrap gap-1.5 ${isMe ? 'justify-end' : ''}`}>
                    {messageReactions.map((emoji, i) => (
                      <span
                        key={`${emoji}-${i}`}
                        className="rounded-sm border border-surface-border bg-white px-1.5 py-0.5 text-[11px] font-medium shadow-sm"
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Action Bar */}
              <div
                className={`absolute right-8 top-1 flex items-center gap-1 rounded-sm border border-surface-border bg-white p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 z-10`}
              >
                <button
                  type="button"
                  onClick={() => onOpenThread?.(message)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)] transition-colors"
                  title="Reply"
                >
                  <Reply size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setTaskConversionMessage(message)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)] transition-colors"
                  title="Convert to task"
                >
                  <CheckSquare size={14} />
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setReactionMenuMessageId(message.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)] transition-colors"
                    title="React"
                  >
                    <Smile size={14} />
                  </button>
                  <EmojiReactionPicker
                    isOpen={reactionMenuMessageId === message.id}
                    onClose={() => setReactionMenuMessageId(null)}
                    onSelect={(emoji) => handleAddReaction(message.id, emoji)}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {taskConversionMessage ? (
        <MessageToTaskDialog
          message={taskConversionMessage}
          isOpen={!!taskConversionMessage}
          onClose={() => setTaskConversionMessage(null)}
        />
      ) : null}
    </div>
  );
}
