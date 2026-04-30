'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, RefreshCw, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { chatWithProjectAi, getAiProjectBriefing } from '../api/ai-service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProjectCopilotProps {
  projectId: string;
}

export function ProjectCopilot({ projectId }: ProjectCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchBriefing = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAiProjectBriefing(projectId);
      if (data.briefing) {
        setMessages([
          {
            id: 'briefing',
            role: 'assistant',
            content: data.briefing,
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      toast.error('Không thể tải briefing');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      Promise.resolve().then(() => fetchBriefing());
    }
    scrollToBottom();
  }, [isOpen, messages.length, fetchBriefing, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await chatWithProjectAi(projectId, userMsg.content);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast.error('Gặp lỗi khi trò chuyện với AI');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition-colors hover:bg-brand-600"
        aria-label="Open project copilot"
      >
        <Bot size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex h-[560px] w-[380px] flex-col overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-luxe">
      <div className="flex items-start justify-between gap-4 border-b border-surface-border px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-border bg-brand-50 text-brand-700">
            <Bot size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[color:var(--color-ink)]">Copilot dự án</div>
            <div className="mt-1 text-xs text-[color:var(--color-muted)]">
              Hỏi nhanh về tiến độ, rủi ro hoặc đề xuất hành động.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBriefing}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Refresh briefing"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Close copilot"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[85%] space-y-1">
              <div
                className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-bg border border-surface-border text-[color:var(--color-ink)]'
                }`}
              >
                {msg.content}
              </div>
              <div
                className={`text-[11px] text-[color:var(--color-faint)] ${msg.role === 'user' ? 'text-right' : ''}`}
              >
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading ? (
          <div className="flex justify-start">
            <div className="rounded-lg border border-surface-border bg-surface-bg px-4 py-3 text-sm text-[color:var(--color-muted)]">
              Đang trả lời…
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-surface-border bg-surface-card px-5 py-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập câu hỏi…"
            className="flex-1 form-input"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
