import type { ApiResponse } from '../types/common.types';

export interface WorkspaceItemDTO {
  id: string;
  name: string;
  slug: string;
  plan: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberItemDTO {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarColor: string | null;
  role: string;
  joinedAt: string;
}

export type WorkspaceMembersResponseDTO = ApiResponse<WorkspaceMemberItemDTO[]>;

export interface WorkspaceInvitationItemDTO {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  inviterName: string;
}

export interface InvitationDetailDTO {
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
  email: string;
  role: string;
}
