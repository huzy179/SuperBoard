'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
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
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < 120;
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, []);

  useLayoutEffect(() => {
    const lastId = messages[messages.length - 1]?.id || null;
    const lastChanged = !!lastId && lastId !== lastMessageIdRef.current;
    lastMessageIdRef.current = lastId;

    if (!lastChanged) return;
    if (!shouldAutoScrollRef.current) return;

    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [messages]);

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

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-0 py-5 space-y-3 bg-[color:var(--color-surface-alt)]/60"
      >
        {messages.map((message, index) => {
          const isLastFromUser = index > 0 && messages[index - 1]?.authorId === message.authorId;
          const showHeader = !isLastFromUser;
          const isMe = message.authorId === currentUser?.id;
          const messageReactions = reactions[message.id] || [];

          return (
            <div
              key={message.id}
              className={`group relative flex rounded-md px-3 py-1.5 transition-colors hover:bg-black/[0.02] ${
                showHeader ? 'mt-2' : 'mt-0'
              } ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex min-w-0 gap-3 ${isMe ? 'justify-end' : ''}`}>
                {!isMe ? (
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
                ) : null}

                <div className="min-w-0">
                  {showHeader ? (
                    <div className={`mb-1 flex items-baseline gap-2 ${isMe ? 'justify-end' : ''}`}>
                      <span className="text-[13px] font-bold tracking-tight text-[color:var(--color-ink)]">
                        {message.author?.fullName || 'Member'}
                      </span>
                      <span className="text-[10px] font-medium text-[color:var(--color-faint)] uppercase tracking-wider">
                        {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                      </span>
                    </div>
                  ) : null}

                  <div
                    className={[
                      'w-fit max-w-[72ch] rounded-lg border px-3 py-2 text-[14px] leading-relaxed text-[color:var(--color-ink)] shadow-[0_1px_0_rgba(0,0,0,0.02)]',
                      isMe
                        ? 'ml-auto bg-brand-500/[0.08] border-brand-500/[0.18]'
                        : 'bg-white border-surface-border/60',
                    ].join(' ')}
                  >
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  </div>

                  {messageReactions.length > 0 ? (
                    <div className={`mt-2 flex flex-wrap gap-1.5 ${isMe ? 'justify-end' : ''}`}>
                      {messageReactions.map((emoji, i) => (
                        <span
                          key={`${emoji}-${i}`}
                          className="rounded-full border border-surface-border/70 bg-white px-2 py-0.5 text-[11px] font-medium shadow-sm"
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Action Bar */}
              <div
                className={`absolute right-3 top-1 flex items-center gap-1 rounded-md border border-surface-border bg-white p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 z-10`}
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
