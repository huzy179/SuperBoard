'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Zap, Sparkles } from 'lucide-react';
import { useSendMessage } from '../hooks/use-chat';
import { useAuthSession } from '@/features/system/auth/hooks/use-auth-session';
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
      <div className="absolute -inset-px bg-gradient-to-r from-brand-500/10 via-transparent to-brand-500/10 rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm pointer-events-none" />

      <div className="relative flex flex-col p-var(--space-2) rounded-md bg-slate-950/80 backdrop-blur-3xl border border-white/10 shadow-inner focus-within:border-brand-500/30 transition-all">
        <div className="flex items-end gap-var(--space-2) px-var(--space-2) pb-var(--space-2)">
          <button className="p-3 text-white/20 hover:text-brand-400 hover:bg-white/[0.03] rounded-sm transition-all border border-transparent hover:border-white/5">
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="TRANSMIT_SIGNAL..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-4 text-[13px] text-white min-h-[52px] max-h-[200px] placeholder:text-white/5 font-bold uppercase tracking-tight"
          />

          <div className="flex items-center gap-var(--space-2) self-center pb-1">
            <button className="p-3 text-white/20 hover:text-amber-400 hover:bg-white/[0.03] rounded-sm transition-all border border-transparent hover:border-white/5">
              <Smile size={18} />
            </button>

            <div className="h-6 w-px bg-white/5 mx-var(--space-1)" />

            <button
              onClick={handleSend}
              disabled={!content.trim() || sendMessageMutation.isPending}
              className={`p-3.5 rounded-sm transition-all group/send active:scale-95 border ${
                content.trim()
                  ? 'bg-brand-500 text-white border-brand-400/20 shadow-glow-brand/10 hover:bg-brand-400'
                  : 'bg-white/5 text-white/5 border-transparent'
              }`}
            >
              {sendMessageMutation.isPending ? (
                <Zap className="h-4 w-4 animate-pulse" />
              ) : (
                <Send className="h-4 w-4 group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />
              )}
            </button>
          </div>
        </div>

        {/* Terminal Metadata Footer */}
        <div className="flex items-center justify-between px-var(--space-5) py-1.5 border-t border-white/5 bg-black/20 rounded-b-md">
          <div className="flex items-center gap-var(--space-4)">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 bg-brand-500 rounded-full animate-pulse shadow-glow-brand" />
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                SIGNAL_UPLINK_STABLE
              </span>
            </div>
            <div className="h-2 w-px bg-white/5" />
            <button className="flex items-center gap-1.5 text-[8px] font-bold text-white/20 uppercase tracking-widest hover:text-brand-400 transition-colors">
              <Sparkles size={10} />
              AI_NEURAL_SYNAPSE
            </button>
          </div>

          <div className="flex items-center gap-4 text-[8px] font-bold text-white/10 uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <span className="px-1 py-0.5 bg-white/5 rounded-xs border border-white/5 text-[7px]">
                Ctrl
              </span>
              <span>+</span>
              <span className="px-1 py-0.5 bg-white/5 rounded-xs border border-white/5 text-[7px]">
                ENTER
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
