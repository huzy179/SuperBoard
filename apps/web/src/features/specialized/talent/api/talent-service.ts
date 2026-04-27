import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export type AssigneeSuggestion = {
  id: string;
  fullName: string;
  score: number;
  workload: number;
  skills: string[];
};

export const getTaskAssigneeSuggestions = (taskId: string, workspaceId: string) =>
  authApi.get<{ suggestions: AssigneeSuggestion[] }>(API_ENDPOINTS.talent.taskSuggestions(taskId), {
    params: { workspaceId },
  });
