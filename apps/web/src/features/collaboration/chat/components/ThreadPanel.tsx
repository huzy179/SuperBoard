'use client';

import React, { useState } from 'react';
import { Loader2, MessageCircle, Sparkles, X } from 'lucide-react';
import { useThreadMessages, useSummarizeThread } from '../hooks/use-chat';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AssigneeAvatar } from '@/features/operations/task/components/task-badges';
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
      // handled by hook
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface-card">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-surface-border px-5">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)]">
            <MessageCircle size={18} />
          </div>
          <div className="text-sm font-semibold text-[color:var(--color-ink)]">Thread</div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close thread"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div className="rounded-lg border border-surface-border bg-surface-bg p-4">
          <div className="flex gap-3">
            <AssigneeAvatar
              name={parentMessage.author?.fullName || ''}
              src={parentMessage.author?.avatarUrl}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[color:var(--color-ink)]">
                  {parentMessage.author?.fullName}
                </span>
                <span className="text-xs text-[color:var(--color-faint)]">
                  {format(new Date(parentMessage.createdAt), 'HH:mm dd/MM', { locale: vi })}
                </span>
              </div>
              <div className="mt-2 text-sm text-[color:var(--color-ink)] leading-relaxed">
                {parentMessage.content}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
            <div className="text-sm text-[color:var(--color-muted)]">
              {replies?.length || 0} phản hồi
            </div>
            <button
              type="button"
              onClick={handleSummarize}
              disabled={summarizeMutation.isPending || !replies?.length}
              className="btn btn-secondary"
            >
              {summarizeMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Đang tóm tắt…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={16} />
                  Tóm tắt bằng AI
                </span>
              )}
            </button>
          </div>

          {summary ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs font-medium text-emerald-800">Tóm tắt</div>
              <div className="mt-1 text-sm text-emerald-900/90 leading-relaxed">“{summary}”</div>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand-600" size={28} />
          </div>
        ) : (
          <div className="space-y-3">
            {replies?.map((reply) => (
              <div
                key={reply.id}
                className="rounded-lg border border-surface-border bg-surface-card p-4"
              >
                <div className="flex gap-3">
                  <AssigneeAvatar
                    name={reply.author?.fullName || ''}
                    src={reply.author?.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-[color:var(--color-ink)]">
                        {reply.author?.fullName}
                      </span>
                      <span className="text-xs text-[color:var(--color-faint)]">
                        {format(new Date(reply.createdAt), 'HH:mm', { locale: vi })}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-[color:var(--color-muted)] leading-relaxed">
                      {reply.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
