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
