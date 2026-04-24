'use client';

import { useMemo, useState } from 'react';
import { Search, Filter, UserPlus, Trash2, ShieldAlert, Clock, Mail } from 'lucide-react';
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
import { WorkspaceInvitationItemDTO } from '@superboard/shared';

interface WorkspaceMemberSettingsProps {
  workspaceId: string;
  currentUserId: string;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  owner: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  admin: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
  member: 'bg-white/5 text-white/40 border-white/10',
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
            className="flex items-center justify-center gap-2 bg-white text-slate-950 px-5 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-inner"
          >
            <UserPlus size={16} />
            <span>Mời_Thành_Viên</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-950 border border-white/10 rounded-md">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/5 rounded-sm text-sm font-bold text-white placeholder:text-white/10 outline-none transition-all focus:bg-white/[0.05] focus:border-brand-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-white/20 ml-2" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'owner' | 'admin' | 'member')}
            className="bg-white/[0.03] border border-white/10 rounded-sm px-3 py-2 text-[11px] font-bold text-white/60 outline-none hover:bg-white/[0.05] transition-all uppercase tracking-tight"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="owner">Chủ sở hữu</option>
            <option value="admin">Quản trị viên</option>
            <option value="member">Thành viên</option>
          </select>
        </div>

        <button
          onClick={() => setSortByJoinDate((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="px-4 py-2 bg-white/[0.03] border border-white/10 rounded-sm text-[11px] font-bold text-white/60 hover:bg-white/[0.05] transition-all uppercase tracking-tight"
        >
          {sortByJoinDate === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-slate-950/40 border border-white/10 rounded-md overflow-hidden shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/10">
              <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-white/20">
                THÀNH_VIÊN
              </th>
              <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-white/20">
                VAI_TRÒ
              </th>
              <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-white/20">
                NGÀY_GIA_NHẬP
              </th>
              <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-white/20 text-right">
                THAO_TÁC
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredMembers.map((m) => (
              <tr key={m.id} className="group hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <AssigneeAvatar name={m.fullName} color={m.avatarColor} size="sm" />
                    <div>
                      <p className="font-bold text-white leading-none mb-1 uppercase text-[12px] tracking-tight">
                        {m.fullName}
                      </p>
                      <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                        {m.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {canManage && m.role !== 'owner' && m.userId !== currentUserId ? (
                    <select
                      value={m.role}
                      onChange={(e) => updateRole.mutate({ memberId: m.id, role: e.target.value })}
                      disabled={updateRole.isPending}
                      className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-brand-400 focus:ring-0 cursor-pointer hover:text-brand-300"
                    >
                      {ROLE_OPTIONS.filter((r) => r.key !== 'owner').map((r) => (
                        <option key={r.key} value={r.key} className="bg-slate-950">
                          {r.label.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-xs text-[8px] font-bold uppercase tracking-widest border ${ROLE_BADGE_COLORS[m.role]}`}
                    >
                      {m.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  {formatDate(m.joinedAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isOwner && m.role !== 'owner' && (
                      <button
                        onClick={() =>
                          confirm(`Chuyển quyền sở hữu cho ${m.fullName}?`) &&
                          transferOwnership.mutate(m.id)
                        }
                        className="p-1.5 text-amber-500/50 hover:text-amber-400 hover:bg-white/5 rounded-xs transition-all"
                        title="Chuyển quyền sở hữu"
                      >
                        <ShieldAlert size={14} />
                      </button>
                    )}
                    {m.userId !== currentUserId && m.role !== 'owner' && (
                      <button
                        onClick={() =>
                          confirm(`Xóa ${m.fullName} khỏi workspace?`) && removeMember.mutate(m.id)
                        }
                        className="p-1.5 text-rose-500/50 hover:text-rose-400 hover:bg-white/5 rounded-xs transition-all"
                        title="Xóa thành viên"
                      >
                        <Trash2 size={14} />
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
            <Search className="mx-auto text-white/5 mb-4" size={40} />
            <p className="font-bold text-white uppercase tracking-tight text-[11px]">
              No_Members_Found_In_Sector
            </p>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
              Modify uplink filters or search query.
            </p>
          </div>
        )}
      </div>

      {/* Pending Invitations Section */}
      {canManage && (invitations?.length ?? 0) > 0 && (
        <div className="space-y-6 pt-10 border-t border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-sm flex items-center justify-center font-black text-[10px] shadow-inner">
              {invitations?.length}
            </div>
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
              PENDING_INVITATION_NODES
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations?.map((inv: WorkspaceInvitationItemDTO) => (
              <div
                key={inv.id}
                className="bg-slate-950/40 border border-white/10 p-4 rounded-md group flex items-center justify-between shadow-inner"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 text-white/10 rounded-sm flex items-center justify-center border border-white/5 group-hover:border-brand-500/20 group-hover:text-brand-400 transition-all">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white leading-none mb-1 uppercase text-[12px] tracking-tight">
                      {inv.email}
                    </h4>
                    <div className="flex items-center gap-2 text-[8px] font-bold text-white/20 uppercase tracking-widest">
                      <span className="text-brand-400/60">{inv.role}</span>
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
                  className="p-1.5 text-rose-500/50 hover:text-rose-400 hover:bg-white/5 rounded-xs opacity-0 group-hover:opacity-100 transition-all"
                  title="Thu hồi lời mời"
                >
                  <Trash2 size={14} />
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
