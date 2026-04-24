import type {
  CommentItemDTO,
  CreateCommentRequestDTO,
  UpdateCommentRequestDTO,
} from '@superboard/shared';
import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const getTaskComments = (
  projectId: string,
  taskId: string,
  params?: { cursor?: string; limit?: number },
) => {
  const queryParams = new URLSearchParams();
  if (params?.cursor) queryParams.set('cursor', params.cursor);
  if (params?.limit) queryParams.set('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const url = `${API_ENDPOINTS.projects.listComments(projectId, taskId)}${queryString ? `?${queryString}` : ''}`;

  return authApi.get<CommentItemDTO[]>(url);
};

export const createTaskComment = (
  projectId: string,
  taskId: string,
  payload: CreateCommentRequestDTO,
) => authApi.post<CommentItemDTO>(API_ENDPOINTS.projects.createComment(projectId, taskId), payload);

export const updateTaskComment = (
  projectId: string,
  taskId: string,
  commentId: string,
  payload: UpdateCommentRequestDTO,
) =>
  authApi.patch<CommentItemDTO>(
    API_ENDPOINTS.projects.updateComment(projectId, taskId, commentId),
    payload,
  );

export const deleteTaskComment = (projectId: string, taskId: string, commentId: string) =>
  authApi.delete<{ deleted: boolean }>(
    API_ENDPOINTS.projects.deleteComment(projectId, taskId, commentId),
  );
