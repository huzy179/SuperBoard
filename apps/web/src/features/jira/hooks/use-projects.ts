import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectItemDTO } from '@superboard/shared';
import { getProjects } from '@/features/jira/api/project-service';
import { subscribeProjectsListUpdated } from '@/lib/realtime/project-sync';

export function useProjects() {
  const queryClient = useQueryClient();
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingInvalidateRef = useRef(false);

  useEffect(() => {
    const runInvalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
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

    const unsubscribe = subscribeProjectsListUpdated(scheduleInvalidate);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      unsubscribe();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (invalidateTimerRef.current) {
        clearTimeout(invalidateTimerRef.current);
        invalidateTimerRef.current = null;
      }
      hasPendingInvalidateRef.current = false;
    };
  }, [queryClient]);

  return useQuery<ProjectItemDTO[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });
}
