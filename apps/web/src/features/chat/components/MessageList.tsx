'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useMessages } from '../hooks/use-chat';
import { AssigneeAvatar } from '@/features/jira/components/task-badges';
import { Loader2, MessageSquare } from 'lucide-react';
import type { Message } from '@superboard/shared';

interface MessageListProps {
  channelId: string;
  onOpenThread?: (message: Message) => void;
}

export function MessageList({ channelId, onOpenThread }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, typingUsers, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMessages(channelId);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6 flex flex-col-reverse"
      >
        <div ref={bottomRef} />

        <div className="space-y-6">
          {messages.map((message, index) => {
            const isLastFromUser = index > 0 && messages[index - 1]?.authorId === message.authorId;
            const showHeader = !isLastFromUser;

            return (
              <div
                key={message.id}
                className={`flex gap-3 group animate-in slide-in-from-bottom-2 duration-300 relative ${showHeader ? 'mt-4' : 'mt-1'}`}
              >
                {showHeader ? (
                  <AssigneeAvatar
                    name={message.author?.fullName || 'Người dùng'}
                    src={message.author?.avatarUrl}
                    size="md"
                  />
                ) : (
                  <div className="w-10" /> // Spacer
                )}

                <div className="flex-1 min-w-0">
                  {showHeader && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-sm">
                        {message.author?.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                      </span>
                    </div>
                  )}

                  <div className="text-slate-700 text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                  </div>

                  {/* Reply Button (Hover Only) */}
                  <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100 rounded-lg shadow-sm">
                    <button
                      onClick={() => onOpenThread?.(message)}
                      className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-brand-600 transition-colors"
                      title="Trả lời chủ đề"
                    >
                      <MessageSquare size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm tin nhắn cũ'}
          </button>
        </div>
      )}

      {typingUsers.length > 0 && (
        <div className="px-6 py-2 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="text-[10px] text-slate-400 italic">
            {typingUsers.length === 1
              ? 'Một người đang nhập...'
              : `${typingUsers.length} người đang nhập...`}
          </span>
        </div>
      )}
    </div>
  );
}
