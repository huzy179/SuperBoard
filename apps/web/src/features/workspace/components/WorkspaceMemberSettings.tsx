'use client';

import { useMemo, useState } from 'react';
import { Search, Filter, UserPlus, Trash2, ShieldAlert, Clock, Mail } from 'lucide-react';
import { AssigneeAvatar } from '@/features/jira/components/task-badges';
import {
  useWorkspaceMembers,
  useUpdateMemberRole,
  useWorkspaceInvitations,
  useRevokeInvitation,
  useRemoveMember,
  useTransferOwnership,
} from '@/features/workspace/hooks';
import { formatDate } from '@/lib/format-date';
import { ROLE_OPTIONS } from '@/lib/constants/task';
import { InviteMemberModal } from './InviteMemberModal';
import { WorkspaceInvitationItemDTO } from '@superboard/shared';

interface WorkspaceMemberSettingsProps {
  workspaceId: string;
  currentUserId: string;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-slate-100 text-slate-600',
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

  if (isLoading)
    return <div className="p-12 text-center text-slate-400">Đang tải danh sách thành viên...</div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Đội ngũ thành viên
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Quản lý quyền truy cập và vai trò của mọi người trong Workspace.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-slate-900/10"
          >
            <UserPlus size={18} />
            <span>Mời thành viên</span>
          </button>
        )}
      </div>

      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 ml-2" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'owner' | 'admin' | 'member')}
            className="bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none hover:border-slate-300 transition-all"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="owner">Chủ sở hữu</option>
            <option value="admin">Quản trị viên</option>
            <option value="member">Thành viên</option>
          </select>
        </div>

        <button
          onClick={() => setSortByJoinDate((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="px-6 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
        >
          {sortByJoinDate === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
        </button>
      </div>

      {/* Members Table */}
      <div className="premium-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Thành viên
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Vai trò
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Ngày tham gia
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredMembers.map((m) => (
              <tr key={m.id} className="group hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <AssigneeAvatar name={m.fullName} color={m.avatarColor} size="md" />
                    <div>
                      <p className="font-bold text-slate-900 leading-none mb-1">{m.fullName}</p>
                      <p className="text-xs text-slate-500 font-medium">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  {canManage && m.role !== 'owner' && m.userId !== currentUserId ? (
                    <select
                      value={m.role}
                      onChange={(e) => updateRole.mutate({ memberId: m.id, role: e.target.value })}
                      disabled={updateRole.isPending}
                      className="bg-transparent border-none text-sm font-bold text-brand-600 focus:ring-0 cursor-pointer hover:underline"
                    >
                      {ROLE_OPTIONS.filter((r) => r.key !== 'owner').map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ROLE_BADGE_COLORS[m.role]}`}
                    >
                      {m.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-5 text-sm font-medium text-slate-500">
                  {formatDate(m.joinedAt)}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isOwner && m.role !== 'owner' && (
                      <button
                        onClick={() =>
                          confirm(`Chuyển quyền sở hữu cho ${m.fullName}?`) &&
                          transferOwnership.mutate(m.id)
                        }
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        title="Chuyển quyền sở hữu"
                      >
                        <ShieldAlert size={18} />
                      </button>
                    )}
                    {m.userId !== currentUserId && m.role !== 'owner' && (
                      <button
                        onClick={() =>
                          confirm(`Xóa ${m.fullName} khỏi workspace?`) && removeMember.mutate(m.id)
                        }
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Xóa thành viên"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMembers.length === 0 && (
          <div className="p-20 text-center space-y-2">
            <Search className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="font-black text-slate-900 uppercase tracking-tight">
              Không tìm thấy thành viên
            </p>
            <p className="text-sm text-slate-500 font-medium">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
            </p>
          </div>
        )}
      </div>

      {/* Pending Invitations Section */}
      {canManage && (invitations?.length ?? 0) > 0 && (
        <div className="space-y-6 pt-10 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center font-bold text-sm">
              {invitations?.length}
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Lời mời đang chờ
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations?.map((inv: WorkspaceInvitationItemDTO) => (
              <div
                key={inv.id}
                className="premium-card p-5 group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-none mb-1">{inv.email}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>{inv.role}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {formatDate(inv.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    confirm(`Thu hồi lời mời cho ${inv.email}?`) && revokeInvitation.mutate(inv.id)
                  }
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-rose-100"
                  title="Thu hồi lời mời"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <InviteMemberModal workspaceId={workspaceId} onClose={() => setIsInviteModalOpen(false)} />
      )}
    </div>
  );
}
