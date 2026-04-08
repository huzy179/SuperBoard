import { apiPost, apiDelete } from '../api-client';
import { API_ENDPOINTS } from '../api/endpoints';
import type { ProjectTaskAttachmentDTO } from '@superboard/shared';

export async function uploadTaskAttachment(
  taskId: string,
  file: File,
): Promise<ProjectTaskAttachmentDTO> {
  const formData = new FormData();
  formData.append('file', file);

  return apiPost<ProjectTaskAttachmentDTO>(
    API_ENDPOINTS.projects.uploadAttachment(taskId),
    formData,
    { auth: true },
  );
}

export async function deleteAttachment(attachmentId: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(API_ENDPOINTS.projects.deleteAttachment(attachmentId), {
    auth: true,
  });
}
