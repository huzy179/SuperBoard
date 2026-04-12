'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Zap, Sparkles } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto relative group">
      {/* High-fidelity rim lighting proxy */}
      <div className="absolute -inset-px bg-gradient-to-r from-brand-500/20 via-transparent to-brand-500/20 rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm pointer-events-none" />

      <div className="relative flex flex-col p-2 rounded-[2rem] bg-slate-950/80 backdrop-blur-3xl border border-white/5 shadow-2xl focus-within:border-brand-500/30 transition-all">
        <div className="flex items-end gap-2 px-2 pb-2">
          <button className="p-3 text-white/20 hover:text-brand-400 hover:bg-white/5 rounded-2xl transition-all">
            <Paperclip size={20} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="INITIALIZING_TRANSMISSION..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-4 text-[14px] text-white min-h-[52px] max-h-[200px] placeholder:text-white/10 font-medium uppercase tracking-tight"
          />

          <div className="flex items-center gap-2 self-center pb-1">
            <button className="p-3 text-white/20 hover:text-amber-400 hover:bg-white/5 rounded-2xl transition-all">
              <Smile size={20} />
            </button>

            <div className="h-8 w-px bg-white/5 mx-1" />

            <button
              onClick={handleSend}
              disabled={!content.trim() || sendMessageMutation.isPending}
              className={`p-4 rounded-2xl transition-all group/send active:scale-95 ${
                content.trim()
                  ? 'bg-brand-500 text-white shadow-glow-brand/20 hover:bg-brand-400'
                  : 'bg-white/5 text-white/10'
              }`}
            >
              {sendMessageMutation.isPending ? (
                <Zap className="h-5 w-5 animate-pulse" />
              ) : (
                <Send className="h-5 w-5 group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
              )}
            </button>
          </div>
        </div>

        {/* Terminal Metadata Footer */}
        <div className="flex items-center justify-between px-6 py-2 border-t border-white/5 bg-black/20 rounded-b-[1.8rem]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 bg-brand-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                Neural_Link_Stable
              </span>
            </div>
            <div className="h-3 w-px bg-white/5" />
            <button className="flex items-center gap-1.5 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-brand-400 transition-colors">
              <Sparkles size={10} />
              AI_AUTO_PROTOCOL
            </button>
          </div>

          <div className="flex items-center gap-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
            <div className="flex items-center gap-1.5">
              <span className="p-1 bg-white/5 rounded text-[8px]">COMMAND_SHIFT</span>
              <span>+</span>
              <span className="p-1 bg-white/5 rounded text-[8px]">ENTER</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
