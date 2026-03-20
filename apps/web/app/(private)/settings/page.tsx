'use client';

import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import { AssigneeAvatar } from '@/components/ui/task-badges';
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

  return (
    <section className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Cài đặt Workspace</h1>

      {/* Workspace info */}
      <div className="mb-6 overflow-hidden rounded-xl border border-surface-border bg-surface-card">
        <div className="bg-gradient-to-r from-brand-50 to-purple-50 px-5 py-4">
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
          <h2 className="text-sm font-semibold text-slate-900">
            Thành viên ({members?.length ?? 0})
          </h2>
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
              {(members ?? []).map((m) => (
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
        </div>
      </div>
    </section>
  );
}
