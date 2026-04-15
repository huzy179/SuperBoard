'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchBriefing();
    }
    scrollToBottom();
  }, [isOpen, messages]);

  const fetchBriefing = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/ai/projects/${projectId}/briefing`);
      const data = await res.json();
      if (data.data.briefing) {
        setMessages([
          {
            id: 'briefing',
            role: 'assistant',
            content: data.data.briefing,
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      toast.error('Không thể tải briefing');
    } finally {
      setIsLoading(false);
    }
  };

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
      const res = await fetch(`/api/v1/ai/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data.response,
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
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-glow-brand transition-all flex items-center justify-center group z-50 animate-in fade-in zoom-in duration-500"
      >
        <Bot size={28} className="transition-transform group-hover:scale-110" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="w-2 h-2 bg-white rounded-full animate-ping" />
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-[400px] h-[600px] bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden z-[100] animate-in slide-in-from-bottom-8 slide-in-from-right-8 duration-500 font-sans">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Copilot dự án
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow-emerald" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">
                AI đang hoạt động
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-white/20 hover:text-white transition-colors">
            <RefreshCw size={16} onClick={fetchBriefing} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-white/20 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.03)_0%,_transparent_70%)]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`
                p-4 rounded-[1.5rem] text-sm leading-relaxed
                ${
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white rounded-tr-none shadow-glow-brand'
                    : 'bg-white/5 text-white/80 border border-white/5 rounded-tl-none'
                }
              `}
              >
                {msg.role === 'assistant' && msg.id === 'briefing' && (
                  <div className="flex items-center gap-2 mb-3 px-2 py-1 bg-white/5 rounded-lg w-fit">
                    <Sparkles size={12} className="text-brand-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-400">
                      Tóm tắt dự án
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-white/5 border border-white/5 p-4 rounded-[1.5rem] rounded-tl-none flex gap-2">
              <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-black/40 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hãy hỏi Copilot về dự án..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-500/50 transition-all focus:bg-white/10"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-brand"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-brand-400" />
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
              Engine AI v4
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-[9px] font-bold text-white/30 hover:text-white uppercase tracking-widest transition-colors">
              Xóa lịch sử
            </button>
            <button className="text-[9px] font-bold text-white/30 hover:text-white uppercase tracking-widest transition-colors">
              Cài đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
