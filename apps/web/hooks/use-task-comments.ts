import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { subscribeTaskComments } from '@/lib/realtime/project-socket';

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

    const unsubscribeSync = subscribeTaskCommentsUpdated(projectId, taskId, scheduleInvalidate);
    const unsubscribeSocket = subscribeTaskComments(projectId, (payload) => {
      if (payload.taskId === taskId) {
        scheduleInvalidate();
        if (payload.type === 'added') {
          // Additional logic like toast or sound if needed
        }
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
      toast.success('Đã gửi bình luận');
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(projectId, taskId) });
      void queryClient.invalidateQueries({ queryKey: taskHistoryQueryKey(projectId, taskId) });
      publishTaskCommentsUpdated(projectId, taskId);
    },
    onError: () => {
      toast.error('Không thể gửi bình luận');
    },
  });
}

export function useUpdateComment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateTaskComment(projectId, taskId, commentId, { content }),
    onSuccess: () => {
      toast.success('Đã cập nhật bình luận');
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(projectId, taskId) });
      void queryClient.invalidateQueries({ queryKey: taskHistoryQueryKey(projectId, taskId) });
      publishTaskCommentsUpdated(projectId, taskId);
    },
    onError: () => {
      toast.error('Không thể cập nhật bình luận');
    },
  });
}

export function useDeleteComment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteTaskComment(projectId, taskId, commentId),
    onSuccess: () => {
      toast.success('Đã xoá bình luận');
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(projectId, taskId) });
      void queryClient.invalidateQueries({ queryKey: taskHistoryQueryKey(projectId, taskId) });
      publishTaskCommentsUpdated(projectId, taskId);
    },
    onError: () => {
      toast.error('Không thể xoá bình luận');
    },
  });
}
