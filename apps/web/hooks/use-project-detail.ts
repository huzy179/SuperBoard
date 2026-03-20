import { useQuery } from '@tanstack/react-query';
import type { ProjectDetailDTO } from '@superboard/shared';
import { getProjectDetail } from '@/lib/services/project-service';

export function useProjectDetail(projectId: string) {
  return useQuery<ProjectDetailDTO>({
    queryKey: ['projects', projectId],
    queryFn: () => getProjectDetail(projectId),
    enabled: !!projectId,
  });
}
