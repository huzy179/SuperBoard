'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, Smile } from 'lucide-react';
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

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
  }, [content]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({ content: trimmed });
    setContent('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      if (user) chatSocket.sendTyping(channelId, user.id, false);
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

    if (!user) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    chatSocket.sendTyping(channelId, user.id, true);
    typingTimeoutRef.current = setTimeout(() => {
      chatSocket.sendTyping(channelId, user.id, false);
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="rounded-sm border border-surface-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-shadow focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-end gap-1 p-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Attach"
          >
            <Paperclip size={16} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn…"
            className="flex-1 bg-transparent border-none resize-none py-2 text-[14px] text-[color:var(--color-ink)] placeholder:text-[color:var(--color-faint)] focus:outline-none min-h-[40px] max-h-[200px] leading-relaxed"
          />

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Emoji"
          >
            <Smile size={16} />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!content.trim() || sendMessageMutation.isPending}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:opacity-40 shadow-sm"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-surface-border/50 px-3 py-1.5 bg-black/[0.01]">
          <div className="text-[10px] font-bold text-[color:var(--color-muted)] uppercase tracking-wider opacity-60">
            Markdown Supported
          </div>
          <div className="text-[10px] font-medium text-[color:var(--color-muted)] opacity-60">
            <span className="font-bold text-brand-600">Enter</span> to send •{' '}
            <span className="font-bold text-brand-600">Shift+Enter</span> for new line
          </div>
        </div>
      </div>
    </div>
  );
}
