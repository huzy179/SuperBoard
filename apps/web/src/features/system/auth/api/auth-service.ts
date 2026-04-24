import type { AuthUserDTO, LoginDataDTO, LoginRequestDTO, MeDataDTO } from '@superboard/shared';
import { apiGet, apiPost } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export async function login(payload: LoginRequestDTO): Promise<LoginDataDTO> {
  return apiPost<LoginDataDTO>(API_ENDPOINTS.auth.login, payload, { auth: false });
}

export async function getCurrentUser(): Promise<AuthUserDTO> {
  const data = await apiGet<MeDataDTO>(API_ENDPOINTS.auth.me, { auth: true });
  return data.user;
}
