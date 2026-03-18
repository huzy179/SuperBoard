import type { ProjectItemDTO } from '@superboard/shared';
import { apiGet } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export async function getProjects(): Promise<ProjectItemDTO[]> {
  return apiGet<ProjectItemDTO[]>(API_ENDPOINTS.projects.list, { auth: true });
}
