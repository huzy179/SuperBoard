import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useMessages } from '../hooks/use-chat';
import { AssigneeAvatar } from '@/features/task/components/task-badges';
import {
  Loader2,
  Reply,
  Zap,
  MoreHorizontal,
  ExternalLink,
  Box,
  FileText,
  CheckSquare,
} from 'lucide-react';
import type { Message } from '@superboard/shared';
import { motion } from 'framer-motion';
import { MessageToTaskDialog } from './MessageToTaskDialog';
import { EmojiReactionPicker } from './EmojiReactionPicker';
import { Smile } from 'lucide-react';

interface MessageListProps {
  channelId: string;
  onOpenThread?: (message: Message) => void;
}

export function MessageList({ channelId, onOpenThread }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
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

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="h-4 w-4 text-brand-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
      {hasNextPage && (
        <div className="flex justify-center py-6">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black text-brand-400 uppercase tracking-widest hover:bg-white/[0.05] hover:text-white transition-all transition-colors"
          >
            {isFetchingNextPage ? 'Đang tải...' : 'Tin nhắn cũ hơn'}
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-6 space-y-8 flex flex-col-reverse scrollbar-none"
      >
        <div ref={bottomRef} />

        <div className="space-y-8">
          {messages.map((message, index) => {
            const isLastFromUser = index > 0 && messages[index - 1]?.authorId === message.authorId;
            const showHeader = !isLastFromUser;
            const isMe = message.authorId === 'me';

            return (
              <div
                key={message.id}
                className={`flex gap-5 group animate-in slide-in-from-bottom-4 duration-500 relative ${showHeader ? 'mt-8' : 'mt-1'}`}
              >
                {showHeader ? (
                  <div className="relative shrink-0">
                    <AssigneeAvatar
                      name={message.author?.fullName || 'Thành viên'}
                      src={message.author?.avatarUrl}
                      size="md"
                    />
                    <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-slate-950 rounded-full border-2 border-slate-950 flex items-center justify-center">
                      <div className="h-full w-full bg-emerald-500 rounded-full animate-pulse shadow-glow-emerald" />
                    </div>
                  </div>
                ) : (
                  <div className="w-10 shrink-0" />
                )}

                <div className={`flex-1 min-w-0 max-w-3xl ${isMe ? 'ml-auto text-right' : ''}`}>
                  {showHeader && (
                    <div className={`flex items-center gap-3 mb-2 ${isMe ? 'justify-end' : ''}`}>
                      <span className="font-black text-white text-[13px] uppercase tracking-wider">
                        {message.author?.fullName}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-white/20" />
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                        {format(new Date(message.createdAt), 'HH:mm:ss', { locale: vi })}
                      </span>
                    </div>
                  )}

                  <div className="relative group/bubble">
                    <div
                      className={`relative text-[14px] leading-relaxed break-words whitespace-pre-wrap px-5 py-3.5 rounded-2xl border transition-all duration-500 shadow-inner group-hover/bubble:shadow-glow-brand/5 ${
                        showHeader ? (isMe ? 'rounded-tr-none' : 'rounded-tl-none') : ''
                      } ${
                        isMe
                          ? 'bg-brand-500/10 border-brand-500/20 text-brand-100'
                          : 'bg-white/[0.03] border-white/5 text-white/80 group-hover/bubble:bg-white/[0.05] group-hover/bubble:border-white/10'
                      }`}
                    >
                      <div className="flex-1">
                        {message.content}
                        <NeuralLinkPreview content={message.content} />
                      </div>

                      {/* Physical noise texture proxy */}
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 rounded-2xl" />
                    </div>

                    {/* Reaction System */}
                    <div className={`flex flex-wrap gap-2 mt-3 px-1 ${isMe ? 'justify-end' : ''}`}>
                      {reactions[message.id]?.map((emoji, i) => (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          key={i}
                          className="flex items-center gap-2 px-2.5 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-xs shadow-glow-brand/5"
                        >
                          {emoji}
                        </motion.button>
                      ))}

                      {!reactions[message.id]?.length && (
                        <button className="group/pip relative flex items-center gap-2 px-3 py-1.5 bg-brand-500/5 border border-brand-500/10 rounded-full">
                          <div className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500/40"></span>
                          </div>
                          <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">
                            Awaiting Intel
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Floating Controls */}
                    <div
                      className={`absolute -top-3 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 z-20 ${isMe ? 'right-0' : 'left-0'}`}
                    >
                      <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl">
                        <button
                          onClick={() => onOpenThread?.(message)}
                          className="p-2.5 hover:bg-white/5 text-white/40 hover:text-brand-400 rounded-lg transition-all"
                          title="Mở cuộc trò chuyện"
                        >
                          <Reply size={16} />
                        </button>
                        <button
                          onClick={() => setTaskConversionMessage(message)}
                          className="p-2.5 hover:bg-white/5 text-white/40 hover:text-emerald-400 rounded-lg transition-all"
                          title="Chuyển thành Jira Task"
                        >
                          <CheckSquare size={16} />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setReactionMenuMessageId(message.id)}
                            className="p-2.5 hover:bg-white/5 text-white/40 hover:text-brand-400 rounded-lg transition-all"
                            title="Thêm phản hồi"
                          >
                            <Smile size={16} />
                          </button>
                          <EmojiReactionPicker
                            isOpen={reactionMenuMessageId === message.id}
                            onClose={() => setReactionMenuMessageId(null)}
                            onSelect={(emoji) => handleAddReaction(message.id, emoji)}
                          />
                        </div>
                        <div className="w-px h-4 bg-white/5 mx-1" />
                        <button className="p-2.5 hover:bg-white/5 text-white/40 hover:text-white rounded-lg transition-all">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {taskConversionMessage && (
        <MessageToTaskDialog
          message={taskConversionMessage}
          isOpen={!!taskConversionMessage}
          onClose={() => setTaskConversionMessage(null)}
        />
      )}
    </div>
  );
}

function NeuralLinkPreview({ content }: { content: string }) {
  const isJiraMatch = content.match(/\/jira\/projects\/([^\s/]+)/);
  const isDocMatch = content.match(/\/docs\/([^\s/]+)/);

  if (!isJiraMatch && !isDocMatch) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-black/40 border border-white/5 rounded-2xl group/preview hover:border-brand-500/30 transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          {isJiraMatch ? (
            <Box size={14} className="text-brand-400" />
          ) : (
            <FileText size={14} className="text-emerald-400" />
          )}
          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
            {isJiraMatch ? 'Cross-Entity Node' : 'Encrypted Archive'}
          </span>
        </div>
        <ExternalLink
          size={12}
          className="text-white/20 group-hover/preview:text-brand-400 transition-colors"
        />
      </div>

      <div className="relative z-10">
        <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">
          {isJiraMatch ? 'Project Sector Delta' : 'Operating Protocol v1.4'}
        </h4>
        <p className="text-[10px] text-white/40 line-clamp-1 font-medium">
          {isJiraMatch
            ? 'Viewing active simulation in sector JIRA-402'
            : 'Accessing collaborative intelligence node...'}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 relative z-10">
        <div className="h-6 w-6 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
        </div>
        <span className="text-[8px] font-black text-brand-400 uppercase tracking-widest">
          Active Link Established
        </span>
      </div>
    </motion.div>
  );
}
