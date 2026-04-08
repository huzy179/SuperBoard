'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMessages, useSendMessage, useChannels } from '@/features/chat/hooks/use-chat';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { AssigneeAvatar } from '@/features/jira/components/task-badges';
import { Hash, Send, Smile, Paperclip, MoreHorizontal, Info } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { chatSocket } from '@/lib/realtime/chat-socket';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChannelPage() {
  const params = useParams<{ channelId: string }>();
  const { user } = useAuthSession();
  const { data: channels } = useChannels(undefined); // Cached from layout
  const { messages, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useMessages(
    params.channelId,
  );
  const sendMessageMutation = useSendMessage(params.channelId);

  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels?.find((c) => c.id === params.channelId);

  // Emit typing status
  useEffect(() => {
    if (!params.channelId || !user) return;

    const isCurrentlyTyping = inputText.length > 0;
    chatSocket.sendTyping(params.channelId, user.id, isCurrentlyTyping);

    if (isCurrentlyTyping) {
      const timeout = setTimeout(() => {
        chatSocket.sendTyping(params.channelId, user.id, false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [inputText, params.channelId, user]);

  // Listen for typing status
  useEffect(() => {
    if (!params.channelId) return;

    const unsubscribe = chatSocket.onTyping((data) => {
      if (data.channelId === params.channelId && data.userId !== user?.id) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          if (data.isTyping) {
            // We'd ideally need the user's name here.
            // For now we'll use a placeholder or assume we'll fetch it.
            next[data.userId] = 'Ai đó';
          } else {
            delete next[data.userId];
          }
          return next;
        });
      }
    });

    return () => {
      unsubscribe();
      setTypingUsers({});
    };
  }, [params.channelId, user?.id]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({ content: inputText.trim() });
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium tracking-wide">Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
            <Hash size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-900">
              {activeChannel?.name || 'Đang tải...'}
            </h1>
            <p className="truncate text-[11px] text-slate-500 font-medium">
              {activeChannel?.description || 'Kênh thảo luận chung của nhóm'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <button className="hover:text-slate-600 transition-colors" title="Thông tin kênh">
            <Info size={18} />
          </button>
          <button className="hover:text-slate-600 transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* Message List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 pb-2 space-y-6 scroll-smooth"
      >
        {hasNextPage && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-4 py-1.5 rounded-full bg-slate-100 text-[12px] font-bold text-slate-500 hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm tin nhắn cũ'}
            </button>
          </div>
        )}

        {[...messages].reverse().map((msg, index, array) => {
          const isMe = msg.authorId === user?.id;
          const prevMsg = index > 0 ? array[index - 1] : null;
          const showAvatar = index === 0 || prevMsg?.authorId !== msg.authorId;
          const time = format(new Date(msg.createdAt), 'HH:mm', { locale: vi });

          return (
            <div
              key={msg.id}
              className={`flex gap-3 group items-start transition-opacity ${showAvatar ? 'mt-4' : 'mt-1'}`}
            >
              <div className="w-8 shrink-0">
                {showAvatar ? (
                  <AssigneeAvatar
                    name={msg.author?.fullName || 'Người dùng'}
                    src={msg.author?.avatarUrl}
                    size="lg"
                  />
                ) : (
                  <div className="w-8 h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-slate-400 font-mono">{time}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {showAvatar && (
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className={`text-[13px] font-bold hover:underline cursor-pointer transition-colors ${isMe ? 'text-brand-600' : 'text-slate-900'}`}
                    >
                      {msg.author?.fullName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{time}</span>
                  </div>
                )}
                <div className="text-[14px] leading-relaxed text-slate-700 whitespace-pre-wrap wrap-break-word border-l-2 border-transparent hover:border-brand-100 pl-2 transition-all prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-code:text-brand-600 prose-code:bg-brand-50 prose-code:px-1 prose-code:rounded prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Typing Indicator */}
      <div className="px-6 h-6 flex items-center gap-2">
        {Object.keys(typingUsers).length > 0 && (
          <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-500">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">
              {Object.values(typingUsers).join(', ')} đang nhập...
            </span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-6 pb-6 pt-2 bg-white">
        <form
          className="relative rounded-xl border-2 border-slate-100 bg-slate-50/50 focus-within:border-brand-500 focus-within:bg-white transition-all shadow-sm"
          onSubmit={handleSendMessage}
        >
          <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-1.5">
            <button
              type="button"
              className="p-1.5 hover:bg-slate-200/50 rounded-md text-slate-500 transition-colors"
            >
              <Smile size={16} />
            </button>
            <button
              type="button"
              className="p-1.5 hover:bg-slate-200/50 rounded-md text-slate-500 transition-colors"
            >
              <Paperclip size={16} />
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Gửi tin nhắn đến #${activeChannel?.name || ''}`}
            className="w-full resize-none bg-transparent px-4 py-3 text-[14px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none min-h-[80px]"
            rows={2}
          />

          <div className="flex items-center justify-end px-3 pb-2 pt-1">
            <button
              type="submit"
              disabled={!inputText.trim() || sendMessageMutation.isPending}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all ${
                !inputText.trim() || sendMessageMutation.isPending
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md'
              }`}
            >
              <span>Gửi</span>
              <Send size={12} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
