import type {
  BulkTaskOperationRequestDTO,
  BulkTaskOperationResultDTO,
  CreateProjectRequestDTO,
  CreateTaskRequestDTO,
  DashboardStatsDTO,
  ProjectDetailDTO,
  ProjectItemDTO,
  ProjectTaskItemDTO,
  TaskHistoryItemDTO,
  UpdateProjectRequestDTO,
  UpdateTaskRequestDTO,
  UpdateTaskStatusRequestDTO,
} from '@superboard/shared';
import { ApiClientError, apiGet, apiPost, apiRequest } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { getMockDashboardStats } from '@/lib/mocks/dashboard-stats.mock';

function normalizeDashboardStats(payload: DashboardStatsDTO): DashboardStatsDTO {
  return {
    tasksByStatus: Array.isArray(payload.tasksByStatus) ? payload.tasksByStatus : [],
    tasksByPriority: Array.isArray(payload.tasksByPriority) ? payload.tasksByPriority : [],
    tasksByType: Array.isArray(payload.tasksByType) ? payload.tasksByType : [],
    tasksByAssignee: Array.isArray(payload.tasksByAssignee) ? payload.tasksByAssignee : [],
    tasksByProject: Array.isArray(payload.tasksByProject) ? payload.tasksByProject : [],
    overdueTasks: typeof payload.overdueTasks === 'number' ? payload.overdueTasks : 0,
    recentActivity: Array.isArray(payload.recentActivity) ? payload.recentActivity : [],
  };
}

function shouldUseMockFallback(error: unknown): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_API_MOCK_FALLBACK === 'false') {
    return false;
  }

  if (error instanceof ApiClientError) {
    return [404, 501, 502, 503].includes(error.status);
  }

  return error instanceof TypeError;
}

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

export async function getDashboardStats(): Promise<DashboardStatsDTO> {
  try {
    const response = await apiGet<DashboardStatsDTO>(API_ENDPOINTS.projects.dashboard, {
      auth: true,
    });
    return normalizeDashboardStats(response);
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return normalizeDashboardStats(getMockDashboardStats());
    }
    throw error;
  }
}

export async function getTaskHistory(
  projectId: string,
  taskId: string,
): Promise<TaskHistoryItemDTO[]> {
  return apiGet<TaskHistoryItemDTO[]>(API_ENDPOINTS.projects.taskHistory(projectId, taskId), {
    auth: true,
  });
}
