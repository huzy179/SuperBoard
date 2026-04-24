'use client';

import React, { useState } from 'react';
import { X, Sparkles, Loader2, MessageCircle, Zap, ShieldCheck } from 'lucide-react';
import { useThreadMessages, useSummarizeThread } from '../hooks/use-chat';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AssigneeAvatar } from '@/features/task/components/task-badges';
import type { Message } from '@superboard/shared';

interface ThreadPanelProps {
  parentMessage: Message;
  onClose: () => void;
}

export function ThreadPanel({ parentMessage, onClose }: ThreadPanelProps) {
  const { data: replies, isLoading } = useThreadMessages(parentMessage.id);
  const summarizeMutation = useSummarizeThread();
  const [summary, setSummary] = useState<string | null>(null);

  const handleSummarize = async () => {
    try {
      const result = await summarizeMutation.mutateAsync(parentMessage.id);
      setSummary(result.summary);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-3xl animate-in slide-in-from-right duration-500 relative z-50">
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-brand-500/10 rounded-sm border border-brand-500/20 shadow-inner">
            <MessageCircle size={12} className="text-brand-400" />
          </div>
          <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
            SIGNAL_THREAD_CONTEXT
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/[0.03] rounded-sm text-white/20 hover:text-white transition-all relative z-10 group border border-transparent hover:border-white/5"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 scrollbar-none relative">
        {/* Parent Context Node */}
        <div className="p-6 rounded-xl bg-white/[0.03] border border-white/5 relative group/parent">
          <div className="flex gap-4">
            <div className="relative shrink-0">
              <AssigneeAvatar
                name={parentMessage.author?.fullName || ''}
                src={parentMessage.author?.avatarUrl}
                size="md"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-slate-950 rounded-full border border-slate-950">
                <div className="h-full w-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-white text-[10px] uppercase tracking-widest">
                  {parentMessage.author?.fullName}
                </span>
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                  {format(new Date(parentMessage.createdAt), 'dd.MM • HH:mm:ss', { locale: vi })}
                </span>
              </div>
              <p className="text-[13px] text-white/80 leading-relaxed font-bold uppercase tracking-tight">
                {parentMessage.content}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-brand-400 animate-pulse shadow-glow-brand" />
              <span className="text-[8px] font-bold text-brand-400/40 uppercase tracking-widest leading-none">
                {replies?.length || 0}_DATA_PACKETS
              </span>
            </div>

            <button
              onClick={handleSummarize}
              disabled={summarizeMutation.isPending || !replies?.length}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 hover:text-white transition-all font-black text-[8px] uppercase tracking-widest leading-none disabled:opacity-30 group/summary shadow-inner"
            >
              {summarizeMutation.isPending ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Sparkles size={10} className="group-hover/summary:animate-pulse" />
              )}
              <span>AI_SYNTHESIZE</span>
            </button>
          </div>

          {/* AI Synthesis Node */}
          {summary && (
            <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-sm animate-in zoom-in-95 duration-500 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 blur-2xl rounded-full" />
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={10} className="text-emerald-400" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                  SYNTHESIS_REPORT
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/40 leading-relaxed font-bold uppercase tracking-tight italic">
                "{summary}"
              </p>
            </div>
          )}
        </div>

        {/* Signal Stream */}
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-brand-500/40" size={32} />
          </div>
        ) : (
          <div className="space-y-8 pl-12 relative">
            <div className="absolute left-[34px] top-0 bottom-8 w-0.5 bg-gradient-to-b from-brand-500/20 via-white/5 to-transparent" />
            {replies?.map((reply) => (
              <div key={reply.id} className="relative animate-in slide-in-from-left-4 duration-500">
                <div className="absolute -left-[23px] top-4 w-5 h-px bg-white/10" />
                <div className="flex gap-var(--space-4) p-var(--space-3) rounded-sm hover:bg-white/[0.01] transition-all border border-transparent hover:border-white/5">
                  <div className="relative shrink-0">
                    <AssigneeAvatar
                      name={reply.author?.fullName || ''}
                      src={reply.author?.avatarUrl}
                      size="sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-white/60 text-[10px] uppercase tracking-widest">
                        {reply.author?.fullName}
                      </span>
                      <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">
                        {format(new Date(reply.createdAt), 'HH:mm', { locale: vi })}
                      </span>
                    </div>
                    <p className="text-[12px] text-white/40 leading-relaxed font-bold uppercase tracking-tight">
                      {reply.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 bg-black/20 border-t border-white/5">
        <div className="flex items-center gap-2 text-white/10">
          <Zap size={10} />
          <span className="text-[8px] font-bold uppercase tracking-widest">
            UPLINK_CONNECTION_PERSISTENT
          </span>
        </div>
      </div>
    </div>
  );
}
