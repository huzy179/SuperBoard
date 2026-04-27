import { useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProjectDetailDTO } from '@superboard/shared';
import { getProjectDetail } from '@/features/operations/project/api/project-service';
import { subscribeProjectDetailUpdated } from '@/lib/realtime/project-sync';
import {
  subscribeProjectSocketUpdated,
  subscribeProjectTaskPatched,
} from '@/lib/realtime/project-socket';
import { useAppQuery } from '@/lib/hooks/use-app-query';
import { useDeferredQueryInvalidation } from '@/lib/hooks/use-deferred-query-invalidation';
import { queryKeys } from '@/lib/query-keys';

export function useProjectDetail(projectId: string, showArchived = false) {
  const queryClient = useQueryClient();
  const detailQueryKey = useMemo(
    () => queryKeys.projects.detail(projectId, showArchived),
    [projectId, showArchived],
  );

  const subscribeToProjectUpdates = useCallback(
    (scheduleInvalidate: () => void) => {
      const unsubscribeBroadcast = subscribeProjectDetailUpdated(projectId, scheduleInvalidate);
      const unsubscribeSocket = subscribeProjectSocketUpdated(projectId, scheduleInvalidate);

      return () => {
        unsubscribeBroadcast();
        unsubscribeSocket();
      };
    },
    [projectId],
  );

  useDeferredQueryInvalidation({
    queryKey: detailQueryKey,
    subscribe: subscribeToProjectUpdates,
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const unsubscribeTaskPatched = subscribeProjectTaskPatched(projectId, (payload) => {
      queryClient.setQueryData<ProjectDetailDTO>(detailQueryKey, (current) => {
        if (!current) {
          return current;
        }

        const nextTasks = current.tasks.map((task) => {
          if (task.id !== payload.taskId) {
            return task;
          }

          return {
            ...task,
            status: payload.status as ProjectDetailDTO['tasks'][number]['status'],
            ...(payload.position !== undefined ? { position: payload.position } : {}),
            updatedAt: payload.updatedAt,
          };
        });

        return {
          ...current,
          tasks: nextTasks,
        };
      });
    });

    return () => {
      unsubscribeTaskPatched();
    };
  }, [detailQueryKey, projectId, queryClient]);

  return useAppQuery<ProjectDetailDTO>({
    queryKey: detailQueryKey,
    queryFn: () => getProjectDetail(projectId, showArchived),
    enabled: !!projectId,
    errorMessage: 'Không thể tải chi tiết dự án',
  });
}
