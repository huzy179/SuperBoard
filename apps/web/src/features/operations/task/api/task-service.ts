import type {
  BulkTaskOperationRequestDTO,
  BulkTaskOperationResultDTO,
  CreateTaskRequestDTO,
  ProjectTaskItemDTO,
  TaskHistoryItemDTO,
  UpdateTaskRequestDTO,
  UpdateTaskStatusRequestDTO,
  WorkflowStatusDTO,
} from '@superboard/shared';
import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const createProjectTask = (projectId: string, payload: CreateTaskRequestDTO) =>
  authApi.post<ProjectTaskItemDTO>(API_ENDPOINTS.projects.createTask(projectId), payload);

export const updateProjectTaskStatus = (
  projectId: string,
  taskId: string,
  payload: UpdateTaskStatusRequestDTO,
) =>
  authApi.patch<ProjectTaskItemDTO>(
    API_ENDPOINTS.projects.updateTaskStatus(projectId, taskId),
    payload,
  );

export const updateProjectTask = (
  projectId: string,
  taskId: string,
  payload: UpdateTaskRequestDTO,
) =>
  authApi.patch<ProjectTaskItemDTO>(API_ENDPOINTS.projects.updateTask(projectId, taskId), payload);

export const bulkProjectTaskOperation = (projectId: string, payload: BulkTaskOperationRequestDTO) =>
  authApi.patch<BulkTaskOperationResultDTO>(API_ENDPOINTS.projects.bulkTask(projectId), payload);

export const deleteProjectTask = (projectId: string, taskId: string) =>
  authApi.delete<void>(API_ENDPOINTS.projects.deleteTask(projectId, taskId));

export const getTaskHistory = (projectId: string, taskId: string) =>
  authApi.get<TaskHistoryItemDTO[]>(API_ENDPOINTS.projects.taskHistory(projectId, taskId));

export const archiveTask = (taskId: string) =>
  authApi.patch<void>(API_ENDPOINTS.projects.archiveTask(taskId));

export const restoreTask = (taskId: string) =>
  authApi.patch<void>(API_ENDPOINTS.projects.restoreTask(taskId));

export const getProjectStatuses = (projectId: string) =>
  authApi.get<WorkflowStatusDTO[]>(API_ENDPOINTS.workflow.projectStatuses(projectId));

export const summarizeProjectTask = (taskId: string) =>
  authApi.post<{ summary: string }>(API_ENDPOINTS.projects.summarizeTask(taskId));

export const aiDecomposeTask = (taskId: string) =>
  authApi.post<{ subtasks: string[] }>(API_ENDPOINTS.projects.aiDecompose(taskId));

export const aiRefineTask = (taskId: string) =>
  authApi.post<{ description: string; storyPoints: number | null }>(
    API_ENDPOINTS.projects.aiRefine(taskId),
  );

export const getTaskIntelligence = (taskId: string) =>
  authApi.get<{
    suggestions: { labels: string[]; priority: string | null };
    duplicates: { id: string; title: string; score: number }[];
  }>(API_ENDPOINTS.projects.aiIntelligence(taskId));
