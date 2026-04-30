'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, Clock, Mail, Search, ShieldAlert, Trash2, UserPlus } from 'lucide-react';
import { WorkspaceInvitationItemDTO } from '@superboard/shared';
import { AssigneeAvatar } from '@/features/operations/task/components/task-badges';
import {
  useWorkspaceMembers,
  useUpdateMemberRole,
  useWorkspaceInvitations,
  useRevokeInvitation,
  useRemoveMember,
  useTransferOwnership,
} from '@/features/system/workspace/hooks';
import { formatDate } from '@/lib/format-date';
import { ROLE_OPTIONS } from '@/lib/constants/task';
import { InviteMemberModal } from './InviteMemberModal';

interface WorkspaceMemberSettingsProps {
  workspaceId: string;
  currentUserId: string;
}

const ROLE_BADGE_CLASSES: Record<string, string> = {
  owner: 'bg-purple-50 text-purple-800 border-purple-200',
  admin: 'bg-brand-50 text-brand-700 border-brand-200',
  member: 'bg-black/[0.02] text-[color:var(--color-muted)] border-surface-border',
};

export function WorkspaceMemberSettings({
  workspaceId,
  currentUserId,
}: WorkspaceMemberSettingsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'admin' | 'member'>('all');
  const [sortByJoinDate, setSortByJoinDate] = useState<'desc' | 'asc'>('desc');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { data: members, isLoading } = useWorkspaceMembers(workspaceId);
  const { data: invitations } = useWorkspaceInvitations(workspaceId);

  const updateRole = useUpdateMemberRole(workspaceId);
  const revokeInvitation = useRevokeInvitation(workspaceId);
  const removeMember = useRemoveMember(workspaceId);
  const transferOwnership = useTransferOwnership(workspaceId);

  const currentMember = members?.find((m) => m.userId === currentUserId);
  const isAdmin = currentMember?.role === 'admin';
  const isOwner = currentMember?.role === 'owner';
  const canManage = isOwner || isAdmin;

  const filteredMembers = useMemo(() => {
    const list = (members ?? []).filter((m) => {
      const matchRole = roleFilter === 'all' || m.role === roleFilter;
      const matchSearch =
        !searchQuery ||
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRole && matchSearch;
    });

    return list.sort((a, b) => {
      const aTime = new Date(a.joinedAt).getTime();
      const bTime = new Date(b.joinedAt).getTime();
      return sortByJoinDate === 'desc' ? bTime - aTime : aTime - bTime;
    });
  }, [members, roleFilter, searchQuery, sortByJoinDate]);

  if (isLoading) {
    return (
      <div className="p-10 text-center text-sm text-[color:var(--color-muted)]">
        Đang tải danh sách thành viên…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[color:var(--color-ink)] tracking-tight">
            Đội ngũ thành viên
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
            Quản lý quyền truy cập và vai trò của mọi người trong Workspace.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="btn btn-primary"
          >
            <UserPlus size={16} />
            Mời thành viên
          </button>
        ) : null}
      </header>

      <section className="rounded-xl border border-surface-border bg-[color:var(--color-surface-alt)]/35 p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)]"
              size={16}
            />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as 'all' | 'owner' | 'admin' | 'member')
              }
              className="form-select w-[180px]"
              aria-label="Lọc theo vai trò"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>

            <button
              type="button"
              onClick={() => setSortByJoinDate((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="btn btn-secondary px-3"
              title="Đổi thứ tự ngày gia nhập"
            >
              <ArrowUpDown size={16} />
              {sortByJoinDate === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface-card elite-scrollbar">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-black/[0.02] border-b border-surface-border">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-[color:var(--color-muted)]">
                  Thành viên
                </th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-[color:var(--color-muted)]">
                  Vai trò
                </th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-[color:var(--color-muted)]">
                  Ngày gia nhập
                </th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-[color:var(--color-muted)] text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => (
                <tr
                  key={m.id}
                  className="group border-b border-surface-border last:border-b-0 hover:bg-black/[0.02] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-4">
                      <AssigneeAvatar name={m.fullName} color={m.avatarColor} size="lg" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[color:var(--color-ink)] truncate">
                          {m.fullName}
                        </p>
                        <p className="mt-0.5 text-xs text-[color:var(--color-muted)] truncate">
                          {m.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 sm:px-6 py-4">
                    {canManage && m.role !== 'owner' && m.userId !== currentUserId ? (
                      <select
                        value={m.role}
                        onChange={(e) =>
                          updateRole.mutate({ memberId: m.id, role: e.target.value })
                        }
                        disabled={updateRole.isPending}
                        className="form-select w-[160px]"
                        aria-label={`Đổi vai trò cho ${m.fullName}`}
                      >
                        {ROLE_OPTIONS.filter((r) => r.key !== 'owner').map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE_CLASSES[m.role]}`}
                      >
                        {m.role}
                      </span>
                    )}
                  </td>

                  <td className="px-4 sm:px-6 py-4 text-sm text-[color:var(--color-muted)]">
                    {formatDate(m.joinedAt)}
                  </td>

                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {isOwner && m.role !== 'owner' ? (
                        <button
                          type="button"
                          onClick={() =>
                            confirm(`Chuyển quyền sở hữu cho ${m.fullName}?`) &&
                            transferOwnership.mutate(m.id)
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-amber-700 hover:bg-amber-50 hover:border-amber-200 transition-colors"
                          title="Chuyển quyền sở hữu"
                        >
                          <ShieldAlert size={16} />
                        </button>
                      ) : null}

                      {m.userId !== currentUserId && m.role !== 'owner' ? (
                        <button
                          type="button"
                          onClick={() =>
                            confirm(`Xóa ${m.fullName} khỏi workspace?`) &&
                            removeMember.mutate(m.id)
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                          title="Xóa thành viên"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMembers.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Search className="mx-auto text-[color:var(--color-faint)]" size={36} />
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                Không tìm thấy thành viên
              </p>
              <p className="text-sm text-[color:var(--color-muted)]">
                Hãy thử đổi bộ lọc hoặc từ khóa.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {canManage && (invitations?.length ?? 0) > 0 ? (
        <section className="space-y-4 pt-6 border-t border-surface-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-brand-50 text-brand-700 border border-brand-200 rounded-md flex items-center justify-center text-xs font-semibold">
                {invitations?.length}
              </div>
              <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">
                Lời mời đang chờ
              </h3>
            </div>
            <p className="text-sm text-[color:var(--color-muted)]">
              Bạn có thể thu hồi lời mời bất cứ lúc nào.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations?.map((inv: WorkspaceInvitationItemDTO) => (
              <div
                key={inv.id}
                className="bg-surface-card border border-surface-border p-4 rounded-xl group flex items-center justify-between gap-4 shadow-glass"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-black/[0.02] text-[color:var(--color-muted)] rounded-md flex items-center justify-center border border-surface-border shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[color:var(--color-ink)] leading-none mb-1 text-sm truncate">
                      {inv.email}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-muted)]">
                      <span className="inline-flex items-center rounded-full border border-brand-500/20 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        {inv.role}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {formatDate(inv.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    confirm(`Thu hồi lời mời cho ${inv.email}?`) && revokeInvitation.mutate(inv.id)
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-rose-700 hover:bg-rose-50 hover:border-rose-200 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Thu hồi lời mời"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {isInviteModalOpen ? (
        <InviteMemberModal workspaceId={workspaceId} onClose={() => setIsInviteModalOpen(false)} />
      ) : null}
    </div>
  );
}
