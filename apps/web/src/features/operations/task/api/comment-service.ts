import type {
  CommentItemDTO,
  CreateCommentRequestDTO,
  UpdateCommentRequestDTO,
} from '@superboard/shared';
import { apiGet, apiPost, apiRequest } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export async function getTaskComments(
  projectId: string,
  taskId: string,
  params?: { cursor?: string; limit?: number },
): Promise<CommentItemDTO[]> {
  const queryParams = new URLSearchParams();
  if (params?.cursor) queryParams.set('cursor', params.cursor);
  if (params?.limit) queryParams.set('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const url = `${API_ENDPOINTS.projects.listComments(projectId, taskId)}${queryString ? `?${queryString}` : ''}`;

  return apiGet<CommentItemDTO[]>(url, {
    auth: true,
  });
}

export async function createTaskComment(
  projectId: string,
  taskId: string,
  payload: CreateCommentRequestDTO,
): Promise<CommentItemDTO> {
  return apiPost<CommentItemDTO>(API_ENDPOINTS.projects.createComment(projectId, taskId), payload, {
    auth: true,
  });
}

export async function updateTaskComment(
  projectId: string,
  taskId: string,
  commentId: string,
  payload: UpdateCommentRequestDTO,
): Promise<CommentItemDTO> {
  return apiRequest<CommentItemDTO>(
    API_ENDPOINTS.projects.updateComment(projectId, taskId, commentId),
    {
      auth: true,
      method: 'PATCH',
      body: payload,
    },
  );
}

export async function deleteTaskComment(
  projectId: string,
  taskId: string,
  commentId: string,
): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(
    API_ENDPOINTS.projects.deleteComment(projectId, taskId, commentId),
    {
      auth: true,
      method: 'DELETE',
    },
  );
}
