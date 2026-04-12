'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, MoreHorizontal } from 'lucide-react';
import { useSendMessage } from '../hooks/use-chat';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { chatSocket } from '@/lib/realtime/chat-socket';

interface MessageInputProps {
  channelId: string;
}

export function MessageInput({ channelId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const { user } = useAuthSession();
  const sendMessageMutation = useSendMessage(channelId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({ content: trimmed });
    setContent('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      if (user) {
        chatSocket.sendTyping(channelId, user.id, false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing indicator logic
    if (user) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      chatSocket.sendTyping(channelId, user.id, true);

      typingTimeoutRef.current = setTimeout(() => {
        chatSocket.sendTyping(channelId, user.id, false);
      }, 2000);
    }
  };

  return (
    <div className="p-4 bg-transparent">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2 p-2 rounded-[1.5rem] bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl shadow-brand-500/5 focus-within:border-brand-500/50 focus-within:ring-4 focus-within:ring-brand-500/5 transition-all group/input">
          <button className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
            <Paperclip size={20} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Viết điều gì đó mượt mà..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-[14px] text-slate-700 min-h-[44px] max-h-[200px] placeholder:text-slate-300 font-medium"
          />

          <div className="flex items-center gap-1.5 self-center pb-1">
            <button className="p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all">
              <Smile size={20} />
            </button>
            <button
              onClick={handleSend}
              disabled={!content.trim() || sendMessageMutation.isPending}
              className={`p-3 rounded-xl transition-all active:scale-90 ${
                content.trim()
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-black'
                  : 'text-slate-200'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
            </div>
            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
              Markdown Supported
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">
            <button className="hover:text-brand-600 transition-colors">Slash Commands (/)</button>
            <button className="hover:text-slate-600 transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
