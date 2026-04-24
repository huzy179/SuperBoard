import type { AuthUserDTO, LoginDataDTO, LoginRequestDTO, MeDataDTO } from '@superboard/shared';
import { api, authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const login = (payload: LoginRequestDTO) =>
  api.post<LoginDataDTO>(API_ENDPOINTS.auth.login, payload);

export const getCurrentUser = async (): Promise<AuthUserDTO> => {
  const data = await authApi.get<MeDataDTO>(API_ENDPOINTS.auth.me);
  return data.user;
};
