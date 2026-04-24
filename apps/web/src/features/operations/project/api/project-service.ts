import type {
  CreateProjectRequestDTO,
  ProjectDetailDTO,
  ProjectItemDTO,
  UpdateProjectRequestDTO,
} from '@superboard/shared';
import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const getProjects = () => authApi.get<ProjectItemDTO[]>(API_ENDPOINTS.projects.list);

export const createProject = (payload: CreateProjectRequestDTO) =>
  authApi.post<ProjectItemDTO>(API_ENDPOINTS.projects.create, payload);

export const updateProject = (projectId: string, payload: UpdateProjectRequestDTO) =>
  authApi.patch<ProjectItemDTO>(API_ENDPOINTS.projects.update(projectId), payload);

export const archiveProject = (projectId: string) =>
  authApi.delete<void>(API_ENDPOINTS.projects.delete(projectId));

export const restoreProject = (projectId: string) =>
  authApi.patch<void>(API_ENDPOINTS.projects.restore(projectId));

export const getProjectDetail = (projectId: string, showArchived = false) => {
  const query = showArchived ? `?showArchived=true` : '';
  return authApi.get<ProjectDetailDTO>(`${API_ENDPOINTS.projects.detail(projectId)}${query}`);
};
