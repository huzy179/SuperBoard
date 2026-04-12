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
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
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
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-black text-slate-900 text-[13px] tracking-tight">
                        {message.author?.fullName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 opacity-60">
                        {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                      </span>
                    </div>
                  )}

                  <div
                    className={`text-slate-700 text-[14px] leading-relaxed break-words whitespace-pre-wrap px-4 py-2.5 rounded-2xl border transition-all shadow-sm ${showHeader ? 'rounded-tl-none' : ''} ${message.authorId === 'me' ? 'bg-brand-50/80 border-brand-100/50 text-brand-900 ring-1 ring-brand-200/20' : 'bg-white/80 border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-md'}`}
                  >
                    {message.content}
                  </div>

                  {/* Reaction Display (Simulated) */}
                  <div className="flex flex-wrap gap-1 mt-1.5 px-1">
                    <button className="flex items-center gap-1.2 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-500 hover:bg-white hover:border-brand-200 transition-all">
                      <span>🔥</span>
                      <span>2</span>
                    </button>
                    <button className="flex items-center gap-1.2 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-500 hover:bg-white hover:border-brand-200 transition-all">
                      <span>🚀</span>
                      <span>1</span>
                    </button>
                  </div>

                  <div className="absolute right-0 -top-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 z-10">
                    <div className="flex items-center gap-0.5 p-1 bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl shadow-2xl">
                      <button
                        onClick={() => onOpenThread?.(message)}
                        className="p-2 hover:bg-slate-50 text-slate-500 hover:text-brand-600 rounded-lg transition-all"
                        title="Trả lời chủ đề"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        className="p-2 hover:bg-slate-50 text-slate-500 hover:text-amber-500 rounded-lg transition-all"
                        title="Thả cảm xúc"
                      >
                        <span className="text-xs">😀</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
