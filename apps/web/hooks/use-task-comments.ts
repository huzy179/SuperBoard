import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommentItemDTO, TaskHistoryItemDTO } from '@superboard/shared';
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment,
} from '@/lib/services/comment-service';
import { getTaskHistory } from '@/lib/services/task-service';
import {
  publishTaskCommentsUpdated,
  subscribeTaskCommentsUpdated,
} from '@/lib/realtime/project-sync';

function commentQueryKey(projectId: string, taskId: string) {
  return ['projects', projectId, 'tasks', taskId, 'comments'] as const;
}

function taskHistoryQueryKey(projectId: string, taskId: string) {
  return ['projects', projectId, 'tasks', taskId, 'history'] as const;
}

export function useTaskComments(projectId: string, taskId: string) {
  const queryClient = useQueryClient();
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingInvalidateRef = useRef(false);

  useEffect(() => {
    if (!projectId || !taskId) {
      return;
    }

    const runInvalidate = () => {
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(projectId, taskId) });
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

    const unsubscribe = subscribeTaskCommentsUpdated(projectId, taskId, scheduleInvalidate);
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
  }, [projectId, queryClient, taskId]);

  return useQuery<CommentItemDTO[]>({
    queryKey: commentQueryKey(projectId, taskId),
    queryFn: () => getTaskComments(projectId, taskId),
    enabled: !!projectId && !!taskId,
  });
}

export function useTaskHistory(projectId: string, taskId: string) {
  return useQuery<TaskHistoryItemDTO[]>({
    queryKey: taskHistoryQueryKey(projectId, taskId),
    queryFn: () => getTaskHistory(projectId, taskId),
    enabled: !!projectId && !!taskId,
  });
}

export function useCreateComment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => createTaskComment(projectId, taskId, { content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(projectId, taskId) });
      void queryClient.invalidateQueries({ queryKey: taskHistoryQueryKey(projectId, taskId) });
      publishTaskCommentsUpdated(projectId, taskId);
    },
  });
}

export function useUpdateComment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateTaskComment(projectId, taskId, commentId, { content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(projectId, taskId) });
      void queryClient.invalidateQueries({ queryKey: taskHistoryQueryKey(projectId, taskId) });
      publishTaskCommentsUpdated(projectId, taskId);
    },
  });
}

export function useDeleteComment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteTaskComment(projectId, taskId, commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(projectId, taskId) });
      void queryClient.invalidateQueries({ queryKey: taskHistoryQueryKey(projectId, taskId) });
      publishTaskCommentsUpdated(projectId, taskId);
    },
  });
}
