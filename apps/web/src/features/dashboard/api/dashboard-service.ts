import type { DashboardStatsDTO } from '@superboard/shared';
import { ApiClientError, apiGet } from '@/lib/api-client';
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
