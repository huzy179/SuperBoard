import { useAppMutation } from '@/lib/hooks/use-app-mutation';
import { useQuery } from '@tanstack/react-query';
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
} from '@/features/system/workspace/api/workspace-service';
import { InvitationDetailDTO, WorkspaceItemDTO } from '@superboard/shared';

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery<WorkspaceMemberItemDTO[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useUpdateMemberRole(workspaceId: string | undefined) {
  return useAppMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      updateMemberRole(workspaceId!, memberId, role),
    resource: 'Thành viên',
    action: 'update',
    invalidateKeys: [['workspace-members', workspaceId]],
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
  return useAppMutation({
    mutationFn: (input: { email: string; role: string; expiresInHours?: number }) =>
      createWorkspaceInvitation(workspaceId!, input),
    resource: 'Lời mời',
    action: 'create',
    invalidateKeys: [['workspace-invitations', workspaceId]],
  });
}

export function useRevokeInvitation(workspaceId: string | undefined) {
  return useAppMutation({
    mutationFn: (invitationId: string) => revokeWorkspaceInvitation(workspaceId!, invitationId),
    resource: 'Lời mời',
    action: 'archive',
    invalidateKeys: [['workspace-invitations', workspaceId]],
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
  return useAppMutation({
    mutationFn: (token: string) => acceptWorkspaceInvitation(token),
    resource: 'Workspace',
    action: 'sync',
    invalidateKeys: [['workspace-members'], ['workspaces']],
  });
}

export function useRemoveMember(workspaceId: string | undefined) {
  return useAppMutation({
    mutationFn: (memberId: string) => removeMemberFromWorkspace(workspaceId!, memberId),
    resource: 'Thành viên',
    action: 'delete',
    invalidateKeys: [['workspace-members', workspaceId]],
  });
}

export function useLeaveWorkspace(workspaceId: string | undefined) {
  return useAppMutation({
    mutationFn: () => leaveWorkspace(workspaceId!),
    resource: 'Workspace',
    action: 'sync',
    invalidateKeys: [['workspaces']],
  });
}

export function useTransferOwnership(workspaceId: string | undefined) {
  return useAppMutation({
    mutationFn: (memberId: string) => transferWorkspaceOwnership(workspaceId!, memberId),
    resource: 'Quyền sở hữu',
    action: 'update',
    invalidateKeys: [['workspace-members', workspaceId]],
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
  return useAppMutation({
    mutationFn: (data: { name?: string; slug?: string }) =>
      updateWorkspaceDetails(workspaceId!, data),
    resource: 'Workspace',
    action: 'update',
    invalidateKeys: [['workspace', workspaceId], ['workspaces']],
  });
}
