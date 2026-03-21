import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectDetailDTO } from '@superboard/shared';
import { getProjectDetail } from '@/lib/services/project-service';
import { subscribeProjectDetailUpdated } from '@/lib/realtime/project-sync';

export function useProjectDetail(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) {
      return;
    }

    return subscribeProjectDetailUpdated(projectId, () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    });
  }, [projectId, queryClient]);

  return useQuery<ProjectDetailDTO>({
    queryKey: ['projects', projectId],
    queryFn: () => getProjectDetail(projectId),
    enabled: !!projectId,
  });
}
