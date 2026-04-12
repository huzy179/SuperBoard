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
    <div className="p-4 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-brand-500/50 focus-within:ring-4 focus-within:ring-brand-500/5 transition-all">
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Paperclip size={20} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 text-sm text-slate-700 min-h-[40px] max-h-[200px]"
          />

          <div className="flex items-center gap-1 self-center">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Smile size={20} />
            </button>
            <button
              onClick={handleSend}
              disabled={!content.trim() || sendMessageMutation.isPending}
              className={`p-2 rounded-lg transition-all ${
                content.trim()
                  ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:scale-95'
                  : 'text-slate-300'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <div className="h-4">{/* Real-time typing indicators could go here */}</div>
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
            <button className="hover:text-slate-600 transition-colors">Định dạng (Markdown)</button>
            <button className="hover:text-slate-600 transition-colors">
              <MoreHorizontal size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
