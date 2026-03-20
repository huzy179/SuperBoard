import type {
  CreateProjectRequestDTO,
  CreateTaskRequestDTO,
  DashboardStatsDTO,
  ProjectDetailDTO,
  ProjectItemDTO,
  ProjectTaskItemDTO,
  UpdateProjectRequestDTO,
  UpdateTaskRequestDTO,
  UpdateTaskStatusRequestDTO,
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

export async function deleteProject(projectId: string): Promise<void> {
  return apiRequest<void>(API_ENDPOINTS.projects.delete(projectId), {
    auth: true,
    method: 'DELETE',
  });
}

export async function getProjectDetail(projectId: string): Promise<ProjectDetailDTO> {
  return apiGet<ProjectDetailDTO>(API_ENDPOINTS.projects.detail(projectId), { auth: true });
}

export async function createProjectTask(
  projectId: string,
  payload: CreateTaskRequestDTO,
): Promise<ProjectTaskItemDTO> {
  return apiPost<ProjectTaskItemDTO>(API_ENDPOINTS.projects.createTask(projectId), payload, {
    auth: true,
  });
}

export async function updateProjectTaskStatus(
  projectId: string,
  taskId: string,
  payload: UpdateTaskStatusRequestDTO,
): Promise<ProjectTaskItemDTO> {
  return apiRequest<ProjectTaskItemDTO>(
    API_ENDPOINTS.projects.updateTaskStatus(projectId, taskId),
    {
      auth: true,
      method: 'PATCH',
      body: payload,
    },
  );
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  payload: UpdateTaskRequestDTO,
): Promise<ProjectTaskItemDTO> {
  return apiRequest<ProjectTaskItemDTO>(API_ENDPOINTS.projects.updateTask(projectId, taskId), {
    auth: true,
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteProjectTask(projectId: string, taskId: string): Promise<void> {
  return apiRequest<void>(API_ENDPOINTS.projects.deleteTask(projectId, taskId), {
    auth: true,
    method: 'DELETE',
  });
}

export async function getDashboardStats(): Promise<DashboardStatsDTO> {
  return apiGet<DashboardStatsDTO>(API_ENDPOINTS.projects.dashboard, { auth: true });
}
