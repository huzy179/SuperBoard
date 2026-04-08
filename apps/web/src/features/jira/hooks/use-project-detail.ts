import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectDetailDTO } from '@superboard/shared';
import { getProjectDetail } from '@/features/jira/api/project-service';
import { subscribeProjectDetailUpdated } from '@/lib/realtime/project-sync';
import {
  subscribeProjectSocketUpdated,
  subscribeProjectTaskPatched,
} from '@/lib/realtime/project-socket';

export function useProjectDetail(projectId: string, showArchived = false) {
  const queryClient = useQueryClient();
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingInvalidateRef = useRef(false);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const runInvalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId, { showArchived }] });
    };

    const scheduleInvalidate = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        hasPendingInvalidateRef.current = true;
        return;
      }

      if (invalidateTimerRef.current) {
        clearTimeout(invalidateTimerRef.current);
      }

      invalidateTimerRef.current = setTimeout(() => {
        invalidateTimerRef.current = null;
        hasPendingInvalidateRef.current = false;
        runInvalidate();
      }, 120);
    };

    const handleVisibilityChange = () => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible' &&
        hasPendingInvalidateRef.current
      ) {
        hasPendingInvalidateRef.current = false;
        if (invalidateTimerRef.current) {
          clearTimeout(invalidateTimerRef.current);
          invalidateTimerRef.current = null;
        }
        runInvalidate();
      }
    };

    const unsubscribeBroadcast = subscribeProjectDetailUpdated(projectId, scheduleInvalidate);
    const unsubscribeSocket = subscribeProjectSocketUpdated(projectId, scheduleInvalidate);
    const unsubscribeTaskPatched = subscribeProjectTaskPatched(projectId, (payload) => {
      queryClient.setQueryData<ProjectDetailDTO>(['projects', projectId], (current) => {
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

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      unsubscribeBroadcast();
      unsubscribeSocket();
      unsubscribeTaskPatched();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (invalidateTimerRef.current) {
        clearTimeout(invalidateTimerRef.current);
        invalidateTimerRef.current = null;
      }
      hasPendingInvalidateRef.current = false;
    };
  }, [projectId, queryClient]);

  return useQuery<ProjectDetailDTO>({
    queryKey: ['projects', projectId, { showArchived }],
    queryFn: () => getProjectDetail(projectId, showArchived),
    enabled: !!projectId,
  });
}
