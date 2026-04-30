'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useMessages } from '../hooks/use-chat';
import { AssigneeAvatar } from '@/features/operations/task/components/task-badges';
import { CheckSquare, Loader2, MoreHorizontal, Reply, Smile } from 'lucide-react';
import type { Message } from '@superboard/shared';
import { MessageToTaskDialog } from './MessageToTaskDialog';
import { EmojiReactionPicker } from './EmojiReactionPicker';

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
          const isMe = message.authorId === 'me';
          const messageReactions = reactions[message.id] || [];

          return (
            <div
              key={message.id}
              className={`group flex gap-3 ${showHeader ? 'mt-4' : 'mt-1'} ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe ? (
                showHeader ? (
                  <AssigneeAvatar
                    name={message.author?.fullName || 'Member'}
                    src={message.author?.avatarUrl}
                    size="sm"
                  />
                ) : (
                  <div className="w-8 shrink-0" />
                )
              ) : null}

              <div className={`min-w-0 max-w-3xl ${isMe ? 'text-right' : ''}`}>
                {showHeader ? (
                  <div
                    className={`mb-1 flex flex-wrap items-center gap-2 ${isMe ? 'justify-end' : ''}`}
                  >
                    <span className="text-sm font-semibold text-[color:var(--color-ink)]">
                      {message.author?.fullName || 'Member'}
                    </span>
                    <span className="text-xs text-[color:var(--color-faint)]">
                      {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                    </span>
                  </div>
                ) : null}

                <div
                  className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-surface-card text-[color:var(--color-ink)] border-surface-border'
                  }`}
                >
                  {message.content}
                </div>

                {messageReactions.length > 0 ? (
                  <div className={`mt-2 flex flex-wrap gap-2 ${isMe ? 'justify-end' : ''}`}>
                    {messageReactions.map((emoji, i) => (
                      <span
                        key={`${emoji}-${i}`}
                        className="rounded-full border border-surface-border bg-black/[0.02] px-2 py-0.5 text-[11px] text-[color:var(--color-muted)]"
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div
                  className={`mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isMe ? 'justify-end' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onOpenThread?.(message)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
                    title="Reply"
                  >
                    <Reply size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskConversionMessage(message)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
                    title="Convert to task"
                  >
                    <CheckSquare size={14} />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setReactionMenuMessageId(message.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
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
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
                    title="More"
                  >
                    <MoreHorizontal size={14} />
                  </button>
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
