import type { WorkspaceMemberItemDTO } from '@superboard/shared';
import { apiGet, apiRequest } from '@/lib/api-client';
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
