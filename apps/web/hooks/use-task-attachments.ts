import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadTaskAttachment, deleteAttachment } from '@/lib/services/upload-service';

export function useUploadAttachment(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadTaskAttachment(taskId, file),
    onSuccess: () => {
      toast.success('Đã tải lên tệp đính kèm');
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
    onError: () => {
      toast.error('Không thể tải lên tệp đính kèm');
    },
  });
}

export function useDeleteAttachment(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
    onSuccess: () => {
      toast.success('Đã xoá tệp đính kèm');
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
    onError: () => {
      toast.error('Không thể xoá tệp đính kèm');
    },
  });
}
