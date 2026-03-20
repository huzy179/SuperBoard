import { useQuery } from '@tanstack/react-query';
import type { ProjectItemDTO } from '@superboard/shared';
import { getProjects } from '@/lib/services/project-service';

export function useProjects() {
  return useQuery<ProjectItemDTO[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });
}
