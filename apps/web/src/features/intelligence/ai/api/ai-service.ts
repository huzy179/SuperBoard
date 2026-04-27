import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export type AiSuggestedTask = {
  title: string;
  priority: 'high' | 'medium' | 'low';
  storyPoints: number;
};

export const getWorkspaceDigest = (workspaceId: string) =>
  authApi.get<{ digest: string }>(API_ENDPOINTS.ai.workspaceDigest(workspaceId));

export const getAiProjectBriefing = (projectId: string) =>
  authApi.get<{ briefing: string }>(API_ENDPOINTS.ai.projectBriefing(projectId));

export const chatWithProjectAi = (projectId: string, message: string) =>
  authApi.post<{ response: string }>(API_ENDPOINTS.ai.projectChat(projectId), { message });

export const generateProjectPlan = (projectId: string, goal: string) =>
  authApi.post<{ suggestedTasks: AiSuggestedTask[] }>(API_ENDPOINTS.projects.plan(projectId), {
    goal,
  });
