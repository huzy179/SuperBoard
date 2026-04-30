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
    <div className="max-w-4xl mx-auto">
      <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm">
        <div className="flex items-end gap-2 p-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Attach"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn…"
            className="flex-1 bg-transparent border-none resize-none py-2 text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-faint)] focus:outline-none min-h-[44px] max-h-[200px] leading-relaxed"
          />

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Emoji"
          >
            <Smile size={18} />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!content.trim() || sendMessageMutation.isPending}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>

        <div className="border-t border-surface-border px-3 py-2 text-xs text-[color:var(--color-muted)]">
          Enter để gửi • Shift+Enter xuống dòng
        </div>
      </div>
    </div>
  );
}
