import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';

export interface PredictiveTask {
  taskId: string;
  title: string;
  status: string;
  estimatedCompletionDate: string;
  isAtRisk: boolean;
  confidence: number;
}

export interface PredictiveHealthResponse {
  projectId: string;
  velocityPerDay: number;
  predictions: PredictiveTask[];
  atRiskCount: number;
}

export function usePredictiveHealth(projectId: string | null) {
  return useQuery({
    queryKey: ['projects', projectId, 'predictive-health'],
    queryFn: () =>
      apiGet<PredictiveHealthResponse>(`/api/v1/projects/${projectId}/predictive-health`, {
        auth: true,
      }),
    enabled: !!projectId,
    staleTime: 60000, // 1 minute
  });
}
