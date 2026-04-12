import React, { useState } from 'react';
import { X, Sparkles, Loader2, MessageCircle } from 'lucide-react';
import { useThreadMessages, useSummarizeThread } from '../hooks/use-chat';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AssigneeAvatar } from '@/features/jira/components/task-badges';
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
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div className="w-[400px] border-l border-slate-100 bg-white flex flex-col h-full animate-in slide-in-from-right duration-300 shadow-2xl z-40">
      <header className="h-14 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">Luồng thảo luận</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Parent Message */}
        <div className="pb-6 border-b border-slate-50">
          <div className="flex gap-3">
            <AssigneeAvatar name={parentMessage.author?.fullName || ''} src={parentMessage.author?.avatarUrl} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-900 text-sm">{parentMessage.author?.fullName}</span>
                <span className="text-[10px] text-slate-400">
                  {format(new Date(parentMessage.createdAt), 'dd/MM HH:mm', { locale: vi })}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{parentMessage.content}</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              {replies?.length || 0} phản hồi
            </span>
            <button
              onClick={handleSummarize}
              disabled={summarizeMutation.isPending || !replies?.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all font-bold text-[11px] disabled:opacity-50"
            >
              {summarizeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              <span>AI Summary</span>
            </button>
          </div>

          {/* AI Summary View */}
          {summary && (
            <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={12} className="text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Tóm tắt bởi AI</span>
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed italic">"{summary}"</p>
            </div>
          )}
        </div>

        {/* Replies */}
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : (
          <div className="space-y-6">
            {replies?.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <AssigneeAvatar name={reply.author?.fullName || ''} src={reply.author?.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-xs">{reply.author?.fullName}</span>
                    <span className="text-[9px] text-slate-400">{format(new Date(reply.createdAt), 'HH:mm', { locale: vi })}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
