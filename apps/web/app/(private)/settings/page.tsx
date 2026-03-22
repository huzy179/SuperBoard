'use client';

import { useMemo, useState } from 'react';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import { AssigneeAvatar } from '@/components/jira/task-badges';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useWorkspaceMembers, useUpdateMemberRole } from '@/hooks/use-workspace';
import { formatDate } from '@/lib/format-date';
import { ROLE_OPTIONS } from '@/lib/constants/task';

export default function SettingsPage() {
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

  if (isLoading) return <FullPageLoader label="Đang tải cài đặt..." />;
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
  const canChangeRoles = currentMember?.role === 'owner' || currentMember?.role === 'admin';

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
    <section className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Cài đặt Workspace</h1>

      {/* Workspace info */}
      <div className="mb-6 overflow-hidden rounded-xl border border-surface-border bg-surface-card">
        <div className="bg-linear-to-r from-brand-50 to-purple-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h2 className="text-sm font-semibold text-slate-900">Thông tin workspace</h2>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Tên</p>
            <p className="text-sm font-medium text-slate-900">
              {user?.defaultWorkspaceId ? 'SuperBoard Workspace' : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Vai trò của bạn</p>
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE_COLORS[currentMember?.role ?? 'member']}`}
            >
              {currentMember?.role ?? '—'}
            </span>
          </div>
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 sm:w-64"
              aria-label="Tìm thành viên"
            />

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as 'all' | 'owner' | 'admin' | 'member')
              }
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700"
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
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
    </section>
  );
}
