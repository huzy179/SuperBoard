import type {
  BulkTaskOperationRequestDTO,
  BulkTaskOperationResultDTO,
  CreateTaskRequestDTO,
  ProjectTaskItemDTO,
  TaskHistoryItemDTO,
  UpdateTaskRequestDTO,
  UpdateTaskStatusRequestDTO,
} from '@superboard/shared';
import { apiGet, apiPost, apiRequest } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

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

export async function bulkProjectTaskOperation(
  projectId: string,
  payload: BulkTaskOperationRequestDTO,
): Promise<BulkTaskOperationResultDTO> {
  return apiRequest<BulkTaskOperationResultDTO>(API_ENDPOINTS.projects.bulkTask(projectId), {
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

export async function getTaskHistory(
  projectId: string,
  taskId: string,
): Promise<TaskHistoryItemDTO[]> {
  return apiGet<TaskHistoryItemDTO[]>(API_ENDPOINTS.projects.taskHistory(projectId, taskId), {
    auth: true,
  });
}
