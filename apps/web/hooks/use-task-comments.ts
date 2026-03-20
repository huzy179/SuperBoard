import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommentItemDTO } from '@superboard/shared';
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment,
} from '@/lib/services/comment-service';

function commentQueryKey(projectId: string, taskId: string) {
  return ['projects', projectId, 'tasks', taskId, 'comments'] as const;
}

export function useTaskComments(projectId: string, taskId: string) {
  return useQuery<CommentItemDTO[]>({
    queryKey: commentQueryKey(projectId, taskId),
    queryFn: () => getTaskComments(projectId, taskId),
    enabled: !!projectId && !!taskId,
  });
}

export function useCreateComment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => createTaskComment(projectId, taskId, { content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(projectId, taskId) });
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
    },
  });
}

export function useDeleteComment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteTaskComment(projectId, taskId, commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(projectId, taskId) });
    },
  });
}
