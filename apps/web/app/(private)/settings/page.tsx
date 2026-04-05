'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import { AssigneeAvatar } from '@/components/jira/task-badges';
import { useAuthSession } from '@/hooks/auth';
import {
  useWorkspaceMembers,
  useUpdateMemberRole,
  useWorkspaceInvitations,
  useRevokeInvitation,
  useRemoveMember,
  useLeaveWorkspace,
  useTransferOwnership,
  useWorkspace,
  useUpdateWorkspace,
} from '@/hooks/workspace';
import { WorkspaceInvitationItemDTO } from '@superboard/shared';
import { InviteMemberModal } from '@/components/workspace/InviteMemberModal';
import { formatDate } from '@/lib/format-date';
import { ROLE_OPTIONS } from '@/lib/constants/task';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthSession();
  const workspaceId = user?.defaultWorkspaceId;
  const {
    data: members,
    isLoading,
    isError,
    error,
  } = useWorkspaceMembers(workspaceId ?? undefined);
  const updateRole = useUpdateMemberRole(workspaceId ?? undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'admin' | 'member'>('all');
  const [sortByJoinDate, setSortByJoinDate] = useState<'desc' | 'asc'>('desc');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { data: invitations } = useWorkspaceInvitations(workspaceId ?? undefined);
  const revokeInvitation = useRevokeInvitation(workspaceId ?? undefined);
  const removeMember = useRemoveMember(workspaceId ?? undefined);
  const leaveWorkspace = useLeaveWorkspace(workspaceId ?? undefined);
  const transferOwnership = useTransferOwnership(workspaceId ?? undefined);

  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace(workspaceId ?? undefined);
  const updateWorkspace = useUpdateWorkspace(workspaceId ?? undefined);

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');

  if (isLoading || isWorkspaceLoading) return <FullPageLoader label="Đang tải cài đặt..." />;
  if (isError) {
    return (
      <FullPageError
        title="Không thể tải cài đặt"
        message={error?.message ?? 'Lỗi không xác định'}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
      />
    );
  }

  /* PLACEHOLDER_RENDER */

  // Find current user's role
  const currentMember = members?.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'admin';
  const isOwner = currentMember?.role === 'owner';
  const canChangeRoles = isOwner || isAdmin;

  const ROLE_BADGE_COLORS: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    member: 'bg-slate-100 text-slate-600',
  };

  const filteredMembers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const list = (members ?? []).filter((member) => {
      const matchedRole = roleFilter === 'all' ? true : member.role === roleFilter;
      if (!matchedRole) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        member.fullName.toLowerCase().includes(normalizedQuery) ||
        member.email.toLowerCase().includes(normalizedQuery)
      );
    });

    return list.sort((a, b) => {
      const aTime = new Date(a.joinedAt).getTime();
      const bTime = new Date(b.joinedAt).getTime();
      return sortByJoinDate === 'desc' ? bTime - aTime : aTime - bTime;
    });
  }, [members, roleFilter, searchQuery, sortByJoinDate]);

  return (
    <section className="animate-fade-in pb-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt Workspace</h1>
        {canChangeRoles && (
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-100 transition-all hover:bg-brand-700 active:scale-95"
          >
            + Mời thành viên
          </button>
        )}
      </div>

      {/* Workspace info */}
      <div className="mb-6 overflow-hidden rounded-xl border border-surface-border bg-surface-card">
        <div className="flex items-center justify-between bg-linear-to-r from-brand-50 to-purple-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h2 className="text-sm font-semibold text-slate-900">Thông tin workspace</h2>
          </div>
          {canChangeRoles && !isEditingInfo && (
            <button
              type="button"
              onClick={() => {
                setEditName(workspace?.name || '');
                setEditSlug(workspace?.slug || '');
                setIsEditingInfo(true);
              }}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              Chỉnh sửa
            </button>
          )}
        </div>
        <div className="p-5">
          {isEditingInfo ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateWorkspace.mutate(
                  { name: editName, slug: editSlug },
                  {
                    onSuccess: () => setIsEditingInfo(false),
                  },
                );
              }}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-1.5">
                <label htmlFor="ws-name" className="text-xs font-medium text-slate-500">
                  Tên Workspace
                </label>
                <input
                  id="ws-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ws-slug" className="text-xs font-medium text-slate-500">
                  Đường dẫn (Slug)
                </label>
                <input
                  id="ws-slug"
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <button
                  type="submit"
                  disabled={updateWorkspace.isPending}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  {updateWorkspace.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Tên</p>
                <p className="text-sm font-medium text-slate-900">{workspace?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Đường dẫn (Slug)</p>
                <p className="text-sm font-medium text-slate-900">
                  {workspace?.slug ? `/${workspace.slug}` : '—'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">Vai trò của bạn</p>
                <span
                  className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE_COLORS[currentMember?.role ?? 'member']}`}
                >
                  {currentMember?.role ?? '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Members table */}
      <div className="rounded-xl border border-surface-border bg-surface-card">
        <div className="border-b border-surface-border px-5 py-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Thành viên ({filteredMembers.length}/{members?.length ?? 0})
            </h2>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setSortByJoinDate('desc');
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Đặt lại bộ lọc
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 sm:w-64"
              aria-label="Tìm thành viên"
            />

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as 'all' | 'owner' | 'admin' | 'member')
              }
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
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
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {sortByJoinDate === 'desc' ? 'Mới tham gia trước' : 'Tham gia lâu trước'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-border text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Thành viên</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Vai trò</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Ngày tham gia</th>
                {canChangeRoles && (
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border bg-white">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AssigneeAvatar name={m.fullName} color={m.avatarColor} />
                      <span className="font-medium text-slate-900">{m.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.email}</td>
                  <td className="px-4 py-3">
                    {canChangeRoles && m.role !== 'owner' ? (
                      <select
                        value={m.role}
                        onChange={(e) =>
                          updateRole.mutate({ memberId: m.id, role: e.target.value })
                        }
                        disabled={updateRole.isPending}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                      >
                        {ROLE_OPTIONS.filter((r) => r.key !== 'owner').map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE_COLORS[m.role] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {m.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(m.joinedAt)}</td>
                  {canChangeRoles && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isOwner && m.role !== 'owner' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(
                                  `Bạn có chắc muốn chuyển quyền Chủ sở hữu cho ${m.fullName}? Bạn sẽ trở thành Admin.`,
                                )
                              ) {
                                transferOwnership.mutate(m.id);
                              }
                            }}
                            disabled={transferOwnership.isPending}
                            className="text-xs font-bold text-amber-600 hover:underline"
                          >
                            Chuyển Chủ sở hữu
                          </button>
                        )}
                        {m.userId !== user?.id && m.role !== 'owner' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa ${m.fullName} khỏi workspace?`)) {
                                removeMember.mutate(m.id);
                              }
                            }}
                            disabled={removeMember.isPending}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMembers.length === 0 ? (
            <div className="border-t border-surface-border px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                Không tìm thấy thành viên phù hợp
              </p>
              <p className="mt-1 text-xs text-slate-500">Hãy thử đổi từ khoá hoặc bộ lọc vai trò</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Danger Zone */}
      {!isOwner && (
        <div className="mt-10 overflow-hidden rounded-xl border border-red-200 bg-red-50/30">
          <div className="border-b border-red-100 bg-red-100/50 px-5 py-3">
            <h2 className="text-sm font-semibold text-red-900 flex items-center gap-2">
              <span className="text-lg">⚠️</span> Khu vực nguy hiểm
            </h2>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Rời khỏi workspace</p>
              <p className="text-xs text-slate-600 mt-1">
                Bạn sẽ mất quyền truy cập vào tất cả các dự án trong workspace này.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Bạn có chắc muốn rời khỏi workspace này không?')) {
                  leaveWorkspace.mutate(undefined, {
                    onSuccess: () => {
                      router.push('/');
                    },
                  });
                }
              }}
              disabled={leaveWorkspace.isPending}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50"
            >
              Rời Workspace
            </button>
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {canChangeRoles && (invitations?.length ?? 0) > 0 && (
        <div className="mt-10 animate-fade-in overflow-hidden rounded-xl border border-surface-border bg-surface-card">
          <div className="border-b border-surface-border bg-slate-50/50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Lời mời đang chờ ({invitations?.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-border text-sm">
              <tbody className="divide-y divide-surface-border bg-white">
                {invitations?.map((inv: WorkspaceInvitationItemDTO) => (
                  <tr key={inv.id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">{inv.email}</td>
                    <td className="px-5 py-4">
                      <span className="rounded bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {inv.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      Mời bởi {inv.inviterName} · Hết hạn {formatDate(inv.expiresAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn thu hồi lời mời cho ${inv.email}?`)) {
                            revokeInvitation.mutate(inv.id);
                          }
                        }}
                        disabled={revokeInvitation.isPending}
                        className="text-xs font-bold text-red-600 opacity-0 transition-opacity hover:underline group-hover:opacity-100 disabled:opacity-50"
                      >
                        Thu hồi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && workspaceId && (
        <InviteMemberModal workspaceId={workspaceId} onClose={() => setIsInviteModalOpen(false)} />
      )}
    </section>
  );
}
