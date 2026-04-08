import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { WorkspaceMemberItemDTO, WorkspaceInvitationItemDTO } from '@superboard/shared';
import {
  getWorkspaceMembers,
  updateMemberRole,
  getWorkspaceInvitations,
  createWorkspaceInvitation,
  revokeWorkspaceInvitation,
  acceptWorkspaceInvitation,
  getInvitationByToken,
  removeMemberFromWorkspace,
  leaveWorkspace,
  transferWorkspaceOwnership,
  getWorkspaceDetails,
  updateWorkspaceDetails,
} from '@/features/workspace/api/workspace-service';
import { InvitationDetailDTO, WorkspaceItemDTO } from '@superboard/shared';

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery<WorkspaceMemberItemDTO[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useUpdateMemberRole(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      updateMemberRole(workspaceId!, memberId, role),
    onSuccess: () => {
      toast.success('Cập nhật vai trò thành công');
      void queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi cập nhật vai trò');
    },
  });
}

export function useWorkspaceInvitations(workspaceId: string | undefined) {
  return useQuery<WorkspaceInvitationItemDTO[]>({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: () => getWorkspaceInvitations(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useCreateInvitation(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: string; expiresInHours?: number }) =>
      createWorkspaceInvitation(workspaceId!, input),
    onSuccess: () => {
      toast.success('Gửi lời mời thành công');
      void queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi gửi lời mời');
    },
  });
}

export function useRevokeInvitation(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => revokeWorkspaceInvitation(workspaceId!, invitationId),
    onSuccess: () => {
      toast.success('Thu hồi lời mời thành công');
      void queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi thu hồi lời mời');
    },
  });
}

export function useInvitationByToken(token: string | undefined) {
  return useQuery<InvitationDetailDTO>({
    queryKey: ['workspace-invitation', token],
    queryFn: () => getInvitationByToken(token!),
    enabled: !!token,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => acceptWorkspaceInvitation(token),
    onSuccess: () => {
      toast.success('Tham gia workspace thành công!');
      void queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi tham gia workspace');
    },
  });
}

export function useRemoveMember(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeMemberFromWorkspace(workspaceId!, memberId),
    onSuccess: () => {
      toast.success('Xóa thành viên thành công');
      void queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi xóa thành viên');
    },
  });
}

export function useLeaveWorkspace(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveWorkspace(workspaceId!),
    onSuccess: () => {
      toast.success('Rời workspace thành công');
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi rời workspace');
    },
  });
}

export function useTransferOwnership(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => transferWorkspaceOwnership(workspaceId!, memberId),
    onSuccess: () => {
      toast.success('Chuyển quyền chủ sở hữu thành công');
      void queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi chuyển quyền');
    },
  });
}

export function useWorkspace(workspaceId: string | undefined) {
  return useQuery<WorkspaceItemDTO>({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspaceDetails(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useUpdateWorkspace(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; slug?: string }) =>
      updateWorkspaceDetails(workspaceId!, data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin workspace thành công');
      void queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi cập nhật workspace');
    },
  });
}
