import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createWorkspace } from '@/features/workspace/api/workspace-service';
import { WorkspaceItemDTO } from '@superboard/shared';

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation<WorkspaceItemDTO, Error, { name: string; slug?: string }>({
    mutationFn: (data) => createWorkspace(data),
    onSuccess: (newWorkspace) => {
      toast.success(`Đã tạo workspace "${newWorkspace.name}" thành công!`);
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tạo workspace');
    },
  });
}
