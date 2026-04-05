import type { User } from '../types/auth.types';
import type { ApiResponse } from '../types/common.types';

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export type AuthUserDTO = Pick<
  User,
  'id' | 'email' | 'fullName' | 'defaultWorkspaceId' | 'avatarColor' | 'avatarUrl'
>;

export interface UpdateProfileRequestDTO {
  fullName?: string;
  avatarUrl?: string | null;
}

export interface NotificationPreferenceDTO {
  id: string;
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  taskAssignedEmail: boolean;
  workspaceInviteEmail: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationPreferenceRequestDTO {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  taskAssignedEmail?: boolean;
  workspaceInviteEmail?: boolean;
}

export interface LoginDataDTO {
  accessToken: string;
  user: AuthUserDTO;
}

export type AuthResponseDTO = ApiResponse<LoginDataDTO>;

export interface MeDataDTO {
  user: AuthUserDTO;
}

export type MeResponseDTO = ApiResponse<MeDataDTO>;
