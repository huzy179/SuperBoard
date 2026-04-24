import type {
  WorkspaceMemberItemDTO,
  WorkspaceInvitationItemDTO,
  InvitationDetailDTO,
  WorkspaceItemDTO,
} from '@superboard/shared';
import { api, authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const getWorkspaces = () => authApi.get<WorkspaceItemDTO[]>(API_ENDPOINTS.workspaces.list);

export const createWorkspace = (data: { name: string; slug?: string }) =>
  authApi.post<WorkspaceItemDTO>(API_ENDPOINTS.workspaces.list, data);

export const getWorkspaceMembers = (workspaceId: string) =>
  authApi.get<WorkspaceMemberItemDTO[]>(API_ENDPOINTS.workspaces.members(workspaceId));

export const updateMemberRole = (workspaceId: string, memberId: string, role: string) =>
  authApi.patch(API_ENDPOINTS.workspaces.updateMember(workspaceId, memberId), { role });

export const getWorkspaceInvitations = (workspaceId: string) =>
  authApi.get<WorkspaceInvitationItemDTO[]>(API_ENDPOINTS.workspaces.invitations(workspaceId));

export const createWorkspaceInvitation = (
  workspaceId: string,
  input: { email: string; role: string; expiresInHours?: number },
) =>
  authApi.post<{ token: string; email: string; role: string; expiresAt: string }>(
    API_ENDPOINTS.workspaces.createInvitation(workspaceId),
    input,
  );

export const revokeWorkspaceInvitation = (workspaceId: string, invitationId: string) =>
  authApi.delete(API_ENDPOINTS.workspaces.revokeInvitation(workspaceId, invitationId));

export const getInvitationByToken = (token: string) =>
  api.get<InvitationDetailDTO>(API_ENDPOINTS.workspaces.getInvitation(token));

export const acceptWorkspaceInvitation = (token: string) =>
  authApi.post(API_ENDPOINTS.workspaces.acceptInvitation(token));

export const removeMemberFromWorkspace = (workspaceId: string, memberId: string) =>
  authApi.delete(API_ENDPOINTS.workspaces.removeMember(workspaceId, memberId));

export const leaveWorkspace = (workspaceId: string) =>
  authApi.delete(API_ENDPOINTS.workspaces.leaveWorkspace(workspaceId));

export const transferWorkspaceOwnership = (workspaceId: string, memberId: string) =>
  authApi.post(API_ENDPOINTS.workspaces.transferOwnership(workspaceId, memberId));

export const getWorkspaceDetails = (workspaceId: string) =>
  authApi.get<WorkspaceItemDTO>(API_ENDPOINTS.workspaces.detail(workspaceId));

export const updateWorkspaceDetails = (
  workspaceId: string,
  data: { name?: string; slug?: string },
) => authApi.patch<WorkspaceItemDTO>(API_ENDPOINTS.workspaces.update(workspaceId), data);
