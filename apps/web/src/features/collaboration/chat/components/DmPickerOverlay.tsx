'use client';

import { useMemo, useState } from 'react';
import { AppOverlay } from '@/components/ui/app-overlay';
import { FormInput } from '@/components/ui/form-controls';
import type { WorkspaceMemberItemDTO } from '@superboard/shared';

export function DmPickerOverlay({
  isOpen,
  onClose,
  members,
  onPick,
}: {
  isOpen: boolean;
  onClose: () => void;
  members: WorkspaceMemberItemDTO[];
  onPick: (userId: string) => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <AppOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Tin nhắn trực tiếp"
      subtitle="Chọn 1 người để bắt đầu chat."
      variant="modal"
      maxWidth="xl"
    >
      <div className="space-y-4">
        <FormInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc email…"
          autoFocus
        />

        <div className="max-h-[55vh] overflow-y-auto rounded-sm border border-surface-border bg-white">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onPick(m.userId);
                onClose();
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]/35"
            >
              <div className="h-7 w-7 shrink-0 rounded bg-black/[0.06] flex items-center justify-center text-[11px] font-bold text-[color:var(--color-muted)] uppercase">
                {m.fullName?.[0] || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                  {m.fullName}
                </div>
                <div className="truncate text-xs text-[color:var(--color-muted)]">{m.email}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[color:var(--color-muted)]">
              Không có kết quả.
            </div>
          ) : null}
        </div>
      </div>
    </AppOverlay>
  );
}
