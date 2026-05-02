'use client';

import { useMemo, useState } from 'react';
import { AppOverlay } from '@/components/ui/app-overlay';
import { FormInput } from '@/components/ui/form-controls';
import { useWorkspaceMembers } from '@/features/system/workspace/hooks/use-workspace';
import {
  useAddChannelMember,
  useChannelMembers,
} from '@/features/collaboration/chat/hooks/use-chat';
import { AppButton } from '@/components/ui/app-button';
import { UserPlus } from 'lucide-react';

export function ChatMembersOverlay({
  isOpen,
  onClose,
  workspaceId,
  channelId,
}: {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  channelId?: string;
}) {
  const channelQuery = useChannelMembers(channelId);
  const workspaceQuery = useWorkspaceMembers(workspaceId);
  const addMemberMutation = useAddChannelMember(workspaceId, channelId);
  const data = channelId ? channelQuery.data : workspaceQuery.data;
  const isLoading = channelId ? channelQuery.isLoading : workspaceQuery.isLoading;
  const isError = channelId ? channelQuery.isError : workspaceQuery.isError;
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'members' | 'add'>('members');

  const members = useMemo(() => {
    const list = data || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  }, [data, query]);

  const channelMemberIds = useMemo(() => {
    if (!channelId) return new Set<string>();
    return new Set((channelQuery.data || []).map((m) => m.userId));
  }, [channelId, channelQuery.data]);

  const addCandidates = useMemo(() => {
    if (!channelId) return [];
    const all = workspaceQuery.data || [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? all.filter((m) => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      : all;
    return filtered.filter((m) => !channelMemberIds.has(m.userId));
  }, [channelId, workspaceQuery.data, query, channelMemberIds]);

  return (
    <AppOverlay
      isOpen={isOpen}
      onClose={onClose}
      title={channelId ? 'Thành viên kênh' : 'Thành viên workspace'}
      subtitle={
        channelId
          ? 'Chỉ hiển thị những người đang có quyền truy cập kênh này.'
          : 'Danh sách toàn bộ thành viên trong workspace.'
      }
      variant="modal"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {channelId ? (
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex rounded-md border border-surface-border bg-white p-1">
              <button
                type="button"
                onClick={() => setMode('members')}
                className={`rounded-sm px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  mode === 'members'
                    ? 'bg-brand-500/[0.10] text-brand-700'
                    : 'text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
                }`}
              >
                Trong kênh
              </button>
              <button
                type="button"
                onClick={() => setMode('add')}
                className={`rounded-sm px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  mode === 'add'
                    ? 'bg-brand-500/[0.10] text-brand-700'
                    : 'text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
                }`}
              >
                Thêm người
              </button>
            </div>
            <AppButton
              variant="secondary"
              size="sm"
              onClick={() => setMode((m) => (m === 'members' ? 'add' : 'members'))}
              leftIcon={<UserPlus size={14} />}
            >
              {mode === 'members' ? 'Thêm' : 'Xem'}
            </AppButton>
          </div>
        ) : null}

        <FormInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === 'add' ? 'Tìm theo tên, email…' : 'Tìm theo tên, email, role…'}
        />

        {isLoading ? (
          <div className="text-sm text-[color:var(--color-muted)]">Đang tải…</div>
        ) : isError ? (
          <div className="text-sm text-rose-700">Không thể tải danh sách thành viên.</div>
        ) : (
          <div className="divide-y divide-surface-border rounded-sm border border-surface-border bg-white">
            {mode === 'add' && channelId
              ? addCandidates.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                        {m.fullName}
                      </div>
                      <div className="truncate text-xs text-[color:var(--color-muted)]">
                        {m.email}
                      </div>
                    </div>
                    <AppButton
                      variant="secondary"
                      size="sm"
                      isLoading={addMemberMutation.isPending}
                      disabled={addMemberMutation.isPending}
                      onClick={() =>
                        addMemberMutation.mutate(m.userId, { onSuccess: () => setMode('members') })
                      }
                    >
                      Thêm
                    </AppButton>
                  </div>
                ))
              : members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                        {m.fullName}
                      </div>
                      <div className="truncate text-xs text-[color:var(--color-muted)]">
                        {m.email}
                      </div>
                    </div>
                    {'role' in m ? (
                      <div className="shrink-0 rounded-sm border border-surface-border bg-surface-bg px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-muted)]">
                        {m.role}
                      </div>
                    ) : null}
                  </div>
                ))}
            {(mode === 'add' && channelId ? addCandidates.length === 0 : members.length === 0) ? (
              <div className="px-4 py-8 text-center text-sm text-[color:var(--color-muted)]">
                Không có kết quả.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AppOverlay>
  );
}
