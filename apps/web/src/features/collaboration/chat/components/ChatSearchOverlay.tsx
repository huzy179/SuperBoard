'use client';

import { useMemo, useState } from 'react';
import { AppOverlay } from '@/components/ui/app-overlay';
import { FormInput } from '@/components/ui/form-controls';
import { useMessages } from '@/features/collaboration/chat/hooks/use-chat';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function ChatSearchOverlay({
  isOpen,
  onClose,
  channelId,
}: {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
}) {
  const [query, setQuery] = useState('');
  const { messages, isLoading } = useMessages(channelId);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter((m) => {
        const author = m.author?.fullName?.toLowerCase() || '';
        return author.includes(q) || m.content.toLowerCase().includes(q);
      })
      .slice(-50)
      .reverse();
  }, [messages, query]);

  return (
    <AppOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Tìm tin nhắn"
      subtitle="Tìm nhanh trong các tin đã tải (POC: chưa có search server-side)."
      variant="modal"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <FormInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập từ khoá…"
          autoFocus
        />

        {isLoading ? (
          <div className="text-sm text-[color:var(--color-muted)]">Đang tải…</div>
        ) : query.trim() ? (
          <div className="divide-y divide-surface-border rounded-sm border border-surface-border bg-white">
            {results.map((m) => (
              <div key={m.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0 truncate text-sm font-semibold text-[color:var(--color-ink)]">
                    {m.author?.fullName || 'Member'}
                  </div>
                  <div className="shrink-0 text-[11px] font-medium text-[color:var(--color-faint)]">
                    {format(new Date(m.createdAt), 'dd/MM HH:mm', { locale: vi })}
                  </div>
                </div>
                <div className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-[color:var(--color-ink)]">
                  {m.content}
                </div>
              </div>
            ))}
            {results.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[color:var(--color-muted)]">
                Không tìm thấy kết quả trong các tin đã tải.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-[color:var(--color-muted)]">
            Nhập từ khoá để bắt đầu tìm kiếm.
          </div>
        )}
      </div>
    </AppOverlay>
  );
}
