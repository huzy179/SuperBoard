import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAppMutation } from '@/lib/hooks/use-app-mutation';
import type { CommentItemDTO, TaskHistoryItemDTO } from '@superboard/shared';
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment,
} from '@/features/operations/task/api/comment-service';
import { getTaskHistory } from '@/features/operations/task/api/task-service';
import {
  publishTaskCommentsUpdated,
  subscribeTaskCommentsUpdated,
} from '@/lib/realtime/project-sync';
import { subscribeTaskComments } from '@/lib/realtime/project-socket';

function commentQueryKey(projectId: string, taskId: string) {
  return ['projects', projectId, 'tasks', taskId, 'comments'] as const;
}

function taskHistoryQueryKey(projectId: string, taskId: string) {
  return ['projects', projectId, 'tasks', taskId, 'history'] as const;
}

export function useTaskComments(projectId: string, taskId: string, limit = 50) {
  const queryClient = useQueryClient();
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingInvalidateRef = useRef(false);

  useEffect(() => {
    if (!projectId || !taskId) {
      return;
    }

    const runInvalidate = () => {
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(projectId, taskId) });
      void queryClient.invalidateQueries({ queryKey: taskHistoryQueryKey(projectId, taskId) });
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

    const unsubscribeSync = subscribeTaskCommentsUpdated(projectId, taskId, scheduleInvalidate);
    const unsubscribeSocket = subscribeTaskComments(projectId, taskId, (payload) => {
      if (payload.taskId === taskId) {
        scheduleInvalidate();
      }
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      unsubscribeSync();
      unsubscribeSocket();
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

  return useInfiniteQuery({
    queryKey: commentQueryKey(projectId, taskId),
    queryFn: ({ pageParam }) =>
      getTaskComments(projectId, taskId, {
        ...(pageParam ? { cursor: pageParam as string } : {}),
        limit,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CommentItemDTO[]) => {
      // If we got 'limit + 1' items, the last one is the cursor for the next page
      if (lastPage && lastPage.length > limit) {
        const lastItem = lastPage[lastPage.length - 1];
        return lastItem ? lastItem.id : undefined;
      }
      return undefined;
    },
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
  return useAppMutation({
    mutationFn: (content: string) => createTaskComment(projectId, taskId, { content }),
    resource: 'Bình luận',
    action: 'send',
    invalidateKeys: [commentQueryKey(projectId, taskId), taskHistoryQueryKey(projectId, taskId)],
    onSuccess: () => {
      publishTaskCommentsUpdated(projectId, taskId);
    },
  });
}

export function useUpdateComment(projectId: string, taskId: string) {
  return useAppMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateTaskComment(projectId, taskId, commentId, { content }),
    resource: 'Bình luận',
    action: 'update',
    invalidateKeys: [commentQueryKey(projectId, taskId), taskHistoryQueryKey(projectId, taskId)],
    onSuccess: () => {
      publishTaskCommentsUpdated(projectId, taskId);
    },
  });
}

export function useDeleteComment(projectId: string, taskId: string) {
  return useAppMutation({
    mutationFn: (commentId: string) => deleteTaskComment(projectId, taskId, commentId),
    resource: 'Bình luận',
    action: 'delete',
    invalidateKeys: [commentQueryKey(projectId, taskId), taskHistoryQueryKey(projectId, taskId)],
    onSuccess: () => {
      publishTaskCommentsUpdated(projectId, taskId);
    },
  });
}
