import type {
  CreateProjectRequestDTO,
  ProjectDetailDTO,
  ProjectItemDTO,
  UpdateProjectRequestDTO,
} from '@superboard/shared';
import { apiGet, apiPost, apiRequest } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export async function getProjects(): Promise<ProjectItemDTO[]> {
  return apiGet<ProjectItemDTO[]>(API_ENDPOINTS.projects.list, { auth: true });
}

export async function createProject(payload: CreateProjectRequestDTO): Promise<ProjectItemDTO> {
  return apiPost<ProjectItemDTO>(API_ENDPOINTS.projects.create, payload, { auth: true });
}

export async function updateProject(
  projectId: string,
  payload: UpdateProjectRequestDTO,
): Promise<ProjectItemDTO> {
  return apiRequest<ProjectItemDTO>(API_ENDPOINTS.projects.update(projectId), {
    auth: true,
    method: 'PATCH',
    body: payload,
  });
}

export async function archiveProject(projectId: string): Promise<void> {
  return apiRequest<void>(API_ENDPOINTS.projects.delete(projectId), {
    auth: true,
    method: 'DELETE',
  });
}

export async function restoreProject(projectId: string): Promise<void> {
  return apiRequest<void>(API_ENDPOINTS.projects.restore(projectId), {
    auth: true,
    method: 'PATCH',
  });
}

export async function getProjectDetail(
  projectId: string,
  showArchived = false,
): Promise<ProjectDetailDTO> {
  const query = showArchived ? `?showArchived=true` : '';
  return apiGet<ProjectDetailDTO>(`${API_ENDPOINTS.projects.detail(projectId)}${query}`, {
    auth: true,
  });
}
