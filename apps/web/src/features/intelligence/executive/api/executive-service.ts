import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export type NavigationFocusResponse = {
  highlights: Record<string, unknown>[];
};

export type ExecutiveProjectBriefing = {
  healthScore: number;
  executiveBrief: string;
  forecast: {
    projectId: string;
    velocityPerDay: number;
    atRiskCount: number;
    predictions: {
      taskId: string;
      title: string;
      status: string;
      estimatedCompletionDate: string;
      isAtRisk: boolean;
      confidence: number;
    }[];
  };
};

export type DailyBriefing = {
  pulse: string;
  commandIntent: string[];
  highlights: string[];
};

export type ProjectMemoir = {
  id: string;
  title: string;
  content: string;
  persona: string;
  createdAt: string;
};

export const getNavigationFocus = () =>
  authApi.get<NavigationFocusResponse>(API_ENDPOINTS.executive.navigationFocus);

export const getAdaptiveLayout = () => authApi.get<unknown>(API_ENDPOINTS.executive.adaptiveLayout);

export const getDailyBriefing = (workspaceId: string) =>
  authApi.get<DailyBriefing>(API_ENDPOINTS.executive.dailyBriefing, {
    params: { workspaceId },
  });

export const getExecutiveProjectBriefing = (projectId: string) =>
  authApi.get<ExecutiveProjectBriefing>(API_ENDPOINTS.executive.projectBriefing(projectId));

export const simulateExecutiveProject = (projectId: string, payload: { velocityBoost: number }) =>
  authApi.post<{ forecast: ExecutiveProjectBriefing['forecast'] }>(
    API_ENDPOINTS.executive.projectSimulation(projectId),
    payload,
  );

export const getProjectMemoirs = (projectId: string) =>
  authApi.get<ProjectMemoir[]>(API_ENDPOINTS.executive.projectMemoirs(projectId));

export const generateProjectMemoir = (projectId: string, persona: string) =>
  authApi.post<ProjectMemoir>(API_ENDPOINTS.executive.projectMemoir(projectId), { persona });
