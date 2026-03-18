import type { User } from '../types/auth.types';
import type { ApiResponse } from '../types/common.types';

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export type AuthUserDTO = Pick<User, 'id' | 'email' | 'fullName' | 'defaultWorkspaceId'>;

export interface LoginDataDTO {
  accessToken: string;
  user: AuthUserDTO;
}

export type AuthResponseDTO = ApiResponse<LoginDataDTO>;

export interface MeDataDTO {
  user: AuthUserDTO;
}

export type MeResponseDTO = ApiResponse<MeDataDTO>;
