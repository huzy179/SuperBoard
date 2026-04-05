import type {
  WorkspaceMemberItemDTO,
  WorkspaceInvitationItemDTO,
  InvitationDetailDTO,
  WorkspaceItemDTO,
} from '@superboard/shared';
import { apiGet, apiRequest, apiPost, apiDelete } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberItemDTO[]> {
  return apiGet<WorkspaceMemberItemDTO[]>(API_ENDPOINTS.workspaces.members(workspaceId), {
    auth: true,
  });
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  role: string,
): Promise<void> {
  await apiRequest(API_ENDPOINTS.workspaces.updateMember(workspaceId, memberId), {
    auth: true,
    method: 'PATCH',
    body: { role },
  });
}

export async function getWorkspaceInvitations(
  workspaceId: string,
): Promise<WorkspaceInvitationItemDTO[]> {
  return apiGet<WorkspaceInvitationItemDTO[]>(API_ENDPOINTS.workspaces.invitations(workspaceId), {
    auth: true,
  });
}

export async function createWorkspaceInvitation(
  workspaceId: string,
  input: { email: string; role: string; expiresInHours?: number },
): Promise<{ token: string; email: string; role: string; expiresAt: string }> {
  return apiPost<{ token: string; email: string; role: string; expiresAt: string }>(
    API_ENDPOINTS.workspaces.createInvitation(workspaceId),
    input,
    { auth: true },
  );
}

export async function revokeWorkspaceInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<void> {
  await apiDelete(API_ENDPOINTS.workspaces.revokeInvitation(workspaceId, invitationId), {
    auth: true,
  });
}

export async function getInvitationByToken(token: string): Promise<InvitationDetailDTO> {
  return apiGet<InvitationDetailDTO>(API_ENDPOINTS.workspaces.getInvitation(token), {
    auth: false,
  });
}

export async function acceptWorkspaceInvitation(token: string): Promise<void> {
  await apiPost(API_ENDPOINTS.workspaces.acceptInvitation(token), undefined, { auth: true });
}

export async function removeMemberFromWorkspace(
  workspaceId: string,
  memberId: string,
): Promise<void> {
  await apiDelete(API_ENDPOINTS.workspaces.removeMember(workspaceId, memberId), { auth: true });
}

export async function leaveWorkspace(workspaceId: string): Promise<void> {
  await apiDelete(API_ENDPOINTS.workspaces.leaveWorkspace(workspaceId), { auth: true });
}

export async function transferWorkspaceOwnership(
  workspaceId: string,
  memberId: string,
): Promise<void> {
  await apiPost(API_ENDPOINTS.workspaces.transferOwnership(workspaceId, memberId), undefined, {
    auth: true,
  });
}

export async function getWorkspaceDetails(workspaceId: string): Promise<WorkspaceItemDTO> {
  return apiGet<WorkspaceItemDTO>(API_ENDPOINTS.workspaces.detail(workspaceId), { auth: true });
}

export async function updateWorkspaceDetails(
  workspaceId: string,
  data: { name?: string; slug?: string },
): Promise<WorkspaceItemDTO> {
  return apiRequest<WorkspaceItemDTO>(API_ENDPOINTS.workspaces.update(workspaceId), {
    auth: true,
    method: 'PATCH',
    body: data,
  });
}
