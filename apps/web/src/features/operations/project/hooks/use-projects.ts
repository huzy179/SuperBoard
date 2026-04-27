import type { ProjectItemDTO } from '@superboard/shared';
import { getProjects } from '@/features/operations/project/api/project-service';
import { subscribeProjectsListUpdated } from '@/lib/realtime/project-sync';
import { useAppQuery } from '@/lib/hooks/use-app-query';
import { useDeferredQueryInvalidation } from '@/lib/hooks/use-deferred-query-invalidation';
import { queryKeys } from '@/lib/query-keys';

const projectsQueryKey = queryKeys.projects.lists();

export function useProjects() {
  useDeferredQueryInvalidation({
    queryKey: projectsQueryKey,
    subscribe: subscribeProjectsListUpdated,
  });

  return useAppQuery<ProjectItemDTO[]>({
    queryKey: projectsQueryKey,
    queryFn: getProjects,
    errorMessage: 'Không thể tải danh sách dự án',
  });
}
